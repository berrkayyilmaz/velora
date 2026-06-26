import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "expo-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Pressable, Text, View } from "react-native";

import { AuthScreenLayout } from "@/components/auth/AuthScreenLayout";
import { FormField } from "@/components/forms/FormField";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { usePasswordResetRequestMutation } from "@/hooks/useAuthMutations";
import {
  forgotPasswordFormSchema,
  type ForgotPasswordFormValues
} from "@/schemas/auth.schemas";
import { getApiErrorMessage } from "@/utils/api-error";

export function ForgotPasswordScreen() {
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const passwordResetMutation = usePasswordResetRequestMutation();
  const { control, handleSubmit } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordFormSchema),
    defaultValues: {
      email: ""
    }
  });

  const onSubmit = handleSubmit((values) => {
    passwordResetMutation.reset();
    setSubmittedEmail(null);
    passwordResetMutation.mutate(values, {
      onSuccess: () => {
        setSubmittedEmail(values.email);
      }
    });
  });

  return (
    <AuthScreenLayout title="Forgot Password">
      <View className="gap-4">
        <Text className="text-sm leading-5 text-neutral-600">
          Enter your account email to request a password reset token.
        </Text>

        {passwordResetMutation.error !== null ? (
          <Text className="text-sm text-red-700">
            {getApiErrorMessage(passwordResetMutation.error)}
          </Text>
        ) : null}

        {submittedEmail !== null ? (
          <View className="gap-3 rounded-md border border-green-200 bg-green-50 p-4">
            <Text className="text-sm text-green-800">
              If an account exists for {submittedEmail}, a reset token has been generated.
            </Text>
            {passwordResetMutation.data?.resetToken !== undefined ? (
              <View className="gap-2">
                <Text className="text-sm font-semibold text-green-900">Development token</Text>
                <Text selectable className="text-sm text-green-900">
                  {passwordResetMutation.data.resetToken}
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}

        <FormField
          control={control}
          name="email"
          label="Email"
          inputProps={{
            autoCapitalize: "none",
            autoComplete: "email",
            keyboardType: "email-address",
            textContentType: "emailAddress"
          }}
        />

        <SubmitButton
          label="Request Reset Token"
          loadingLabel="Requesting Token"
          isLoading={passwordResetMutation.isPending}
          onPress={onSubmit}
        />
      </View>

      <View className="mt-6 flex-row items-center justify-center gap-2">
        <Link href="/reset-password" asChild>
          <Pressable accessibilityRole="button">
            <Text className="text-sm font-semibold text-neutral-900">I have a reset token</Text>
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
