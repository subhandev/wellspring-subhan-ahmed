import { Router, type IRouter } from "express";
import * as controller from "./controller.js";

export const sessionsRouter: IRouter = Router();
sessionsRouter.all("*", controller.notImplemented);
