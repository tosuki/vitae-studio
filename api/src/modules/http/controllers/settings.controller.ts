import { FastifyReply, FastifyRequest } from "fastify";
import { getSettingsService } from "../../enrichment/factory";
import {
    ListModelsDTO,
    TestConnectionDTO,
    UpdateSettingsDTO
} from "../../settings/settings.model";

export class SettingsController {
    public async get(_request: FastifyRequest, reply: FastifyReply) {
        const settingsService = getSettingsService();
        const settings = await settingsService.getPublicSettings();
        return reply.status(200).send(settings);
    }

    public async update(
        request: FastifyRequest<{ Body: UpdateSettingsDTO }>,
        reply: FastifyReply
    ) {
        const settingsService = getSettingsService();
        const { provider, apiKey, model, baseUrl } = request.body;

        if (provider === "openai-compatible" && (!baseUrl || !baseUrl.trim())) {
            return reply.status(400).send({
                error: "A Base URL é obrigatória para provedores compatíveis com OpenAI (ex: http://localhost:20128/v1)."
            });
        }

        const existing = await settingsService.getSettings();
        const hasNewKey = Boolean(apiKey && apiKey.trim().length > 0);
        const hasSavedKeyForProvider = Boolean(
            existing &&
            existing.provider === provider &&
            existing.apiKey &&
            existing.apiKey.trim().length > 0
        );

        if (!hasNewKey && !hasSavedKeyForProvider) {
            return reply.status(400).send({
                error: "Informe uma API Key válida para salvar a configuração deste provedor."
            });
        }

        const updated = await settingsService.updateSettings({
            provider,
            apiKey,
            model,
            baseUrl
        });

        return reply.status(200).send(updated);
    }

    public async testConnection(
        request: FastifyRequest<{ Body: TestConnectionDTO }>,
        reply: FastifyReply
    ) {
        const settingsService = getSettingsService();
        const result = await settingsService.testConnection(request.body);
        return reply.status(200).send(result);
    }

    public async listModels(
        request: FastifyRequest<{ Body: ListModelsDTO }>,
        reply: FastifyReply
    ) {
        const settingsService = getSettingsService();
        try {
            const result = await settingsService.listModels(request.body);
            return reply.status(200).send(result);
        } catch (err: any) {
            return reply.status(400).send({
                error: err?.message || "Não foi possível carregar a lista de modelos do provedor."
            });
        }
    }
}
