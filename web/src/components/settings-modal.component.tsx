import { useState, useEffect, useRef } from "react";
import { AIProviderType } from "../service/settings.service";
import { useSettings } from "../hooks/settings.hook";
import "./settings-modal.component.css";

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    isOnboarding?: boolean;
}

const DEFAULT_MODELS: Record<AIProviderType, string> = {
    gemini: "gemini-2.5-flash",
    openai: "gpt-4o-mini",
    "openai-compatible": "gpt-4o-mini"
};

const SUGGESTED_MODELS: Record<AIProviderType, string[]> = {
    gemini: ["gemini-3.5-flash-lite", "gemini-3.5-flash", "gemini-2.5-flash"],
    openai: ["gpt-4o-mini", "gpt-4o", "gpt-4.1-mini", "gpt-4.1"],
    "openai-compatible": ["gpt-4o-mini", "gpt-4o", "claude-3-5-sonnet", "gemini-2.5-flash", "deepseek-chat"]
};

export default function SettingsModal({ isOpen, onClose, isOnboarding = false }: SettingsModalProps) {
    const {
        settings,
        saveSettings,
        isSaving,
        testConnection,
        isTesting,
        loadModels,
        isLoadingModels
    } = useSettings();

    const [provider, setProvider] = useState<AIProviderType>("gemini");
    const [apiKey, setApiKey] = useState("");
    const [model, setModel] = useState("gemini-2.5-flash");
    const [baseUrl, setBaseUrl] = useState("http://localhost:20128/v1");
    const [availableModels, setAvailableModels] = useState<string[]>([]);
    const [feedback, setFeedback] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);
    const initializedOpenRef = useRef(false);

    useEffect(() => {
        if (!isOpen) {
            initializedOpenRef.current = false;
            return;
        }

        if (settings && !initializedOpenRef.current) {
            initializedOpenRef.current = true;
            setProvider(settings.provider);
            setModel(settings.model || DEFAULT_MODELS[settings.provider]);
            setBaseUrl(
                settings.provider === "openai-compatible"
                    ? settings.baseUrl || "http://localhost:20128/v1"
                    : settings.provider === "openai"
                    ? settings.baseUrl || "https://api.openai.com/v1"
                    : "http://localhost:20128/v1"
            );
            setApiKey("");
            setAvailableModels(SUGGESTED_MODELS[settings.provider]);
            setFeedback(null);
        }
    }, [isOpen, settings]);

    if (!isOpen) return null;

    const handleProviderChange = (nextProvider: AIProviderType) => {
        setProvider(nextProvider);
        setFeedback(null);

        if (settings && settings.provider === nextProvider && settings.model) {
            setModel(settings.model);
        } else {
            setModel(DEFAULT_MODELS[nextProvider]);
        }

        if (nextProvider === "openai-compatible") {
            setBaseUrl(
                settings?.provider === "openai-compatible" && settings.baseUrl
                    ? settings.baseUrl
                    : "http://localhost:20128/v1"
            );
        } else if (nextProvider === "openai") {
            setBaseUrl("https://api.openai.com/v1");
        }

        setAvailableModels(SUGGESTED_MODELS[nextProvider]);
    };

    const handleFetchModels = async () => {
        setFeedback(null);
        try {
            const models = await loadModels({
                provider,
                apiKey: apiKey.trim() || undefined,
                baseUrl: provider === "openai-compatible" ? baseUrl.trim() : undefined
            });

            if (models.length > 0) {
                setAvailableModels(models);
                if (!model.trim() || !models.includes(model.trim())) {
                    setModel(models[0]);
                }
                setFeedback({
                    type: "info",
                    message: `${models.length} modelo(s) carregado(s) do endpoint com sucesso.`
                });
            } else {
                setFeedback({
                    type: "info",
                    message: "O endpoint respondeu, mas não retornou modelos listados. Digite o nome do modelo manualmente."
                });
            }
        } catch (err: any) {
            setFeedback({
                type: "error",
                message: err?.message || "Erro ao consultar modelos disponíveis no provedor."
            });
        }
    };

    const handleTestConnection = async () => {
        setFeedback(null);

        if (provider === "openai-compatible" && !baseUrl.trim()) {
            setFeedback({
                type: "error",
                message: "Informe a Base URL do servidor (ex: http://localhost:20128/v1 para 9router)."
            });
            return;
        }

        try {
            const result = await testConnection({
                provider,
                apiKey: apiKey.trim() || undefined,
                model: model.trim() || DEFAULT_MODELS[provider],
                baseUrl: provider === "openai-compatible" ? baseUrl.trim() : undefined
            });

            setFeedback({
                type: result.ok ? "success" : "error",
                message: result.message
            });
        } catch (err: any) {
            setFeedback({
                type: "error",
                message: err?.message || "Não foi possível testar a conexão."
            });
        }
    };

    const handleSave = async () => {
        setFeedback(null);

        if (!model.trim()) {
            setFeedback({
                type: "error",
                message: "Informe o identificador do modelo (ex: gemini-2.5-flash ou gpt-4o-mini)."
            });
            return;
        }

        if (provider === "openai-compatible" && !baseUrl.trim()) {
            setFeedback({
                type: "error",
                message: "Informe a Base URL da API compatível (ex: http://localhost:20128/v1)."
            });
            return;
        }

        const hasExistingKey = Boolean(settings?.hasApiKey && settings?.provider === provider);
        if (!apiKey.trim() && !hasExistingKey) {
            setFeedback({
                type: "error",
                message: "Informe sua API Key para ativar o provedor selecionado."
            });
            return;
        }

        try {
            await saveSettings({
                provider,
                apiKey: apiKey.trim() || undefined,
                model: model.trim(),
                baseUrl: provider === "openai-compatible" ? baseUrl.trim() : undefined
            });

            setApiKey("");
            setFeedback({
                type: "success",
                message: "Configurações salvas com sucesso! O otimizador de currículos por IA está pronto."
            });

            setTimeout(() => {
                onClose();
            }, 700);
        } catch (err: any) {
            setFeedback({
                type: "error",
                message: err?.message || "Falha ao salvar as configurações."
            });
        }
    };

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (isSaving || isTesting) return;
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const isCurrentSavedProvider = Boolean(settings?.hasApiKey && settings?.provider === provider);

    return (
        <div className="modal-backdrop no-print" onClick={handleBackdropClick}>
            <div className="settings-modal-container" role="dialog" aria-modal="true" aria-labelledby="settings-modal-title">
                <div className="settings-modal-header">
                    <div>
                        <div className="settings-modal-eyebrow">
                            {isOnboarding && !settings?.isConfigured ? "BEM-VINDO AO VITAE STUDIO • PRIMEIRO ACESSO" : "INTEGRAÇÃO DE INTELIGÊNCIA ARTIFICIAL"}
                        </div>
                        <h3 id="settings-modal-title" className="settings-modal-title">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="3"></circle>
                                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                            </svg>
                            Configurar Provedor de IA
                        </h3>
                    </div>
                    <button type="button" className="settings-modal-close-btn" onClick={onClose} aria-label="Fechar configurações">
                        &times;
                    </button>
                </div>

                <div className="settings-modal-body">
                    {isOnboarding && !settings?.isConfigured && (
                        <div className="settings-onboarding-banner">
                            <strong>Configure sua IA sem precisar editar arquivos <code>.env</code>!</strong>
                            <span>
                                Escolha abaixo o provedor de IA de sua preferência (Google Gemini, OpenAI ou um gateway compatível como o <strong>9router</strong>) para habilitar a adaptação automática de currículos para vagas do LinkedIn.
                            </span>
                        </div>
                    )}

                    <div className="settings-section-label">1. Escolha o Provedor de IA</div>
                    <div className="settings-provider-grid">
                        <button
                            type="button"
                            className={`settings-provider-card ${provider === "gemini" ? "active" : ""}`}
                            onClick={() => handleProviderChange("gemini")}
                        >
                            <div className="settings-provider-card-header">
                                <span className="settings-provider-name">Google Gemini</span>
                                <span className="settings-provider-tag">SDK Nativo</span>
                            </div>
                            <span className="settings-provider-desc">
                                API direta do Google AI Studio (gemini-2.5-flash / pro).
                            </span>
                        </button>

                        <button
                            type="button"
                            className={`settings-provider-card ${provider === "openai" ? "active" : ""}`}
                            onClick={() => handleProviderChange("openai")}
                        >
                            <div className="settings-provider-card-header">
                                <span className="settings-provider-name">OpenAI</span>
                                <span className="settings-provider-tag">Oficial</span>
                            </div>
                            <span className="settings-provider-desc">
                                Plataforma oficial da OpenAI (gpt-4o-mini, gpt-4o, gpt-4.1).
                            </span>
                        </button>

                        <button
                            type="button"
                            className={`settings-provider-card ${provider === "openai-compatible" ? "active" : ""}`}
                            onClick={() => handleProviderChange("openai-compatible")}
                        >
                            <div className="settings-provider-card-header">
                                <span className="settings-provider-name">OpenAPI / 9router</span>
                                <span className="settings-provider-tag highlight">Custom URL</span>
                            </div>
                            <span className="settings-provider-desc">
                                Compatível com 9router, OpenRouter, Groq, Ollama ou LiteLLM.
                            </span>
                        </button>
                    </div>

                    {provider === "openai-compatible" && (
                        <div className="form-group">
                            <label htmlFor="settings-base-url">Base URL da API (ex: 9router)</label>
                            <input
                                id="settings-base-url"
                                type="url"
                                className="settings-mono-input"
                                placeholder="http://localhost:20128/v1"
                                value={baseUrl}
                                onChange={(e) => setBaseUrl(e.target.value)}
                            />
                            <span className="settings-field-hint">
                                Para o <strong>9router</strong> local, utilize <code>http://localhost:20128/v1</code> (ou a porta/host do seu gateway).
                            </span>
                        </div>
                    )}

                    <div className="form-group">
                        <div className="settings-label-row">
                            <label htmlFor="settings-api-key">
                                API Key {provider === "openai-compatible" ? "(Chave do 9router / Gateway)" : ""}
                            </label>
                            {isCurrentSavedProvider && settings?.apiKeyPreview && (
                                <span className="settings-saved-key-badge" title="Já existe uma chave salva para este provedor">
                                    Salva: {settings.apiKeyPreview}
                                </span>
                            )}
                        </div>
                        <input
                            id="settings-api-key"
                            type="password"
                            className="settings-mono-input"
                            placeholder={
                                isCurrentSavedProvider && settings?.apiKeyPreview
                                    ? `Deixe em branco para manter (${settings.apiKeyPreview}) ou insira nova chave...`
                                    : provider === "gemini"
                                    ? "AIzaSy..."
                                    : "sk-..."
                            }
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            autoComplete="off"
                        />
                    </div>

                    <div className="form-group">
                        <div className="settings-label-row">
                            <label htmlFor="settings-model-input">Modelo de IA</label>
                            <button
                                type="button"
                                className="settings-fetch-models-btn"
                                onClick={handleFetchModels}
                                disabled={isLoadingModels}
                                title="Consultar a API do provedor para listar os modelos disponíveis"
                            >
                                {isLoadingModels ? "Consultando modelos..." : "↻ Carregar Modelos da API"}
                            </button>
                        </div>
                        <div className="settings-model-input-group">
                            <input
                                id="settings-model-input"
                                type="text"
                                list="settings-models-datalist"
                                className="settings-mono-input"
                                placeholder={DEFAULT_MODELS[provider]}
                                value={model}
                                onChange={(e) => setModel(e.target.value)}
                            />
                            <datalist id="settings-models-datalist">
                                {availableModels.map((m) => (
                                    <option key={m} value={m} />
                                ))}
                            </datalist>
                        </div>
                        {availableModels.length > 0 && (
                            <div className="settings-model-chips">
                                {availableModels.map((m) => (
                                    <button
                                        key={m}
                                        type="button"
                                        className={`settings-model-chip ${model === m ? "selected" : ""}`}
                                        onClick={() => setModel(m)}
                                    >
                                        {m}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {feedback && (
                        <div className={`settings-feedback-card ${feedback.type}`}>
                            <span>{feedback.message}</span>
                        </div>
                    )}
                </div>

                <div className="settings-modal-footer">
                    <div className="settings-footer-left">
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={handleTestConnection}
                            disabled={isTesting || isSaving}
                        >
                            {isTesting ? "Testando..." : "Testar Conexão"}
                        </button>
                    </div>
                    <div className="settings-footer-right">
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={onClose}
                            disabled={isSaving}
                        >
                            {isOnboarding && !settings?.isConfigured ? "Configurar depois" : "Cancelar"}
                        </button>
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={handleSave}
                            disabled={isSaving || isTesting}
                        >
                            {isSaving ? "Salvando..." : "Salvar Configurações"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
