import express from "express";
import {
  registerUser,
  verifyUser,
  loginUser,
  getProfile,
  logoutUser,
  forgotPassword,
  resetPassword,
} from "../controllers/User.controller.js";
import { isLoggedIn } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.get("/verify/:token", verifyUser);
router.post("/login", loginUser);
router.get("/getProfile", isLoggedIn, getProfile);
router.get("/logout", isLoggedIn, logoutUser);
router.post("/forgot", forgotPassword);
router.post("/reset/:token", resetPassword);

export default router;
