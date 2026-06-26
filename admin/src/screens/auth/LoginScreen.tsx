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
    <main className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <section className="w-full max-w-sm rounded-md border border-border bg-background p-6 shadow-sm">
        <h1 className="text-2xl font-semibold">Admin Login</h1>
        <form className="mt-6 grid gap-4" onSubmit={submitLogin}>
          {loginMutation.isError ? (
            <p className="text-sm text-destructive" role="alert">
              {getApiErrorMessage(loginMutation.error)}
            </p>
          ) : null}

          <label className="grid gap-1.5 text-sm font-medium" htmlFor="email">
            Email
            <input
              autoComplete="email"
              className="h-10 rounded-md border border-input bg-background px-3 outline-none focus:border-ring"
              id="email"
              name="email"
              onChange={(event) => setEmail(event.target.value)}
              required
              type="email"
              value={email}
            />
          </label>

          <label
            className="grid gap-1.5 text-sm font-medium"
            htmlFor="password"
          >
            Password
            <input
              autoComplete="current-password"
              className="h-10 rounded-md border border-input bg-background px-3 outline-none focus:border-ring"
              id="password"
              name="password"
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          </label>

          <button
            className="mt-2 h-10 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-50"
            disabled={loginMutation.isPending}
            type="submit"
          >
            {loginMutation.isPending ? "Signing In" : "Sign In"}
          </button>
        </form>
      </section>
    </main>
  );
}
