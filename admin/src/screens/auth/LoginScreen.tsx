import { type FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
      <Card className="w-full max-w-sm shadow-sm">
        <CardHeader>
          <h1 className="text-2xl font-semibold">Admin Login</h1>
          <p className="mt-1 text-sm text-muted-foreground">Internal Velora access</p>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4" onSubmit={submitLogin}>
          {loginMutation.isError ? (
            <p className="text-sm text-destructive" role="alert">
              {getApiErrorMessage(loginMutation.error)}
            </p>
          ) : null}

          <label className="grid gap-1.5 text-sm font-medium" htmlFor="email">
            Email
            <Input
              autoComplete="email"
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
            <Input
              autoComplete="current-password"
              id="password"
              name="password"
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          </label>

          <Button
            className="mt-2"
            isLoading={loginMutation.isPending}
            type="submit"
          >
            {loginMutation.isPending ? "Signing In" : "Sign In"}
          </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
