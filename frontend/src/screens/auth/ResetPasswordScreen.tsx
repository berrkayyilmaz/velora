import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Pressable, Text, View } from "react-native";

import { AuthScreenLayout } from "@/components/auth/AuthScreenLayout";
import { FormField } from "@/components/forms/FormField";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { usePasswordResetConfirmMutation } from "@/hooks/useAuthMutations";
import { resetPasswordFormSchema, type ResetPasswordFormValues } from "@/schemas/auth.schemas";
import { getApiErrorMessage } from "@/utils/api-error";

export function ResetPasswordScreen() {
  const router = useRouter();
  const [isComplete, setIsComplete] = useState(false);
  const passwordResetMutation = usePasswordResetConfirmMutation();
  const { control, handleSubmit } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordFormSchema),
    defaultValues: {
      token: "",
      newPassword: ""
    }
  });

  useEffect(() => {
    if (!isComplete) {
      return undefined;
    }

    const timeoutId = setTimeout(() => {
      router.replace("/sign-in");
    }, 1200);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [isComplete, router]);

  const onSubmit = handleSubmit((values) => {
    passwordResetMutation.reset();
    passwordResetMutation.mutate(values, {
      onSuccess: () => {
        setIsComplete(true);
      }
    });
  });

  return (
    <AuthScreenLayout title="Reset Password">
      <View className="gap-4">
        <Text className="text-sm leading-5 text-neutral-600">
          Enter your reset token and choose a new password.
        </Text>

        {passwordResetMutation.error !== null ? (
          <Text className="text-sm text-red-700">
            {getApiErrorMessage(passwordResetMutation.error)}
          </Text>
        ) : null}

        {isComplete ? (
          <View className="rounded-md border border-green-200 bg-green-50 p-4">
            <Text className="text-sm text-green-800">
              Password updated. Returning to sign in.
            </Text>
          </View>
        ) : null}

        <FormField
          control={control}
          name="token"
          label="Reset Token"
          inputProps={{
            autoCapitalize: "none",
            autoComplete: "off",
            editable: !isComplete
          }}
        />

        <FormField
          control={control}
          name="newPassword"
          label="New Password"
          inputProps={{
            autoCapitalize: "none",
            autoComplete: "new-password",
            editable: !isComplete,
            secureTextEntry: true,
            textContentType: "newPassword"
          }}
        />

        <SubmitButton
          label="Reset Password"
          loadingLabel="Resetting Password"
          isLoading={passwordResetMutation.isPending || isComplete}
          onPress={onSubmit}
        />
      </View>

      <View className="mt-6 flex-row items-center justify-center gap-2">
        <Link href="/forgot-password" asChild>
          <Pressable accessibilityRole="button">
            <Text className="text-sm font-semibold text-neutral-900">Request a new token</Text>
          </Pressable>
        </Link>
      </View>

      <View className="mt-4 flex-row items-center justify-center gap-2">
        <Link href="/sign-in" asChild>
          <Pressable accessibilityRole="button">
            <Text className="text-sm text-neutral-600">Back to sign in</Text>
          </Pressable>
        </Link>
      </View>
    </AuthScreenLayout>
  );
}
