import fs from "fs/promises";
import os from "os";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { extractText } from "unpdf";
import { ValidatedResumeFile } from "./file-validator";
import { UnprocessableResumeError } from "../../../util/errors";

export const MAX_RESUME_TEXT_CHARS = 30000;
export const MIN_ALPHANUMERIC_CHARS = 30;

export function sanitizeAndTruncateResumeText(rawText: string): string {
    if (!rawText || typeof rawText !== "string") {
        throw new UnprocessableResumeError(
            "Não foi possível extrair texto legível do arquivo enviado."
        );
    }

    // Normaliza quebras de linha e remove caracteres de controle não-imprimíveis (mantendo \n e \t)
    const cleaned = rawText
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "\n")
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, " ")
        .replace(/[ \t]{2,}/g, " ")
        .replace(/\n{3,}/g, "\n\n")
        .trim();

    const alphaNumCount = (cleaned.match(/[\p{L}\p{N}]/gu) || []).length;

    if (alphaNumCount < MIN_ALPHANUMERIC_CHARS) {
        throw new UnprocessableResumeError(
            "O arquivo enviado não contém texto selecionável suficiente. Caso seja um PDF escaneado como imagem, envie uma versão em PDF textual ou arquivo .txt."
        );
    }

    if (cleaned.length > MAX_RESUME_TEXT_CHARS) {
        return cleaned.slice(0, MAX_RESUME_TEXT_CHARS).trim();
    }

    return cleaned;
}

export async function extractResumeTextFromFile(
    file: ValidatedResumeFile
): Promise<string> {
    const tempDir = path.join(os.tmpdir(), "vitae-studio-uploads");
    await fs.mkdir(tempDir, { recursive: true });

    const tempFilePath = path.join(
        tempDir,
        `${uuidv4()}-${file.sanitizedFilename}`
    );

    try {
        // Armazenamento temporário seguro com permissão restrita ao usuário do processo
        await fs.writeFile(tempFilePath, file.buffer, { mode: 0o600 });
        const diskBuffer = await fs.readFile(tempFilePath);

        let rawText = "";

        if (file.extension === ".txt") {
            const decoder = new TextDecoder("utf-8", { fatal: false });
            rawText = decoder.decode(diskBuffer);
        } else if (file.extension === ".pdf") {
            try {
                const uint8 = new Uint8Array(
                    diskBuffer.buffer,
                    diskBuffer.byteOffset,
                    diskBuffer.byteLength
                );
                const result = await extractText(uint8, { mergePages: true });
                rawText = Array.isArray(result.text)
                    ? result.text.join("\n\n")
                    : String(result.text || "");
            } catch (err: unknown) {
                const detail = err instanceof Error ? err.message : "Erro ao ler estrutura do PDF";
                throw new UnprocessableResumeError(
                    `Não foi possível extrair o conteúdo do PDF (o arquivo pode estar corrompido ou protegido por senha): ${detail}`
                );
            }
        }

        return sanitizeAndTruncateResumeText(rawText);
    } finally {
        await fs.unlink(tempFilePath).catch(() => undefined);
    }
}
