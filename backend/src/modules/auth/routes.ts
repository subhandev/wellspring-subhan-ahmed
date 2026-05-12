import { Router, type IRouter } from "express";
import * as controller from "./controller.js";

export const authRouter: IRouter = Router();
authRouter.all("*", controller.notImplemented);
