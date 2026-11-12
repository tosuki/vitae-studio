import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CVData } from "../types/cv.model";
import {
    createResumeParseTask,
    getEnrichmentTask,
    TaskResponse,
    TaskStatus
} from "../service/cv.service";

export function useResumeUpload() {
    const [taskId, setTaskId] = useState<string | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const uploadMutation = useMutation({
        mutationFn: async (file: File) => {
            setErrorMsg(null);
            const result = await createResumeParseTask(file);
            if (result.err) {
                throw new Error(result.err.message);
            }
            return result.data;
        },
        onSuccess: (data) => {
            if (data && data.id) {
                setTaskId(data.id);
            }
        },
        onError: (err: unknown) => {
            const msg = err instanceof Error ? err.message : "Falha ao enviar o currículo para extração.";
            setErrorMsg(msg);
        }
    });

    const taskQuery = useQuery({
        queryKey: ["resume-parse-task", taskId],
        queryFn: async () => {
            if (!taskId) return null;
            const result = await getEnrichmentTask(taskId);
            if (result.err) {
                throw new Error(result.err.message);
            }
            return result.data;
        },
        enabled: !!taskId,
        refetchInterval: (query) => {
            const task = query.state.data;
            if (!task) return 1500;
            if (task.status === "DONE" || task.status === "FAILED") {
                return false;
            }
            return 1500;
        }
    });

    const taskData: TaskResponse | null = taskQuery.data || null;
    const currentStatus: TaskStatus | "IDLE" | "UPLOADING" = uploadMutation.isPending
        ? "UPLOADING"
        : taskData
        ? taskData.status
        : "IDLE";

    let progress = 0;
    let statusLabel = "";

    if (uploadMutation.isPending) {
        progress = 20;
        statusLabel = "Enviando arquivo e extraindo texto bruto...";
    } else if (uploadMutation.isError) {
        progress = 100;
        statusLabel = errorMsg || "Erro na leitura do arquivo.";
    } else if (taskData) {
        switch (taskData.status) {
            case "PENDING":
                progress = 40;
                statusLabel = "Texto extraído! Aguardando na fila de IA...";
                break;
            case "EXTRACTING_GEMINI":
                progress = 75;
                statusLabel = "Estruturando experiências, formação e habilidades com IA...";
                break;
            case "DONE":
                progress = 100;
                statusLabel = "Dados do currículo extraídos com sucesso!";
                break;
            case "FAILED":
                progress = 100;
                statusLabel = taskData.errorMessage || "Ocorreu um erro durante a extração por IA.";
                break;
            default:
                progress = 0;
                statusLabel = "";
        }
    }

    const startResumeUpload = (file: File) => {
        setTaskId(null);
        setErrorMsg(null);
        uploadMutation.mutate(file);
    };

    const reset = () => {
        setTaskId(null);
        setErrorMsg(null);
        uploadMutation.reset();
    };

    const isPending =
        uploadMutation.isPending ||
        (!!taskId && taskData?.status !== "DONE" && taskData?.status !== "FAILED");
    const isSuccess = taskData?.status === "DONE" && !!taskData.enrichedCV;
    const isError = uploadMutation.isError || taskData?.status === "FAILED";
    const finalError = errorMsg || (taskData?.status === "FAILED" ? taskData.errorMessage : null);
    const extractedCV: Omit<CVData, "style"> | null = taskData?.enrichedCV || null;

    return {
        startResumeUpload,
        reset,
        status: currentStatus,
        progress,
        statusLabel,
        isPending,
        isSuccess,
        isError,
        errorMessage: finalError,
        extractedCV
    };
}
