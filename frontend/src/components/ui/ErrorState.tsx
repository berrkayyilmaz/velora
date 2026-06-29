import { CircleAlert } from "lucide-react-native";

import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { useThemeColors } from "@/hooks/useThemeColors";

type ErrorStateProps = {
  message: string;
  onRetry?: () => void;
};

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  const colors = useThemeColors();

  return (
    <EmptyState
      action={
        onRetry === undefined ? undefined : <Button onPress={onRetry}>Retry</Button>
      }
      description={message}
      icon={<CircleAlert color={colors.destructive} size={28} />}
      title="Something went wrong"
    />
  );
}
