import "dotenv/config"
import { z } from "zod"

const emptyToUndefined = (val: unknown) => (typeof val === "string" && val.trim() === "" ? undefined : val);

const envSchema = z.object({
    API_HOST: z.preprocess(emptyToUndefined, z.string().default("127.0.0.1")),
    API_PORT: z.preprocess(emptyToUndefined, z.coerce.number().default(3000)),
    REDIS_HOST: z.preprocess(emptyToUndefined, z.string().default("127.0.0.1")),
    REDIS_PORT: z.preprocess(emptyToUndefined, z.coerce.number().default(6379)),
    GEMINI_API_KEY: z.preprocess(emptyToUndefined, z.string().optional().default("")),
    LINKEDIN_LOGIN_PAGE: z.preprocess(emptyToUndefined, z.string().url().optional().default('https://www.linkedin.com/login/?trk=guest_homepage-basic_nav-header-signin')),
    LINKEDIN_COOKIES_NAME: z.preprocess(emptyToUndefined, z.string().optional().default("linkedin")),
    RESOURCES_DIR: z.preprocess(emptyToUndefined, z.string().default('resources')),
    PUPPETEER_HEADLESS: z.preprocess(
        (val) => (val === "false" || val === false ? false : true),
        z.boolean().default(true)
    ),
    PUPPETEER_EXECUTABLE_PATH: z.preprocess(emptyToUndefined, z.string().optional()),
})

export default envSchema.parse(process.env)