import { X } from "lucide-react-native";
import type { PropsWithChildren, ReactNode } from "react";
import { Modal as NativeModal, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useThemeColors } from "@/hooks/useThemeColors";

type ModalProps = PropsWithChildren<{
  visible: boolean;
  title: string;
  description?: string;
  footer?: ReactNode;
  presentation?: "sheet" | "full";
  onClose: () => void;
}>;

export function Modal({
  children,
  visible,
  title,
  description,
  footer,
  presentation = "sheet",
  onClose
}: ModalProps) {
  const colors = useThemeColors();
  const isFull = presentation === "full";

  return (
    <NativeModal
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle={isFull ? "pageSheet" : undefined}
      transparent={!isFull}
      visible={visible}
    >
      <SafeAreaView
        className={`flex-1 ${isFull ? "bg-background dark:bg-background-dark" : "justify-end bg-black/50"}`}
      >
        <View
          className={`${isFull ? "flex-1" : "max-h-[84%] rounded-t-card"} bg-surface dark:bg-surface-dark`}
        >
          <View className="min-h-16 flex-row items-center border-b border-border px-5 py-3 dark:border-border-dark">
            <View className="flex-1 pr-4">
              <Text className="text-heading font-semibold text-foreground dark:text-foreground-dark">
                {title}
              </Text>
              {description === undefined ? null : (
                <Text
                  className="mt-1 text-label text-muted-foreground dark:text-muted-foreground-dark"
                  numberOfLines={1}
                >
                  {description}
                </Text>
              )}
            </View>
            <Pressable
              accessibilityLabel={`Close ${title}`}
              accessibilityRole="button"
              className="h-11 w-11 items-center justify-center"
              onPress={onClose}
            >
              <X color={colors.foreground} size={22} />
            </Pressable>
          </View>
          {children}
          {footer === undefined ? null : (
            <View className="border-t border-border p-4 dark:border-border-dark">{footer}</View>
          )}
        </View>
      </SafeAreaView>
    </NativeModal>
  );
}
