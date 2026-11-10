import path from "path";
import { InvalidFileUploadError } from "../../../util/errors";

export const MAX_RESUME_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export type SupportedResumeExtension = ".pdf" | ".txt";

const ALLOWED_EXTENSIONS = new Set<string>([".pdf", ".txt"]);
const ALLOWED_MIME_TYPES: Record<SupportedResumeExtension, Set<string>> = {
    ".pdf": new Set(["application/pdf", "application/x-pdf"]),
    ".txt": new Set(["text/plain", "application/octet-stream"])
};

export interface ValidatedResumeFile {
    buffer: Buffer;
    extension: SupportedResumeExtension;
    mimeType: string;
    sanitizedFilename: string;
}

export function sanitizeFilename(rawFilename: string): string {
    const base = path.basename(rawFilename || "resume");
    const cleaned = base
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9._-]/g, "_")
        .replace(/_{2,}/g, "_")
        .replace(/^[._-]+/, "");

    return cleaned.slice(0, 120) || "resume";
}

export function validateResumeFile(params: {
    filename: string;
    mimetype: string;
    buffer: Buffer;
    truncated?: boolean;
}): ValidatedResumeFile {
    const { filename, mimetype, buffer, truncated } = params;

    if (truncated || buffer.byteLength > MAX_RESUME_FILE_SIZE_BYTES) {
        throw new InvalidFileUploadError(
            "O arquivo excede o tamanho máximo permitido de 5MB.",
            413
        );
    }

    if (!buffer || buffer.byteLength === 0) {
        throw new InvalidFileUploadError("O arquivo enviado está vazio.", 400);
    }

    const sanitizedFilename = sanitizeFilename(filename);
    const ext = path.extname(sanitizedFilename).toLowerCase();

    if (!ALLOWED_EXTENSIONS.has(ext)) {
        throw new InvalidFileUploadError(
            "Extensão de arquivo não suportada. Envie apenas arquivos .pdf ou .txt.",
            415
        );
    }

    const extension = ext as SupportedResumeExtension;
    const normalizedMime = (mimetype || "").split(";")[0].trim().toLowerCase();

    if (!ALLOWED_MIME_TYPES[extension].has(normalizedMime)) {
        throw new InvalidFileUploadError(
            `Tipo MIME inválido (${normalizedMime || "desconhecido"}) para a extensão ${extension}.`,
            415
        );
    }

    if (extension === ".pdf") {
        // Verifica assinatura mágica %PDF- (0x25 0x50 0x44 0x46 0x2D)
        if (buffer.byteLength < 5 || buffer.subarray(0, 5).toString("ascii") !== "%PDF-") {
            throw new InvalidFileUploadError(
                "O arquivo enviado não possui uma assinatura PDF válida (%PDF-) ou está corrompido.",
                415
            );
        }
    } else if (extension === ".txt") {
        // Verifica ausência de bytes nulos nos primeiros 4096 bytes para evitar binários disfarçados de TXT
        const sampleSize = Math.min(buffer.byteLength, 4096);
        for (let i = 0; i < sampleSize; i++) {
            if (buffer[i] === 0x00) {
                throw new InvalidFileUploadError(
                    "O arquivo .txt enviado contém bytes binários inválidos.",
                    415
                );
            }
        }
    }

    return {
        buffer,
        extension,
        mimeType: normalizedMime,
        sanitizedFilename
    };
}
