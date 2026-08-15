import { ClusterHolder } from "../common/cluster";
import { Cluster } from "puppeteer-cluster";
import Redis from "ioredis";
import { GoogleGenAI } from "@google/genai";
import { QueueManager } from "./queue";
import { TaskService } from "./services/task.service";
import env from "../../env";
import { ConfigurationError } from "../../util/errors";

let redisInstance: Redis | null = null;
let geminiInstance: GoogleGenAI | null = null;
let queueManagerInstance: QueueManager | null = null;
let taskServiceInstance: TaskService | null = null;

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

export const getGeminiClient = (): GoogleGenAI => {
    if (geminiInstance === null) {
        if (!env.GEMINI_API_KEY) {
            throw new ConfigurationError("GEMINI_API_KEY não foi configurada nas variáveis de ambiente.")
        }
        geminiInstance = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
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
