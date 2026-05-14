import { Router, type IRouter } from "express";
import * as controller from "./controller.js";

export const uploadsRouter: IRouter = Router();

uploadsRouter.post("/presign", controller.presign);
uploadsRouter.post("/presign-get", controller.presignGet);
