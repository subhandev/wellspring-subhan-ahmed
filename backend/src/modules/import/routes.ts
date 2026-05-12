import { Router, type IRouter } from "express";
import * as controller from "./controller.js";

export const importRouter: IRouter = Router();

importRouter.post("/sessions", controller.importSessions);
