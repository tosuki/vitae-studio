import { CVData } from "../../common/model/cv.model";

export interface CreateTaskDTO {
    linkedinJobId: string;
    cv: CVData
}
