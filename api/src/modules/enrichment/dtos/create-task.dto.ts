import { CVData } from "../model/cv.model";

export interface CreateTaskDTO {
    linkedinJobId: string;
    cv: CVData
}
