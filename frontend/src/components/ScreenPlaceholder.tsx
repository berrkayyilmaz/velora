import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type ScreenPlaceholderProps = {
  title: string;
};

export function ScreenPlaceholder({ title }: ScreenPlaceholderProps) {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View className="flex-1 items-center justify-center bg-background px-6 dark:bg-background-dark">
        <Text className="text-heading font-semibold text-foreground dark:text-foreground-dark">
          {title}
        </Text>
      </View>
    </SafeAreaView>
  );
}
