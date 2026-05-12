import { Router, type IRouter } from "express";
import * as controller from "./controller.js";

export const auditRouter: IRouter = Router();
auditRouter.all("*", controller.notImplemented);
