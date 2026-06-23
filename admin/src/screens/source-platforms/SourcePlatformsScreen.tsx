import { CatalogManagementScreen } from "@/components/catalog/CatalogManagementScreen";

export function SourcePlatformsScreen() {
  return (
    <CatalogManagementScreen
      resource="source-platforms"
      singularLabel="Source Platform"
      supportsBaseUrl
      title="Source Platforms"
    />
  );
}
