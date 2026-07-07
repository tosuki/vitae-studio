import { FastifySchema } from "fastify"
import { z } from "zod"

const personalSchema = z.object({
    fullName: z.string(),
    title: z.string(),
    email: z.string(),
    phone: z.string(),
    location: z.string(),
    linkedin: z.string(),
    github: z.string()
});

const experienceItemSchema = z.object({
    id: z.string(),
    company: z.string(),
    role: z.string(),
    location: z.string(),
    startDate: z.string(),
    endDate: z.string(),
    description: z.string()
});

const educationItemSchema = z.object({
    id: z.string(),
    institution: z.string(),
    degree: z.string(),
    startDate: z.string(),
    endDate: z.string(),
    description: z.string()
});

const certificateItemSchema = z.object({
    id: z.string(),
    name: z.string(),
    organization: z.string(),
    date: z.string()
});

const languageItemSchema = z.object({
    id: z.string(),
    name: z.string(),
    level: z.string()
});

const styleConfigSchema = z.object({
    theme: z.string(),
    fontFamily: z.string(),
    accentColor: z.string(),
    spacing: z.string()
});

export const cvSchema = z.object({
    personal: personalSchema,
    objective: z.string(),
    experience: z.array(experienceItemSchema),
    education: z.array(educationItemSchema),
    certificates: z.array(certificateItemSchema),
    skills: z.array(z.string()),
    languages: z.array(languageItemSchema),
    style: styleConfigSchema
});

export const enrichedCVSchema = cvSchema.omit({ style: true });

export const createTaskSchema: FastifySchema = {
    body: z.object({
        linkedinJobId: z.string().min(1, "linkedinJobId é obrigatório"),
        cv: cvSchema
    }),
    response: {
        201: z.object({
            id: z.string(),
            status: z.string(),
            linkedinJobId: z.string(),
            enrichedCV: enrichedCVSchema.nullable(),
            errorMessage: z.string().nullable(),
            updatedAt: z.number()
        })
    }
}

export const getTaskSchema: FastifySchema = {
    params: z.object({
        id: z.string().uuid("ID precisa ser um UUID válido")
    }),
    response: {
        200: z.object({
            id: z.string(),
            status: z.string(),
            linkedinJobId: z.string(),
            enrichedCV: enrichedCVSchema.nullable(),
            errorMessage: z.string().nullable(),
            updatedAt: z.number()
        }),
        404: z.object({
            error: z.string()
        })
    }
}
