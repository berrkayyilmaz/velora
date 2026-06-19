import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "expo-router";
import { useForm } from "react-hook-form";
import { Pressable, Text, View } from "react-native";

import { AuthScreenLayout } from "@/components/auth/AuthScreenLayout";
import { FormField } from "@/components/forms/FormField";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { useRegisterMutation } from "@/hooks/useAuthMutations";
import { registerFormSchema, type RegisterFormValues } from "@/schemas/auth.schemas";
import { getApiErrorMessage } from "@/utils/api-error";

export function SignUpScreen() {
  const registerMutation = useRegisterMutation();
  const { control, handleSubmit } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      displayName: "",
      email: "",
      password: ""
    }
  });

  const onSubmit = handleSubmit((values) => {
    registerMutation.reset();
    registerMutation.mutate(values);
  });

  return (
    <AuthScreenLayout title="Create Account">
      <View className="gap-4">
        {registerMutation.error !== null ? (
          <Text className="text-sm text-red-700">
            {getApiErrorMessage(registerMutation.error)}
          </Text>
        ) : null}

        <FormField
          control={control}
          name="displayName"
          label="Name (optional)"
          inputProps={{
            autoCapitalize: "words",
            autoComplete: "name",
            textContentType: "name"
          }}
        />
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
            autoComplete: "new-password",
            secureTextEntry: true,
            textContentType: "newPassword"
          }}
        />
        <SubmitButton
          label="Create Account"
          loadingLabel="Creating Account"
          isLoading={registerMutation.isPending}
          onPress={onSubmit}
        />
      </View>

      <View className="mt-6 flex-row items-center justify-center gap-2">
        <Text className="text-sm text-neutral-600">Already have an account?</Text>
        <Link href="/sign-in" asChild>
          <Pressable accessibilityRole="button">
            <Text className="text-sm font-semibold text-neutral-900">Sign in</Text>
          </Pressable>
        </Link>
      </View>
    </AuthScreenLayout>
  );
}
