import express from "express";
import {
  listAvailability,
  saveAvailability,
} from "../controllers/availability.controller.js";
import auth from "../middlewares/auth.middleware.js";

const router = express.Router();

// Get the logged-in user's availability
router.get("/", auth, listAvailability);

// Save or update availability
router.post("/", auth, saveAvailability);

export default router;
