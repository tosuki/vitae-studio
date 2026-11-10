import { describe, it, expect } from "vitest";
import Fastify from "fastify";
import multipart from "@fastify/multipart";
import { validatorCompiler, serializerCompiler } from "fastify-type-provider-zod";
import router from "../../http/router";
import {
    MAX_RESUME_FILE_SIZE_BYTES,
    sanitizeFilename,
    validateResumeFile
} from "./file-validator";
import {
    extractResumeTextFromFile,
    MAX_RESUME_TEXT_CHARS,
    sanitizeAndTruncateResumeText
} from "./text-extractor.service";
import {
    normalizeEndDate,
    normalizeExtractedCV,
    normalizeLanguageLevel,
    normalizeSocialUrl
} from "../ai/openai-compatible.provider";
import { InvalidFileUploadError, UnprocessableResumeError } from "../../../util/errors";

describe("Resume File Ingestion & AI Extraction Pipeline", () => {
    it("sanitizes malicious filenames and prevents path traversal", () => {
        expect(sanitizeFilename("../../etc/passwd.pdf")).toBe("passwd.pdf");
        expect(sanitizeFilename("Currículo João & Maria (2026)!.pdf")).toBe("Curriculo_Joao_Maria_2026_.pdf");
    });

    it("validates supported extensions, MIME types, 5MB limit, and Magic Bytes (%PDF- and non-binary TXT)", () => {
        // 1. Valid TXT
        const txtBuffer = Buffer.from(
            "João Silva - Engenheiro de Software Sênior com 8 anos de experiência em Node.js e React.",
            "utf-8"
        );
        const validTxt = validateResumeFile({
            filename: "curriculo.txt",
            mimetype: "text/plain; charset=utf-8",
            buffer: txtBuffer
        });
        expect(validTxt.extension).toBe(".txt");

        // 2. Rejects unsupported extension (.docx / .exe)
        expect(() =>
            validateResumeFile({
                filename: "curriculo.docx",
                mimetype: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                buffer: txtBuffer
            })
        ).toThrow(InvalidFileUploadError);

        // 3. Rejects spoofed PDF without %PDF- magic header
        expect(() =>
            validateResumeFile({
                filename: "malicious.pdf",
                mimetype: "application/pdf",
                buffer: Buffer.from("MZ-fake-executable-content", "utf-8")
            })
        ).toThrow(/assinatura PDF válida/);

        // 4. Rejects binary file disguised as .txt (contains null byte 0x00)
        expect(() =>
            validateResumeFile({
                filename: "binary.txt",
                mimetype: "text/plain",
                buffer: Buffer.from([0x48, 0x65, 0x00, 0x6c, 0x6f])
            })
        ).toThrow(/bytes binários/);

        // 5. Rejects truncated / > 5MB file
        expect(() =>
            validateResumeFile({
                filename: "huge.pdf",
                mimetype: "application/pdf",
                buffer: Buffer.from("%PDF-1.7 content"),
                truncated: true
            })
        ).toThrow(/5MB/);
    });

    it("extracts text from .txt files, strips control characters, enforces minimum density, and truncates at 30k chars", async () => {
        const rawWithControls =
            "Carlos Eduardo\x01\x07\r\nDesenvolvedor Full Stack Sênior\r\n\r\n\r\nExperiência em TypeScript, React, Fastify e PostgreSQL.";
        const validated = validateResumeFile({
            filename: "carlos.txt",
            mimetype: "text/plain",
            buffer: Buffer.from(rawWithControls, "utf-8")
        });

        const extracted = await extractResumeTextFromFile(validated);
        expect(extracted).toContain("Carlos Eduardo");
        expect(extracted).not.toContain("\x01");
        expect(extracted).not.toContain("\x07");
        expect(extracted).not.toContain("\r");

        // Rejects near-empty / scanned image placeholder text (< 30 alphanumeric chars)
        expect(() => sanitizeAndTruncateResumeText("   ...   \n\n  abc ")).toThrow(
            UnprocessableResumeError
        );

        // Truncates safely at MAX_RESUME_TEXT_CHARS (30.000)
        const hugeText = "A".repeat(MAX_RESUME_TEXT_CHARS + 5000);
        const truncated = sanitizeAndTruncateResumeText(hugeText);
        expect(truncated.length).toBe(MAX_RESUME_TEXT_CHARS);
    });

    it("normalizes indeterminate LLM outputs (dates, current jobs, social links, CEFR language levels, and missing IDs)", () => {
        expect(normalizeLanguageLevel("C2 Proficient")).toBe("Fluente");
        expect(normalizeLanguageLevel("C1 Advanced")).toBe("Avançado");
        expect(normalizeLanguageLevel("B2 Upper Intermediate")).toBe("Intermediário");
        expect(normalizeLanguageLevel("A1 Beginner")).toBe("Básico");
        expect(normalizeLanguageLevel("Língua Materna")).toBe("Nativo");

        expect(normalizeEndDate("Atual")).toBe("");
        expect(normalizeEndDate("Presente")).toBe("");
        expect(normalizeEndDate("Current")).toBe("");
        expect(normalizeEndDate("11/2025")).toBe("11/2025");

        expect(normalizeSocialUrl("https://www.linkedin.com/in/dev-senior/")).toBe(
            "linkedin.com/in/dev-senior"
        );
        expect(normalizeSocialUrl("http://github.com/dev-senior/")).toBe(
            "github.com/dev-senior"
        );

        const normalized = normalizeExtractedCV({
            personal: {
                fullName: "Ana Costa",
                title: "Arquiteta de Sistemas",
                email: "ana@costa.dev",
                phone: "(11) 98888-7777",
                location: "São Paulo, SP",
                linkedin: "https://linkedin.com/in/anacosta/",
                github: "https://github.com/anacosta"
            },
            objective: "Liderar projetos de arquitetura distribuída.",
            experience: [
                {
                    company: "Banco Digital X",
                    role: "Staff Engineer",
                    location: "Remoto",
                    startDate: "03/2022",
                    endDate: "Atualmente",
                    description: "- Arquitetura de alta disponibilidade"
                }
            ],
            education: [
                {
                    institution: "UNICAMP",
                    degree: "Engenharia de Computação",
                    startDate: "2015",
                    endDate: "2019",
                    description: ""
                }
            ],
            projects: [
                {
                    name: "Vitae Studio",
                    role: "Tech Lead",
                    link: "https://github.com/anacosta/vitae-studio/",
                    startDate: "2024",
                    endDate: "Atual",
                    description: "Plataforma de otimização de currículos."
                }
            ],
            certificates: [
                {
                    name: "Kubernetes CKA",
                    organization: "CNCF",
                    date: "2024"
                }
            ],
            skills: ["Node.js", "TypeScript", "Node.js", "  "],
            languages: [
                { name: "Português", level: "Mother tongue" },
                { name: "Inglês", level: "C1" }
            ]
        });

        expect(normalized.personal.linkedin).toBe("linkedin.com/in/anacosta");
        expect(normalized.experience[0].id).toMatch(/^exp-/);
        expect(normalized.experience[0].endDate).toBe("");
        expect(normalized.education[0].id).toMatch(/^edu-/);
        expect(normalized.projects[0].id).toMatch(/^proj-/);
        expect(normalized.projects[0].link).toBe("github.com/anacosta/vitae-studio");
        expect(normalized.projects[0].endDate).toBe("");
        expect(normalized.certificates[0].id).toMatch(/^cert-/);
        expect(normalized.skills).toEqual(["Node.js", "TypeScript"]);
        expect(normalized.languages[0].level).toBe("Nativo");
        expect(normalized.languages[1].level).toBe("Avançado");
    });

    it("exposes POST /tasks/parse-resume with multipart validation and fail-fast HTTP error codes", async () => {
        const app = Fastify();
        app.setValidatorCompiler(validatorCompiler);
        app.setSerializerCompiler(serializerCompiler);
        await app.register(multipart, {
            limits: {
                fileSize: MAX_RESUME_FILE_SIZE_BYTES,
                files: 1
            }
        });
        await app.register(router);

        // 1. Rejects unsupported file extension with 415
        const boundary = "----VitaeBoundaryTest123";
        const invalidExtBody = [
            `--${boundary}`,
            'Content-Disposition: form-data; name="file"; filename="curriculo.exe"',
            "Content-Type: application/octet-stream",
            "",
            "MZ-binary-payload-test",
            `--${boundary}--`,
            ""
        ].join("\r\n");

        const res415 = await app.inject({
            method: "POST",
            url: "/tasks/parse-resume",
            headers: {
                "content-type": `multipart/form-data; boundary=${boundary}`
            },
            payload: invalidExtBody
        });
        expect(res415.statusCode).toBe(415);

        // 2. Rejects empty/unreadable text file with 422 before hitting LLM
        const tooShortBody = [
            `--${boundary}`,
            'Content-Disposition: form-data; name="file"; filename="vazio.txt"',
            "Content-Type: text/plain",
            "",
            "oi",
            `--${boundary}--`,
            ""
        ].join("\r\n");

        const res422 = await app.inject({
            method: "POST",
            url: "/tasks/parse-resume",
            headers: {
                "content-type": `multipart/form-data; boundary=${boundary}`
            },
            payload: tooShortBody
        });
        expect(res422.statusCode).toBe(422);

        await app.close();
    });
});
