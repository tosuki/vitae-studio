import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CVData, TargetedCuration } from "../types/cv.model";
import { createCurateTask, getEnrichmentTask, TaskStatus, TaskResponse } from "../service/cv.service";

export interface CurateJobParams {
  job: {
    roleTitle: string;
    jobDescription: string;
    company?: string;
  };
  cv: CVData;
}

export function useCuration() {
  const [taskId, setTaskId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: async ({ job, cv }: CurateJobParams) => {
      setErrorMsg(null);
      const result = await createCurateTask(job, cv);
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
    onError: (err: any) => {
      setErrorMsg(err.message || "Falha ao iniciar a curadoria por vaga.");
    }
  });

  const taskQuery = useQuery({
    queryKey: ['curation-task', taskId],
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
      if (task.status === 'DONE' || task.status === 'FAILED') {
        return false;
      }
      return 1500;
    }
  });

  const taskData: TaskResponse | null = taskQuery.data || null;
  const currentStatus: TaskStatus | 'IDLE' = createMutation.isPending
    ? 'PENDING'
    : taskData
    ? taskData.status
    : 'IDLE';

  let progress = 0;
  let statusLabel = "";

  if (createMutation.isPending) {
    progress = 10;
    statusLabel = "Enviando dados da vaga e perfil mestre...";
  } else if (createMutation.isError) {
    progress = 100;
    statusLabel = errorMsg || "Erro ao conectar com a API de curadoria.";
  } else if (taskData) {
    switch (taskData.status) {
      case 'PENDING':
        progress = 25;
        statusLabel = "Aguardando na fila de curadoria...";
        break;
      case 'EXTRACTING_GEMINI':
        progress = 75;
        statusLabel = "Curando experiências e compactando para 1 página A4 com IA...";
        break;
      case 'DONE':
        progress = 100;
        statusLabel = "Currículo calibrado com sucesso para 1 página A4!";
        break;
      case 'FAILED':
        progress = 100;
        statusLabel = taskData.errorMessage || "Ocorreu um erro no processamento da curadoria.";
        break;
      default:
        progress = 0;
        statusLabel = "";
    }
  }

  const isPending = currentStatus === 'PENDING' || currentStatus === 'EXTRACTING_GEMINI';
  const isSuccess = currentStatus === 'DONE' && Boolean(taskData?.curationResult);
  const isError = currentStatus === 'FAILED' || createMutation.isError;
  const curationResult: TargetedCuration | null = taskData?.curationResult || null;

  const reset = () => {
    setTaskId(null);
    setErrorMsg(null);
    createMutation.reset();
  };

  const startCuration = (job: CurateJobParams['job'], cv: CVData) => {
    reset();
    createMutation.mutate({ job, cv });
  };

  return {
    startCuration,
    reset,
    progress,
    statusLabel,
    isPending,
    isSuccess,
    isError,
    errorMessage: errorMsg || taskData?.errorMessage,
    curationResult
  };
}
