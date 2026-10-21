import express from "express";
import {
  getPaymentOverview,
  requestWithdrawal,
  updatePayoutDetails,
} from "../controllers/payment.controller.js";
import auth from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", auth, getPaymentOverview);
router.patch("/payout-details", auth, updatePayoutDetails);
router.post("/withdrawals", auth, requestWithdrawal);

export default router;
