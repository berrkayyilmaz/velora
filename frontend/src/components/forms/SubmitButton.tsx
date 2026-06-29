import { Button } from "@/components/ui/Button";

type SubmitButtonProps = {
  label: string;
  loadingLabel: string;
  isLoading: boolean;
  onPress: () => void;
};

export function SubmitButton({ label, loadingLabel, isLoading, onPress }: SubmitButtonProps) {
  return (
    <Button
      className="mt-2"
      isLoading={isLoading}
      loadingLabel={loadingLabel}
      onPress={onPress}
      size="lg"
    >
      {label}
    </Button>
  );
}
