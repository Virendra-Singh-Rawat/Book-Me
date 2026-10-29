import bcrypt from "bcryptjs";
import crypto from "crypto";
import EmailOtp from "../models/emailOtp.model.js";
import { sendOtpNotification } from "./bookingNotifications.js";

const OTP_TTL_MINUTES = 10;
const MAX_ATTEMPTS = 5;

const normalizeEmail = (email = "") => email.toLowerCase().trim();
const createCode = () => crypto.randomInt(100000, 1000000).toString();

export const requestEmailOtp = async ({ email, purpose }) => {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail) {
    throw new Error("Email is required");
  }

  const code = createCode();
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

  await EmailOtp.deleteMany({
    email: normalizedEmail,
    purpose,
    consumeAt: null,
  });

  await EmailOtp.create({
    email: normalizedEmail,
    purpose,
    codeHash,
    expiresAt,
  });

  await sendOtpNotification({ email: normalizedEmail, code, purpose });

  return {
    sent: true,
    email: normalizedEmail,
    expiresInMinutes: OTP_TTL_MINUTES,
  };
};

export const verifyEmailOtp = async ({
  email,
  purpose,
  code,
  consume = false,
}) => {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail || !code) {
    return {
      verified: false,
      reason: "Email and OTP are required.",
    };
  }

  const now = new Date();
  const record = await EmailOtp.findOne({
    email: normalizedEmail,
    purpose,
    consumeAt: null,
    expiresAt: { $gt: now },
  }).sort({ createdAt: -1 });

  if (!record) {
    return { verified: false, reason: "OTP Expired or Not Found" };
  }

  if (record.attempts >= MAX_ATTEMPTS) {
    return {
      verified: false,
      reason: "Too many OTP attempts, request a new code",
    };
  }

  const isMatch = await bcrypt.compare(String(code).trim(), record.codeHash);

  if (!isMatch) {
    const updatedRecord = await EmailOtp.findOneAndUpdate(
      {
        _id: record._id,
        consumeAt: null,
        expiresAt: { $gt: new Date() },
        attempts: { $lt: MAX_ATTEMPTS },
      },
      { $inc: { attempts: 1 } },
      { new: true },
    );

    if (!updatedRecord) {
      return {
        verified: false,
        reason: "OTP is no longer valid. Request a new code.",
      };
    }

    return { verified: false, reason: "Invalid OTP" };
  }

  if (consume) {
    const consumedRecord = await EmailOtp.findOneAndUpdate(
      {
        _id: record._id,
        consumeAt: null,
        expiresAt: { $gt: new Date() },
        attempts: { $lt: MAX_ATTEMPTS },
      },
      { $set: { consumeAt: new Date() } },
      { new: true },
    );

    if (!consumedRecord) {
      return {
        verified: false,
        reason: "OTP is no longer valid. Request a new code.",
      };
    }
  }

  return { verified: true, email: normalizedEmail };
};
