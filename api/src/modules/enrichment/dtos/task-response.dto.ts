import { TaskStatus } from "../model/task.model";
import { ExtractedResume } from "../gemini/gemini";

export interface TaskResponseDTO {
    id: string;
    status: TaskStatus;
    linkedinJobId: string;
    extractedJson: ExtractedResume | null;
    errorMessage: string | null;
    updatedAt: number;
}
