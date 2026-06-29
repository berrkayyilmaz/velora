import { zodResolver } from "@hookform/resolvers/zod";
import { LogOut } from "lucide-react-native";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { FormField } from "@/components/forms/FormField";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Input } from "@/components/ui/Input";
import { LoadingState } from "@/components/ui/LoadingState";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useLogout, useProfile, useUpdateProfile } from "@/hooks/useProfile";
import { useThemeColors } from "@/hooks/useThemeColors";
import {
  profileFormSchema,
  type ProfileFormValues
} from "@/schemas/profile.schemas";
import { getApiErrorMessage } from "@/utils/api-error";

export function ProfileScreen() {
  const colors = useThemeColors();
  const profileQuery = useProfile();
  const updateProfileMutation = useUpdateProfile();
  const logout = useLogout();
  const { control, handleSubmit, reset } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      displayName: ""
    }
  });

  useEffect(() => {
    if (profileQuery.data !== undefined) {
      reset({
        displayName: profileQuery.data.displayName ?? ""
      });
    }
  }, [profileQuery.data, reset]);

  const saveProfile = handleSubmit((values) => {
    const displayName = values.displayName.trim();

    updateProfileMutation.reset();
    updateProfileMutation.mutate({
      displayName: displayName === "" ? null : displayName
    });
  });

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
      <ScreenHeader action={<ThemeToggle />} title="Profile" />

      {profileQuery.isPending ? (
        <LoadingState label="Loading profile" />
      ) : profileQuery.isError ? (
        <View className="flex-1">
          <ErrorState
            message={getApiErrorMessage(profileQuery.error)}
            onRetry={() => void profileQuery.refetch()}
          />
          <Button className="mx-6 mb-6" onPress={logout} variant="destructive-outline">
            Log Out
          </Button>
        </View>
      ) : profileQuery.data === undefined ? (
        <EmptyState title="Profile not found" />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
          <View className="gap-5">
            <Input editable={false} label="Email" value={profileQuery.data.email} />

            <FormField
              control={control}
              inputProps={{
                autoCapitalize: "words",
                autoComplete: "name",
                maxLength: 100,
                returnKeyType: "done",
                textContentType: "name",
                onSubmitEditing: saveProfile
              }}
              label="Display Name"
              name="displayName"
            />

            {updateProfileMutation.isSuccess ? (
              <Text className="text-label text-success dark:text-success-dark">
                Profile updated.
              </Text>
            ) : null}

            {updateProfileMutation.isError ? (
              <Text className="text-label text-destructive dark:text-destructive-dark">
                {getApiErrorMessage(updateProfileMutation.error)}
              </Text>
            ) : null}

            <SubmitButton
              isLoading={updateProfileMutation.isPending}
              label="Save Profile"
              loadingLabel="Saving Profile"
              onPress={saveProfile}
            />

            <Button
              className="mt-4"
              disabled={updateProfileMutation.isPending}
              leftIcon={<LogOut color={colors.destructive} size={18} />}
              onPress={logout}
              size="lg"
              variant="destructive-outline"
            >
              Log Out
            </Button>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
