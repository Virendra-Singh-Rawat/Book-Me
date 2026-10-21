import express from "express";
import {
  getPublicBusiness,
  getPublicSlots,
  requestPublicBookingOtp,
  verifyPublicBookingOtp,
  createPublicBooking,
  verifyPublicBookingPayment,
  getBookingStatus,
  cancelPublicBookingPayment,
} from "../controllers/public.controller.js";

const router = express.Router();

router.post("/booking/verify-payment", verifyPublicBookingPayment);
router.get("/booking/status", getBookingStatus);
router.post("/booking/cancel-payment", cancelPublicBookingPayment);

router.get("/:slug", getPublicBusiness);
router.get("/:slug/slots", getPublicSlots);
router.post("/:slug/booking/request-otp", requestPublicBookingOtp);
router.post("/:slug/booking/verify-otp", verifyPublicBookingOtp);
router.post("/:slug/booking", createPublicBooking);

export default router;
