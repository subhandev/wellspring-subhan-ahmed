import { Router, type IRouter } from "express";
import type { RequestHandler } from "express";
import * as controller from "./controller.js";
import { csvFileUpload } from "./multerCsv.js";

export const importRouter: IRouter = Router();

const multipartWhenCsv: RequestHandler = (req, res, next) => {
  if (req.is("multipart/form-data")) {
    return csvFileUpload.single("file")(req, res, next);
  }
  next();
};

importRouter.post("/sessions", multipartWhenCsv, controller.importSessions);
