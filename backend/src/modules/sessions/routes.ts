import { Router, type IRouter } from "express";
import * as controller from "./controller.js";

export const sessionsRouter: IRouter = Router();

sessionsRouter.get("/", controller.list);
sessionsRouter.post("/reorder", controller.reorder);
sessionsRouter.post("/", controller.create);
sessionsRouter.get("/:id", controller.getById);
sessionsRouter.patch("/:id", controller.update);
sessionsRouter.delete("/:id", controller.remove);
