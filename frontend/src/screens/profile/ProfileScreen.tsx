import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { FormField } from "@/components/forms/FormField";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { useLogout, useProfile, useUpdateProfile } from "@/hooks/useProfile";
import {
  profileFormSchema,
  type ProfileFormValues
} from "@/schemas/profile.schemas";
import { getApiErrorMessage } from "@/utils/api-error";

export function ProfileScreen() {
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
    <SafeAreaView style={{ flex: 1, backgroundColor: "white" }}>
      <View className="h-16 justify-center border-b border-neutral-200 px-4">
        <Text className="text-2xl font-semibold text-neutral-950">Profile</Text>
      </View>

      {profileQuery.isPending ? (
        <View className="flex-1 items-center justify-center gap-3">
          <ActivityIndicator color="#171717" />
          <Text className="text-sm text-neutral-600">Loading profile</Text>
        </View>
      ) : profileQuery.isError ? (
        <View className="flex-1 items-center justify-center gap-4 px-6">
          <Text className="text-center text-sm text-red-700">
            {getApiErrorMessage(profileQuery.error)}
          </Text>
          <Pressable
            accessibilityRole="button"
            className="h-11 items-center justify-center rounded-md bg-neutral-950 px-5"
            onPress={() => void profileQuery.refetch()}
          >
            <Text className="font-semibold text-white">Retry</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            className="h-11 items-center justify-center px-5"
            onPress={logout}
          >
            <Text className="font-semibold text-red-700">Log Out</Text>
          </Pressable>
        </View>
      ) : profileQuery.data === undefined ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-center text-base text-neutral-600">Profile not found.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
          <View className="gap-5">
            <View className="gap-2">
              <Text className="text-sm font-medium text-neutral-800">Email</Text>
              <View className="h-12 justify-center rounded-md border border-neutral-200 bg-neutral-100 px-4">
                <Text className="text-base text-neutral-700">{profileQuery.data.email}</Text>
              </View>
            </View>

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
              <Text className="text-sm text-green-700">Profile updated.</Text>
            ) : null}

            {updateProfileMutation.isError ? (
              <Text className="text-sm text-red-700">
                {getApiErrorMessage(updateProfileMutation.error)}
              </Text>
            ) : null}

            <SubmitButton
              isLoading={updateProfileMutation.isPending}
              label="Save Profile"
              loadingLabel="Saving Profile"
              onPress={saveProfile}
            />

            <Pressable
              accessibilityRole="button"
              className="mt-4 h-12 items-center justify-center rounded-md border border-red-300 px-4"
              disabled={updateProfileMutation.isPending}
              onPress={logout}
            >
              <Text className="font-semibold text-red-700">Log Out</Text>
            </Pressable>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
