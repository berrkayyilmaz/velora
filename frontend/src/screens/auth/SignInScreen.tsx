import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "expo-router";
import { useForm } from "react-hook-form";
import { Pressable, Text, View } from "react-native";

import { AuthScreenLayout } from "@/components/auth/AuthScreenLayout";
import { FormField } from "@/components/forms/FormField";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { useLoginMutation } from "@/hooks/useAuthMutations";
import { loginFormSchema, type LoginFormValues } from "@/schemas/auth.schemas";
import { getApiErrorMessage } from "@/utils/api-error";

export function SignInScreen() {
  const loginMutation = useLoginMutation();
  const { control, handleSubmit } = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: "",
      password: ""
    }
  });

  const onSubmit = handleSubmit((values) => {
    loginMutation.reset();
    loginMutation.mutate(values);
  });

  return (
    <AuthScreenLayout title="Sign In">
      <View className="gap-4">
        {loginMutation.error !== null ? (
          <Text className="text-sm text-red-700">{getApiErrorMessage(loginMutation.error)}</Text>
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
        <FormField
          control={control}
          name="password"
          label="Password"
          inputProps={{
            autoCapitalize: "none",
            autoComplete: "current-password",
            secureTextEntry: true,
            textContentType: "password"
          }}
        />
        <View className="items-end">
          <Link href="/forgot-password" asChild>
            <Pressable accessibilityRole="button">
              <Text className="text-sm font-semibold text-neutral-900">Forgot password?</Text>
            </Pressable>
          </Link>
        </View>
        <SubmitButton
          label="Sign In"
          loadingLabel="Signing In"
          isLoading={loginMutation.isPending}
          onPress={onSubmit}
        />
      </View>

      <View className="mt-6 flex-row items-center justify-center gap-2">
        <Text className="text-sm text-neutral-600">New to Velora?</Text>
        <Link href="/sign-up" asChild>
          <Pressable accessibilityRole="button">
            <Text className="text-sm font-semibold text-neutral-900">Create account</Text>
          </Pressable>
        </Link>
      </View>
    </AuthScreenLayout>
  );
}
