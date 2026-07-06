import { ClusterHolder } from "./cluster";
import { Cluster } from "puppeteer-cluster";
import Redis from "ioredis";
import { GoogleGenAI } from "@google/genai";
import { QueueManager } from "./queue";
import { TaskService } from "./services/task.service";
import env from "../../env";

let clusterHolderInstance: ClusterHolder | null = null;
let redisInstance: Redis | null = null;
let geminiInstance: GoogleGenAI | null = null;
let queueManagerInstance: QueueManager | null = null;
let taskServiceInstance: TaskService | null = null;

export const getClusterHolder = (): ClusterHolder => {
    if (clusterHolderInstance === null) {
        clusterHolderInstance = new ClusterHolder({
            headless: false,
            args: ["--no-sandbox", "--disable-setuid-sandbox"]
        });
    }
    return clusterHolderInstance;
};

export const getClusterInstance = async (): Promise<Cluster> => {
    const holder = getClusterHolder();
    try {
        return holder.getCluster();
    } catch {
        await holder.start();
        return holder.getCluster();
    }
};

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
            throw new Error("GEMINI_API_KEY não foi configurada nas variáveis de ambiente.");
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
    if (clusterHolderInstance !== null) {
        await clusterHolderInstance.close();
    }
    if (redisInstance !== null) {
        await redisInstance.quit();
    }
};
