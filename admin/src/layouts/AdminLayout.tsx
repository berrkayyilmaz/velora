import {
  BarChart3,
  Boxes,
  LayoutDashboard,
  LogOut,
  Package,
  Shapes,
  Store,
  type LucideIcon
} from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";

import { queryClient } from "@/config/query-client";
import { useAdminAuth } from "@/store/useAdminAuth";

type NavigationItem = {
  label: string;
  path: string;
  icon: LucideIcon;
  end?: boolean;
};

const navigationItems: NavigationItem[] = [
  { label: "Dashboard", path: "/", icon: LayoutDashboard, end: true },
  { label: "Products", path: "/products", icon: Package },
  { label: "Brands", path: "/brands", icon: Boxes },
  { label: "Categories", path: "/categories", icon: Shapes },
  { label: "Source Platforms", path: "/source-platforms", icon: Store },
  { label: "Analytics", path: "/analytics", icon: BarChart3 }
];

type AdminAccountProps = {
  email: string | undefined;
  onLogout: () => void;
};

function AdminAccount({ email, onLogout }: AdminAccountProps) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">Signed in as</p>
        <p className="truncate text-sm font-medium" title={email}>
          {email ?? "Administrator"}
        </p>
      </div>
      <button
        aria-label="Log out"
        className="inline-flex size-9 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-accent hover:text-foreground"
        onClick={onLogout}
        title="Log out"
        type="button"
      >
        <LogOut aria-hidden="true" size={17} />
      </button>
    </div>
  );
}

export function AdminLayout() {
  const navigate = useNavigate();
  const { session, clearSession } = useAdminAuth();

  const logout = () => {
    queryClient.clear();
    clearSession();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-[15rem_minmax(0,1fr)]">
      <aside className="border-b border-border bg-background lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:border-r lg:border-b-0">
        <div className="flex h-16 items-center border-b border-border px-4 lg:px-5">
          <NavLink className="text-lg font-semibold" end to="/">
            Velora Admin
          </NavLink>
        </div>

        <nav
          aria-label="Admin navigation"
          className="flex gap-1 overflow-x-auto p-2 lg:flex-1 lg:flex-col lg:overflow-visible lg:p-3"
        >
          {navigationItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                className={({ isActive }) =>
                  `inline-flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`
                }
                end={item.end}
                key={item.path}
                to={item.path}
              >
                <Icon aria-hidden="true" size={17} />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="border-t border-border p-4">
          <AdminAccount email={session?.adminUser.email} onLogout={logout} />
        </div>
      </aside>

      <div className="min-w-0">
        <Outlet />
      </div>
    </div>
  );
}
