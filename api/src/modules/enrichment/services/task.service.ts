import { v4 as uuidv4 } from "uuid";
import Redis from "ioredis";
import { QueueManager } from "../queue";
import { CreateTaskDTO } from "../dtos/create-task.dto";
import { TaskResponseDTO } from "../dtos/task-response.dto";
import { Task } from "../model/task.model";
import { ExtractedResume } from "../gemini/gemini";

export class TaskService {
    constructor(
        private redis: Redis,
        private queueManager: QueueManager
    ) { }

    public async createTask(dto: CreateTaskDTO): Promise<TaskResponseDTO> {
        const taskId: string = uuidv4();
        const now: number = Date.now();

        const task: Task = {
            id: taskId,
            status: "PENDING",
            linkedinJobId: dto.linkedinJobId,
            rawHtml: null,
            cv: dto.cv,
            extractedJson: null,
            errorMessage: null,
            createdAt: now,
            updatedAt: now
        };

        await this.redis.set(`tasks:${taskId}`, JSON.stringify(task));

        await this.queueManager.addLinkedinJob(taskId, dto.linkedinJobId);

        return this.mapToResponseDTO(task);
    }

    public async getTask(taskId: string): Promise<TaskResponseDTO | null> {
        const taskDataRaw: string | null = await this.redis.get(`tasks:${taskId}`);
        if (!taskDataRaw) {
            return null;
        }

        const task: Task = JSON.parse(taskDataRaw) as Task;
        return this.mapToResponseDTO(task);
    }

    public async updateTask(taskId: string, updates: Partial<Omit<Task, 'id' | 'createdAt'>>): Promise<Result<Error, Task>> {
        const taskDataRaw: string | null = await this.redis.get(`tasks:${taskId}`);

        if (!taskDataRaw) {
            return { err: new Error(`Task ${taskId} não encontrada no Redis.`) };
        }

        const task: Task = JSON.parse(taskDataRaw) as Task;
        const updatedTask: Task = {
            ...task,
            ...updates,
            updatedAt: Date.now()
        };

        await this.redis.set(`tasks:${taskId}`, JSON.stringify(updatedTask));
        return { data: updatedTask };
    }

    private mapToResponseDTO(task: Task): TaskResponseDTO {
        let parsedJson: ExtractedResume | null = null;
        if (task.extractedJson) {
            try {
                parsedJson = JSON.parse(task.extractedJson) as ExtractedResume;
            } catch {
                parsedJson = null;
            }
        }

        return {
            id: task.id,
            status: task.status,
            linkedinJobId: task.linkedinJobId,
            extractedJson: parsedJson,
            errorMessage: task.errorMessage,
            updatedAt: task.updatedAt
        };
    }
}
