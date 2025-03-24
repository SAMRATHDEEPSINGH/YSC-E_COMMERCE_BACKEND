import express from "express";
import {signup,verifyEmail,login,forgotPassword,resetPassword} from "../controllers/Auth.controller.js";
import {authMiddleware} from "../middlewares/Auth.middleware.js";
import { registrationSchema,verifcationSchema } from "../utils/validationSchema.js";
import {validate} from "../middlewares/validate.middleware.js";


const router = express.Router();

router.post("/signup",validate(registrationSchema), signup);
router.get("/verify-email",validate(verifcationSchema,"query"), verifyEmail);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

export default router;