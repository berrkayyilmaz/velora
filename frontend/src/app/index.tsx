import { Redirect } from "expo-router";

import { useAuthStore } from "@/store/auth.store";

export default function IndexRoute() {
  const isAuthenticated = useAuthStore((state) => state.session !== null);

  return <Redirect href={isAuthenticated ? "/(tabs)/products" : "/sign-in"} />;
}
