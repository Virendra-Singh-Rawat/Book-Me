import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import Booking from "../models/booking.model.js";
import User from "../models/user.model.js";
import WalletTransaction from "../models/walletTransaction.model.js";
import Withdrawal from "../models/withdrawal.model.js";

const createAdminToken = (email) => {
  return jwt.sign({ email, role: "admin" }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

const terminalWithdrawalStatuses = ["paid", "rejected"];

const sumByKey = (rows) =>
  rows.reduce((acc, row) => {
    acc[row._id] = row.total;
    return acc;
  }, {});

const getAdminSummary = async () => {
  const [usersCount, bookingTotals, walletTotals, withdrawalTotals] =
    await Promise.all([
      User.countDocuments(),

      Booking.aggregate([
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            paidBookings: {
              $sum: {
                $cond: [{ $eq: ["$paymentStatus", "paid"] }, 1, 0],
              },
            },
            grossRevenue: {
              $sum: {
                $cond: [{ $eq: ["$paymentStatus", "paid"] }, "$amount", 0],
              },
            },
            platformFees: {
              $sum: {
                $cond: [
                  { $eq: ["$paymentStatus", "paid"] },
                  "$platformFeeAmount",
                  0,
                ],
              },
            },
            paidProviderPayouts: {
              $sum: {
                $cond: [
                  { $eq: ["$paymentStatus", "paid"] },
                  "$providerPayoutAmount",
                  0,
                ],
              },
            },
            confirmedProviderPayouts: {
              $sum: {
                $cond: [
                  { $eq: ["$status", "confirmed"] },
                  "$providerPayoutAmount",
                  0,
                ],
              },
            },
            activeProviderPayouts: {
              $sum: {
                $cond: [
                  {
                    $in: ["$status", ["cancelled", "payment_failed"]],
                  },
                  0,
                  "$providerPayoutAmount",
                ],
              },
            },
          },
        },
      ]),

      WalletTransaction.aggregate([
        {
          $group: {
            _id: "$type",
            total: { $sum: "$amount" },
          },
        },
      ]),

      Withdrawal.aggregate([
        {
          $group: {
            _id: "$status",
            total: { $sum: "$amount" },
          },
        },
      ]),
    ]);

  const bookingSummary = bookingTotals[0] || {};
  const walletMap = sumByKey(walletTotals);
  const withdrawalMap = sumByKey(withdrawalTotals);

  const paidProviderPayouts = bookingSummary.paidProviderPayouts || 0;
  const confirmedProviderPayouts = bookingSummary.confirmedProviderPayouts || 0;
  const activeProviderPayouts = bookingSummary.activeProviderPayouts || 0;
  const walletEarned = walletMap.booking_payout || 0;
  const heldWithdrawals = walletMap.withdrawal_hold || 0;
  const reversedWithdrawals = walletMap.withdrawal_reversal || 0;

  const providerPayouts = Math.max(
    paidProviderPayouts,
    confirmedProviderPayouts,
    activeProviderPayouts,
    walletEarned,
  );

  const pendingWithdrawals =
    (withdrawalMap.pending || 0) + (withdrawalMap.processing || 0);
  const paidWithdrawals = withdrawalMap.paid || 0;

  const usersAvailableBalance = Math.max(
    0,
    walletEarned - heldWithdrawals + reversedWithdrawals,
  );

  const walletWithdrawalHold = usersAvailableBalance + pendingWithdrawals;
  const bookingWithdrawalHold = Math.max(0, providerPayouts - paidWithdrawals);

  return {
    users: usersCount,
    bookings: bookingSummary.count || 0,
    paidBookings: bookingSummary.paidBookings || 0,
    grossRevenue: bookingSummary.grossRevenue || 0,
    platformFees: bookingSummary.platformFees || 0,
    providerPayouts,
    walletEarned,
    usersAvailableBalance,
    pendingWithdrawals,
    paidWithdrawals,
    withdrawalHolds: Math.max(walletWithdrawalHold, bookingWithdrawalHold),
  };
};

