import { FastifyPluginAsync } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { TaskController } from "./controllers/task.controller";

import { createTaskSchema, getTaskSchema } from "./schema/task.schema"

const router: FastifyPluginAsync = async (fastify) => {
    const typedFastify = fastify.withTypeProvider<ZodTypeProvider>();
    const controller = new TaskController();

    typedFastify.get('/', async (_, reply) => {
        return reply.status(200).send({
            ok: true,
            message: "Pong!"
        });
    });

    typedFastify.post('/tasks', { schema: createTaskSchema }, controller.create.bind(controller));
    typedFastify.get('/tasks/:id', { schema: getTaskSchema }, controller.get.bind(controller));
};

export default router;
export type RouterType = typeof router;
