import { ClusterHolder } from "./cluster"
import { Cluster } from "puppeteer-cluster"
import env from "../../env"

let clusterInstance: ClusterHolder | null = null;

export function getClusterHolder(): ClusterHolder {
    if (clusterInstance === null) {
        clusterInstance = new ClusterHolder({
            headless: env.PUPPETEER_HEADLESS,
            executablePath: env.PUPPETEER_EXECUTABLE_PATH,
            args: [
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage",
                "--disable-gpu"
            ]
        })
    }

    return clusterInstance;
}

export const getClusterInstance = async (): Promise<Cluster> => {
    const holder = getClusterHolder();

    try {
        return holder.getCluster();
    } catch {
        await holder.start();
        return holder.getCluster();
    }
};

export const shutdownAll = async () => {
    if (clusterInstance !== null) {
        await clusterInstance.close()
    }
}