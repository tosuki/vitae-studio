import { ClusterHolder } from "../common/cluster";
import { Cluster } from "puppeteer-cluster";
import Redis from "ioredis";
import { GoogleGenAI } from "@google/genai";
import { QueueManager } from "./queue";
import { TaskService } from "./services/task.service";
import { SettingsService } from "../settings/settings.service";
import env from "../../env";
import { ConfigurationError } from "../../util/errors";

let redisInstance: Redis | null = null;
let geminiInstance: GoogleGenAI | null = null;
let geminiInstanceKey: string | null = null;
let queueManagerInstance: QueueManager | null = null;
let taskServiceInstance: TaskService | null = null;
let settingsServiceInstance: SettingsService | null = null;

export const getRedisClient = (): Redis => {
    if (redisInstance === null) {
        redisInstance = new Redis({
            host: env.REDIS_HOST,
            port: env.REDIS_PORT,
            maxRetriesPerRequest: null
        });
    }
    return redisInstance;
};

export const getSettingsService = (): SettingsService => {
    if (settingsServiceInstance === null) {
        settingsServiceInstance = new SettingsService(getRedisClient());
    }
    return settingsServiceInstance;
};

export const getGeminiClient = (customApiKey?: string): GoogleGenAI => {
    const resolvedKey = (customApiKey || env.GEMINI_API_KEY || "").trim();
    if (!resolvedKey) {
        throw new ConfigurationError("A API Key do Gemini não foi configurada. Configure um provedor de IA nas configurações da plataforma.");
    }

    if (geminiInstance === null || geminiInstanceKey !== resolvedKey) {
        geminiInstance = new GoogleGenAI({
            apiKey: resolvedKey,
            httpOptions: { timeout: 45000 }
        });
        geminiInstanceKey = resolvedKey;
    }
    return geminiInstance;
};

export const getQueueManager = (): QueueManager => {
    if (queueManagerInstance === null) {
        queueManagerInstance = new QueueManager();
    }
    return queueManagerInstance;
};

export const getTaskService = (): TaskService => {
    if (taskServiceInstance === null) {
        taskServiceInstance = new TaskService(getRedisClient(), getQueueManager());
    }
    return taskServiceInstance;
};

export const shutdownAll = async () => {
    if (queueManagerInstance !== null) {
        await queueManagerInstance.shutdown();
    }

    if (redisInstance !== null) {
        await redisInstance.quit();
    }
};
