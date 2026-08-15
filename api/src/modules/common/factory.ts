import { ClusterHolder } from "./cluster"
import { Cluster } from "puppeteer-cluster"

let clusterInstance: ClusterHolder | null = null;

export function getClusterHolder(): ClusterHolder {
    if (clusterInstance === null) {
        clusterInstance = new ClusterHolder({
            headless: false,
            args: ["--no-sandbox", "--disable-setuid-sandbox"]
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