import { CVData } from "./cv.model";

export type TaskStatus = 'PENDING' | 'EXTRACTING_LINKEDIN' | 'EXTRACTING_GEMINI' | 'DONE' | 'FAILED';

export interface Task {
    id: string;
    status: TaskStatus;
    linkedinJobId: string;
    rawHtml: string | null;
    cv: CVData
    enrichedCV: Omit<CVData, "style"> | null
    errorMessage: string | null;
    createdAt: number;
    updatedAt: number;
}
