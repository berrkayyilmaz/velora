import { type PropsWithChildren } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type AuthScreenLayoutProps = PropsWithChildren<{
  title: string;
}>;

export function AuthScreenLayout({ title, children }: AuthScreenLayoutProps) {
  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-1 justify-center px-6 py-10">
            <Text className="mb-8 text-display font-semibold text-foreground dark:text-foreground-dark">
              {title}
            </Text>
            {children}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
