import mongoose from "mongoose";
import User from "../models/user.model.js";
import WalletTransaction from "../models/walletTransaction.model.js";
import Withdrawal from "../models/withdrawal.model.js";
import { getWalletSummary } from "../utils/wallet.js";

/**
 * Casts a string to a Mongoose ObjectId type.
 */
const toObjectId = (id) => new mongoose.Types.ObjectId(String(id));

/**
 * Masks an account number by returning only the last 4 digits.
 */
const maskAccountNumber = (accountNumber = "") => {
  const digits = String(accountNumber).replace(/\D/g, "");
  return digits.slice(-4);
};

const getAvailableBalanceInSession = async (userId, session) => {
  const rows = await WalletTransaction.aggregate([
    { $match: { userId } },
    {
      $group: {
        _id: "$type",
        total: { $sum: "$amount" },
      },
    },
  ]).session(session);

  const totals = rows.reduce((acc, row) => {
    acc[row._id] = row.total;
    return acc;
  }, {});

  return Math.max(
    0,
    (totals.booking_payout || 0) -
      (totals.withdrawal_hold || 0) +
      (totals.withdrawal_reversal || 0),
  );
};

const httpError = (statusCode, message) =>
  Object.assign(new Error(message), { statusCode });

/**
 * Retrieves an overview of the user's payments including payout details,
 * total wallet balance summary, and recent transactions/withdrawals.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
export const getPaymentOverview = async (req, res) => {
  try {
    const userId = toObjectId(req.user.id);

    const [user, summary, transactions, withdrawals] = await Promise.all([
      User.findById(userId).select("payoutDetails"),
      getWalletSummary(userId),
      WalletTransaction.find({ userId }).sort({ createdAt: -1 }).limit(15),
      Withdrawal.find({ userId }).sort({ createdAt: -1 }).limit(10),
    ]);

    return res.json({
      payoutDetails: user?.payoutDetails || {},
      wallet: summary,
      transactions,
      withdrawals,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

/**
 * Updates the user's payout (bank/UPI) details.
 * Determines if the payout profile is complete based on provided information.
 *
 * @param {Object} req - Express request object containing payout details in body.
 * @param {Object} res - Express response object.
 */
export const updatePayoutDetails = async (req, res) => {
  try {
    const { accountHolderName, bankName, accountNumber, ifsc, upiId } =
      req.body;

    if (!accountHolderName || (!accountNumber && !upiId)) {
      return res.status(400).json({
        message: "Account holder and a bank account or UPI ID are required",
      });
    }

    const payoutDetails = {
      accountHolderName,
      bankName: bankName || "",
      accountLast4: accountNumber ? maskAccountNumber(accountNumber) : "",
      ifsc: ifsc || "",
      upiId: upiId || "",
      isComplete: Boolean(accountHolderName && (accountNumber || upiId)),
      updatedAt: new Date(),
    };

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { payoutDetails },
      { new: true },
    ).select("payoutDetails");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({
      message: "Payout details saved",
      payoutDetails: user.payoutDetails,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

/**
 * Processes a withdrawal request from the user's available wallet balance.
 * Validates minimum amount, available balance, and complete payout details.
 * Creates a withdrawal record and a pending hold transaction.
 *
 * @param {Object} req - Express request object containing the withdrawal amount.
 * @param {Object} res - Express response object.
 */
export const requestWithdrawal = async (req, res) => {
  const amountInput = Number(req.body.amount);

  if (!Number.isFinite(amountInput)) {
    return res.status(400).json({
      message: "A valid withdrawal amount is required",
    });
  }

  const amount = Math.round(amountInput);

  if (!Number.isSafeInteger(amount) || amount < 100) {
    return res.status(400).json({
      message: "Withdrawal amount must be at least 100",
    });
  }

  const userId = toObjectId(req.user.id);
  const session = await mongoose.startSession();
  let withdrawal;

  try {
    await session.withTransaction(async () => {
      withdrawal = null;

      // This shared per-user write serializes concurrent withdrawal
      // transactions. strict:false allows this internal version field
      // without adding it to the User schema.
      const lockResult = await User.updateOne(
        { _id: userId },
        { $inc: { walletWithdrawalVersion: 1 } },
        { session, strict: false },
      );

      if (lockResult.matchedCount === 0) {
        throw httpError(404, "User not found");
      }

      const user = await User.findById(userId)
        .select("payoutDetails")
        .session(session);

      if (!user?.payoutDetails?.isComplete) {
        throw httpError(
          400,
          "Add payout details before requesting a withdrawal",
        );
      }

      const availableBalance = await getAvailableBalanceInSession(
        userId,
        session,
      );

      if (amount > availableBalance) {
        throw httpError(400, "Withdrawal amount exceeds available balance");
      }

      [withdrawal] = await Withdrawal.create(
        [
          {
            userId,
            amount,
            payoutSnapshot: user.payoutDetails,
          },
        ],
        { session },
      );

      await WalletTransaction.create(
        [
          {
            userId,
            withdrawalId: withdrawal._id,
            type: "withdrawal_hold",
            amount,
            status: "pending",
            description: "Withdrawal requested",
          },
        ],
        { session },
      );
    });

    return res.status(201).json({
      message: "Withdrawal requested",
      withdrawal,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }

    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  } finally {
    await session.endSession();
  }
};

