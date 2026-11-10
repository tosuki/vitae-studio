import { CVData, TargetedCuration } from "../../common/model/cv.model";

export type TaskStatus = 'PENDING' | 'EXTRACTING_LINKEDIN' | 'EXTRACTING_GEMINI' | 'DONE' | 'FAILED';

export interface Task {
    id: string;
    status: TaskStatus;
    linkedinJobId: string;
    rawHtml: string | null;
    rawResumeText?: string | null;
    jobTitle?: string | null;
    jobDescription?: string | null;
    cv: CVData | null;
    enrichedCV: Omit<CVData, "style"> | null;
    curationResult?: TargetedCuration | null;
    errorMessage: string | null;
    createdAt: number;
    updatedAt: number;
}
