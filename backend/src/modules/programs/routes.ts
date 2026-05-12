import { Router, type IRouter } from "express";
import * as controller from "./controller.js";

export const programsRouter: IRouter = Router();

programsRouter.get("/", controller.list);
programsRouter.post("/", controller.create);
programsRouter.get("/:id", controller.getById);
programsRouter.patch("/:id", controller.update);
programsRouter.delete("/:id", controller.remove);
