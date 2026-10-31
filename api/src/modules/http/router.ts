import { FastifyPluginAsync } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { TaskController } from "./controllers/task.controller";
import { SettingsController } from "./controllers/settings.controller";

import { createTaskSchema, getTaskSchema } from "./schema/task.schema";
import {
    getSettingsSchema,
    listSettingsModelsSchema,
    testSettingsConnectionSchema,
    updateSettingsSchema
} from "./schema/settings.schema";

const router: FastifyPluginAsync = async (fastify) => {
    const typedFastify = fastify.withTypeProvider<ZodTypeProvider>();
    const controller = new TaskController();
    const settingsController = new SettingsController();

    typedFastify.get('/', async (_, reply) => {
        return reply.status(200).send({
            ok: true,
            message: "Pong!"
        });
    });

    typedFastify.post('/tasks', { schema: createTaskSchema }, controller.create.bind(controller));
    typedFastify.get('/tasks/:id', { schema: getTaskSchema }, controller.get.bind(controller));

    typedFastify.get('/settings', { schema: getSettingsSchema }, settingsController.get.bind(settingsController));
    typedFastify.put('/settings', { schema: updateSettingsSchema }, settingsController.update.bind(settingsController));
    typedFastify.post('/settings/test', { schema: testSettingsConnectionSchema }, settingsController.testConnection.bind(settingsController));
    typedFastify.post('/settings/models', { schema: listSettingsModelsSchema }, settingsController.listModels.bind(settingsController));
};

export default router;
export type RouterType = typeof router;
