import { ActivityIndicator, Pressable, Text } from "react-native";

type SubmitButtonProps = {
  label: string;
  loadingLabel: string;
  isLoading: boolean;
  onPress: () => void;
};

export function SubmitButton({ label, loadingLabel, isLoading, onPress }: SubmitButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      className={`mt-2 h-12 flex-row items-center justify-center gap-2 rounded-md bg-neutral-950 px-4 ${
        isLoading ? "opacity-60" : ""
      }`}
      disabled={isLoading}
      onPress={onPress}
    >
      {isLoading ? <ActivityIndicator color="white" /> : null}
      <Text className="text-base font-semibold text-white">
        {isLoading ? loadingLabel : label}
      </Text>
    </Pressable>
  );
}
