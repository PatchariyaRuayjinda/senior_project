# Authentication slice

Decision: build the flow ourselves using established cryptographic libraries.
JOSE signs/verifies tokens; Bun hashes/verifies passwords with Argon2id
(19 MiB memory, two iterations). No cryptographic primitive is implemented here.

## Lifecycle

```mermaid
sequenceDiagram
    participant Browser
    participant API as Elysia API
    participant DB as MongoDB
    Browser->>API: POST /api/auth/login (credentials)
    API->>DB: Verify user; create session with refresh hash
    API-->>Browser: Access JWT + user; HttpOnly refresh cookie
    Browser->>API: GET protected resource (Bearer access JWT)
    API->>DB: Check active session, enabled user, current role
    API-->>Browser: Resource or 401/403
    Browser->>API: POST /api/auth/refresh (cookie)
    API->>DB: Atomically replace matching refresh hash
    API-->>Browser: New access JWT + rotated refresh cookie
    Browser->>API: POST /api/auth/logout (cookie)
    API->>DB: Revoke session
    API-->>Browser: Clear cookie; 204
```

Access tokens expire after **15 minutes** and live only in browser memory.
An absolute **seven-day** session expiry limits both refresh tokens and access
tokens. Refresh does not extend this deadline. MongoDB TTL removes expired
sessions eventually; authorization queries enforce expiry immediately.

Refresh tokens are signed JWTs, stored in an HttpOnly cookie. Access and refresh
JWTs use different random keys, audiences and explicit token types. An access
token cannot be accepted as a refresh token, or vice versa. Both require an
expiration, issuer, audience, subject, session ID and token ID.

The session stores only a SHA-256 refresh-token hash. SHA-256 is appropriate for
these high-entropy tokens, while user passwords use Argon2id. Every successful
refresh gets a different token ID. MongoDB `findOneAndUpdate` performs the
compare-and-replace atomically in one document; no replica-set transaction is
needed. No history array grows with refresh requests.

A correctly signed but already consumed refresh token revokes its entire
session. A forged token fails signature verification before touching session
state. Logout also revokes the session; all its access tokens then fail even
if their JWT expiry is in the future. Other devices have independent sessions.
A successful new login revokes the previous session in that browser.

## Browser behavior and races

The frontend keeps one in-flight refresh promise per tab and retries a failed
resource request at most once. A 403 never triggers refresh. Web Locks serialize
login, refresh and logout across tabs that share the refresh cookie.
BroadcastChannel propagates login/logout UI changes without persisting tokens.
React StrictMode mounts share the same startup refresh operation.

The cross-tab guarantee depends on browser support for Web Locks. Browsers
without it still serialize within each tab, but simultaneous refreshes in
different tabs can trigger replay detection and require login again. A lost
network response after rotation can also require login again: this learning
implementation deliberately has no reuse grace period.

Logout changes the UI only after the server confirms revocation. A network
failure displays a retryable error; it is not presented as a successful logout.

## Authorization and HTTP boundary

There are two initial roles: `admin` and `staff`. Provisioning is the local seed
command. Public requests cannot create accounts or assign roles. Inventory
permissions will be designed alongside the corresponding workflows.

Every protected request verifies the access JWT, checks the session, and reads
the current enabled user from MongoDB. Permissions use the database role,
so disabling a user or changing a role takes effect on the next request.
Frontend navigation is presentation only; the API enforces access separately.

| Endpoint | Access |
| --- | --- |
| `GET /api/health` | Public |
| `POST /api/auth/login` | Credentials + trusted Origin |
| `POST /api/auth/refresh` | Refresh cookie + trusted Origin |
| `POST /api/auth/logout` | Trusted Origin; idempotent |
| `GET /api/auth/me` | Active authenticated session |
| `GET /api/admin/users` | Active session with current admin role |

All state-changing requests require an exact `Origin` match, including requests
without an Origin. This is a browser-focused API; scripts must explicitly send
the configured Origin. Refresh cookies use `SameSite=Strict`, `HttpOnly`, no
Domain attribute, and Path `/`. In production they also use `Secure` and the
`__Host-` cookie prefix, and configuration requires an HTTPS app origin.
Cookie flags and Origin validation work together against CSRF; HttpOnly alone
does not prevent CSRF or all consequences of XSS.

The deployment shape is one browser origin with `/api` reverse-proxied to the
loopback API. No cross-origin credentialed CORS is enabled. API responses have
`Cache-Control: no-store`. Credentials and tokens are never logged. Validation
errors expose no request bodies; incorrect credentials use one generic error.

Login has a 10-request/minute per-peer-IP limit; refresh has 60. These bounded
in-memory limits target one local API process. Proxy forwarding headers are not
trusted. A hosted reverse proxy would otherwise share one peer-IP bucket, so
hosting needs a deliberate trusted-proxy and shared rate-limiting configuration.

## Verification and follow-up

Backend integration tests use real, disposable MongoDB and actual Elysia request
handlers. They exercise rotation/replay, concurrent consumption, expiry,
revocation, current roles, disabled users, token substitution, forged tokens,
trusted origins, rate limiting and cookie flags. Frontend tests cover refresh
deduplication and login/logout UI behavior. Playwright covers the real browser,
cookie/proxy integration and cross-tab behavior.

Password recovery, account-management mutations, session-management UI, MFA and
third-party login are later features. This slice does not implement an OAuth
authorization server. RFC 9700 is used as a reference for refresh-token replay
defenses, rather than as a claim of OAuth compliance.

References:

- [OWASP session management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- [OWASP password storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- [RFC 9700 refresh-token protection](https://www.rfc-editor.org/rfc/rfc9700.html#section-4.14)
- [JOSE](https://github.com/panva/jose)
- [MongoDB compound operations](https://www.mongodb.com/docs/drivers/node/current/crud/compound-operations/)
