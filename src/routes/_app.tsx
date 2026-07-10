import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import { auth } from "@/lib/auth";

export const Route = createFileRoute("/_app")({
  beforeLoad: () => {
    if (!auth.get().user) throw redirect({ to: "/login" });
  },
  component: () => <Outlet />,
});
