import "dotenv/config"
import { z } from "zod"

const envSchema = z.object({
    API_HOST: z.string().default("127.0.0.1"),
    API_PORT: z.coerce.number().default(3000),
    REDIS_HOST: z.string().default("127.0.0.1"),
    REDIS_PORT: z.coerce.number().default(6379),
    GEMINI_API_KEY: z.string().optional().default(""),
    LINKEDIN_LOGIN_PAGE: z.string().url().optional().default('https://www.linkedin.com/login/?trk=guest_homepage-basic_nav-header-signin'),
    LINKEDIN_COOKIES_NAME: z.string().optional().default("linkedin"),
    RESOURCES_DIR: z.string().default('resources'),
})

export default envSchema.parse(process.env)