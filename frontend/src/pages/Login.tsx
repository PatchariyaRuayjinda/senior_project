import { LoginTemplate } from "../components/templates/LoginTemplate";
import { LoginForm } from "../features/auth/components/LoginForm";

export function Login({ initialError }: { initialError?: string }) {
  return (
    <LoginTemplate>
      <LoginForm initialError={initialError} />
    </LoginTemplate>
  );
}
