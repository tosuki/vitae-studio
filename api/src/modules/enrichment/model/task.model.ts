import { CVData } from "./cv";

export type TaskStatus = 'PENDING' | 'EXTRACTING_LINKEDIN' | 'EXTRACTING_GEMINI' | 'DONE' | 'FAILED';

export interface Task {
    id: string;
    status: TaskStatus;
    linkedinJobId: string;
    rawHtml: string | null;
    cv: CVData
    extractedJson: string | null;
    errorMessage: string | null;
    createdAt: number;
    updatedAt: number;
}
