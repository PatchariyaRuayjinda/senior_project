# Inventory playground

Reworking the undergraduate inventory project as a place to practise building
features and working with AI. The first working slice is authentication.

- `backend/`: Elysia + Bun + TypeScript, MongoDB native driver, JOSE and Argon2id.
- `frontend/`: React 18 + Vite + TypeScript.
- `legacy/`: the original application, preserved as reference.
- [Auth design and tradeoffs](docs/auth.md): token lifecycle, authorization and tests.

## Run locally

Use Node **22.12+** and Yarn **4.10.3**. Install each package separately:

```sh
cd backend
yarn install
cd ../frontend
yarn install
```

Bun 1.4.3 is a backend development dependency; Yarn uses its local binary.
Only Bun's installation script is enabled. The remaining dependencies do not run
installation scripts.

Start MongoDB from the repository root (or supply your own local MongoDB URI):

```sh
docker compose up -d mongodb
cp backend/.env.example backend/.env
```

Edit `backend/.env`: generate **two different** signing secrets using
`openssl rand -hex 32` and set your own admin/staff passwords (12–128 characters).
Keep this ignored file private. Use a fresh database: old account records have a
different schema and are not migrated.

In one terminal:

```sh
cd backend
yarn seed
yarn dev
```

In another:

```sh
cd frontend
yarn start
```

Open **http://localhost:5173**, matching `APP_ORIGIN` exactly. Vite proxies `/api`
to `http://127.0.0.1:3001`. Sign in with an account configured in `.env`.
The admin can open the users page; staff cannot access its API.
Seeding creates missing accounts without changing existing passwords or roles.
There is no public registration endpoint.

## Checks

```sh
cd backend
yarn typecheck
yarn test
```

Backend tests start an isolated MongoDB 7.0.24 process and exercise the actual
HTTP handlers. The first run downloads the MongoDB binary to `.cache/mongodb`.
No existing database is used or cleared.

```sh
cd frontend
yarn test
yarn build
yarn playwright install chromium
yarn test:e2e
```

Browser tests start their own API/database and Vite server on ports 3101/4173.
They cover login, simultaneous tab restoration, reload, logout across tabs,
server revocation, staff permissions and the mobile login layout. Screenshots
are written to the ignored `frontend/test-results/` directory.

## Current boundary

The active app contains login, automatic refresh, logout, account details and an
admin-only user list. Inventory workflows remain in `legacy/` until rebuilt.
This is a local learning setup; the Docker database is bound to loopback.
For hosting, serve the frontend and `/api` under one HTTPS origin and use the
production cookie configuration described in [the auth design](docs/auth.md).
