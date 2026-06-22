import { createBrowserRouter } from "react-router-dom";

import { AdminLayout } from "@/layouts/AdminLayout";
import { AnalyticsScreen } from "@/screens/analytics/AnalyticsScreen";
import { LoginScreen } from "@/screens/auth/LoginScreen";
import { BrandsScreen } from "@/screens/brands/BrandsScreen";
import { CategoriesScreen } from "@/screens/categories/CategoriesScreen";
import { DashboardScreen } from "@/screens/dashboard/DashboardScreen";
import { ProductsScreen } from "@/screens/products/ProductsScreen";
import { SourcePlatformsScreen } from "@/screens/source-platforms/SourcePlatformsScreen";
import { ProtectedRoute } from "@/routes/ProtectedRoute";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginScreen />
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { index: true, element: <DashboardScreen /> },
          { path: "products", element: <ProductsScreen /> },
          { path: "brands", element: <BrandsScreen /> },
          { path: "categories", element: <CategoriesScreen /> },
          { path: "source-platforms", element: <SourcePlatformsScreen /> },
          { path: "analytics", element: <AnalyticsScreen /> }
        ]
      }
    ]
  }
]);