const isAdminPasswordValid = async (password) => {
  if (process.env.ADMIN_PASSWORD_HASH) {
    return bcrypt.compare(password, process.env.ADMIN_PASSWORD_HASH);
  }

  return password === process.env.ADMIN_PASSWORD;
};

export const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const adminEmail = (process.env.ADMIN_EMAIL || "").toLowerCase().trim();

    if (
      !adminEmail ||
      (!process.env.ADMIN_PASSWORD && !process.env.ADMIN_PASSWORD_HASH)
    ) {
      return res
        .status(503)
        .json({ message: "Admin login is not configured." });
    }

    if (!email || !password || email.toLowerCase().trim() !== adminEmail) {
      return res.status(401).json({ message: "Invalid admin credentials." });
    }

    const passwordValid = await isAdminPasswordValid(password);

    if (!passwordValid) {
      return res.status(401).json({ message: "Invalid admin credentials." });
    }

    return res.json({
      message: "Admin logged in successfully.",
      token: createAdminToken(adminEmail),
      admin: { email: adminEmail },
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

export const getAdminDashboard = async (req, res) => {
  try {
    const [users, summary, withdrawals, recentBookings] = await Promise.all([
      User.find()
        .select("name email businessName slug payoutDetails createdAt")
        .sort({ createdAt: -1 })
        .limit(100),

      getAdminSummary(),

      Withdrawal.find()
        .populate("userId", "name email businessName")
        .sort({ createdAt: -1 })
        .limit(50),

      Booking.find({ paymentStatus: "paid" })
        .populate("userId", "name email businessName")
        .populate("serviceId", "name")
        .sort({ updatedAt: -1 })
        .limit(10),
    ]);

    return res.json({
      summary,
      users,
      withdrawals,
      recentBookings,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

export const updateWithdrawalStatus = async (req, res) => {
  const { status, adminNote } = req.body;
  const allowedStatuses = ["pending", "processing", "paid", "rejected"];

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ message: "Invalid withdrawal status" });
  }

  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid withdrawal ID" });
  }

  const session = await mongoose.startSession();
  let updatedWithdrawal;

  try {
    await session.withTransaction(async () => {
      updatedWithdrawal = null;

      // Only a non-terminal withdrawal can transition. The status change and
      // reversal creation commit or roll back together.
      const withdrawal = await Withdrawal.findOneAndUpdate(
        {
          _id: req.params.id,
          status: { $nin: terminalWithdrawalStatuses },
        },
        {
          $set: {
            status,
            ...(adminNote !== undefined ? { adminNote } : {}),
          },
        },
        {
          new: true,
          session,
          runValidators: true,
        },
      );

      if (!withdrawal) {
        const current = await Withdrawal.findById(req.params.id).session(
          session,
        );

        if (!current) {
          throw Object.assign(new Error("Withdrawal not found"), {
            statusCode: 404,
          });
        }

        throw Object.assign(
          new Error(
            `Withdrawal is already ${current.status} and cannot be changed`,
          ),
          { statusCode: 400 },
        );
      }

      if (status === "rejected") {
        await WalletTransaction.updateOne(
          {
            withdrawalId: withdrawal._id,
            type: "withdrawal_reversal",
          },
          {
            $setOnInsert: {
              userId: withdrawal.userId,
              withdrawalId: withdrawal._id,
              type: "withdrawal_reversal",
              amount: withdrawal.amount,
              status: "reversed",
              description: "Withdrawal rejected and funds returned",
            },
          },
          {
            upsert: true,
            session,
            runValidators: true,
          },
        );
      }

      updatedWithdrawal = withdrawal;
    });

    const [summary, populatedWithdrawal] = await Promise.all([
      getAdminSummary(),
      Withdrawal.findById(updatedWithdrawal._id).populate(
        "userId",
        "name email businessName",
      ),
    ]);

    return res.json({
      message: `Withdrawal marked as ${status}`,
      withdrawal: populatedWithdrawal,
      summary,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }

    if (error.code === 11000) {
      return res.status(409).json({
        message: "This withdrawal reversal has already been recorded.",
      });
    }

    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  } finally {
    await session.endSession();
  }
};

