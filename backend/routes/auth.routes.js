import express from "express";
import {
  getMe,
  loginUser,
  registerUser,
  requestRegistrationOTP,
  updateProfile,
  verifyRegistrationOTP,
} from "../controllers/auth.controller.js";
import auth from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/register/request-otp", requestRegistrationOTP);
router.post("/register/verify-otp", verifyRegistrationOTP);
router.post("/login", loginUser);

router.get("/me", auth, getMe);
router.patch("/profile", auth, updateProfile);

export default router;
