import { type FormEvent, useState } from "react";

import { useAdminLogin } from "@/hooks/useAdminLogin";
import { getApiErrorMessage } from "@/utils/api-error";

export function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const loginMutation = useAdminLogin();

  const submitLogin = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    loginMutation.reset();
    loginMutation.mutate({ email, password });
  };

  return (
    <main>
      <h1>Admin Login</h1>
      <form onSubmit={submitLogin}>
        {loginMutation.isError ? <p role="alert">{getApiErrorMessage(loginMutation.error)}</p> : null}

        <label htmlFor="email">Email</label>
        <input
          autoComplete="email"
          id="email"
          name="email"
          onChange={(event) => setEmail(event.target.value)}
          required
          type="email"
          value={email}
        />

        <label htmlFor="password">Password</label>
        <input
          autoComplete="current-password"
          id="password"
          name="password"
          onChange={(event) => setPassword(event.target.value)}
          required
          type="password"
          value={password}
        />

        <button disabled={loginMutation.isPending} type="submit">
          {loginMutation.isPending ? "Signing In" : "Sign In"}
        </button>
      </form>
    </main>
  );
}
