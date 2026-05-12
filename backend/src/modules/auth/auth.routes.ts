import { Router, type IRouter } from "express";
import * as controller from "./auth.controller.js";

export const authRouter: IRouter = Router();

authRouter.post("/signup", controller.signup);
authRouter.post("/login", controller.login);
authRouter.post("/forgot-password", controller.forgotPassword);
authRouter.post("/reset-password", controller.resetPassword);
authRouter.post("/logout", controller.logout);
authRouter.get("/me", controller.me);
