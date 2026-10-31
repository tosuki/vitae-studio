import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    fetchProviderModels,
    getSettings,
    ListModelsPayload,
    PublicSettings,
    testSettingsConnection,
    TestConnectionPayload,
    updateSettings,
    UpdateSettingsPayload
} from "../service/settings.service";

export const SETTINGS_QUERY_KEY = ["app-settings"] as const;

export function useSettings() {
    const queryClient = useQueryClient();

    const settingsQuery = useQuery({
        queryKey: SETTINGS_QUERY_KEY,
        queryFn: async (): Promise<PublicSettings> => {
            const result = await getSettings();
            if (result.err) {
                throw new Error(result.err.message);
            }
            return result.data;
        },
        retry: 1,
        staleTime: 30000,
        refetchOnWindowFocus: false
    });

    const saveMutation = useMutation({
        mutationFn: async (payload: UpdateSettingsPayload) => {
            const result = await updateSettings(payload);
            if (result.err) {
                throw new Error(result.err.message);
            }
            return result.data;
        },
        onSuccess: (updated) => {
            queryClient.setQueryData(SETTINGS_QUERY_KEY, updated);
        }
    });

    const testMutation = useMutation({
        mutationFn: async (payload: TestConnectionPayload) => {
            const result = await testSettingsConnection(payload);
            if (result.err) {
                throw new Error(result.err.message);
            }
            return result.data;
        }
    });

    const modelsMutation = useMutation({
        mutationFn: async (payload: ListModelsPayload) => {
            const result = await fetchProviderModels(payload);
            if (result.err) {
                throw new Error(result.err.message);
            }
            return result.data;
        }
    });

    return {
        settings: settingsQuery.data ?? null,
        isLoading: settingsQuery.isLoading,
        isFetched: settingsQuery.isFetched,
        isError: settingsQuery.isError,
        error: settingsQuery.error instanceof Error ? settingsQuery.error.message : null,
        isConfigured: Boolean(settingsQuery.data?.isConfigured),
        refetchSettings: settingsQuery.refetch,
        saveSettings: saveMutation.mutateAsync,
        isSaving: saveMutation.isPending,
        testConnection: testMutation.mutateAsync,
        isTesting: testMutation.isPending,
        loadModels: modelsMutation.mutateAsync,
        isLoadingModels: modelsMutation.isPending
    };
}
