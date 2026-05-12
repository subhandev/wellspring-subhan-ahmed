import { Router, type IRouter } from "express";
import * as controller from "./controller.js";

export const programsRouter: IRouter = Router();
programsRouter.all("*", controller.notImplemented);
