import { CVData } from "../model/cv.model";
import { TaskStatus } from "../model/task.model";

export interface TaskResponseDTO {
    id: string;
    status: TaskStatus;
    linkedinJobId: string;
    enrichedCV: Omit<CVData, "style"> | null
    errorMessage: string | null;
    updatedAt: number;
}
