import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import { requestEmailOtp, verifyEmailOtp } from "../utils/emailOtp.js";
import slugify from "../utils/slug.js";

const createToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

const toUserResponse = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  slug: user.slug,
  businessName: user.businessName,
  businessDescription: user.businessDescription,
  brandTheme: user.brandTheme,
  brandAccent: user.brandAccent,
  timezone: user.timezone,
  googleCalendarConnected: user.googleCalendarConnected,
  googleCalendarId: user.googleCalendarId,
  payoutDetails: user.payoutDetails,
  razorpayConfigured: Boolean(process.env.RAZORPAY_SECRET_KEY),
});

export const registerUser = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      businessName,
      businessDescription,
      timezone,
      emailOtp,
    } = req.body;
    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Name,Email, and Password are required" });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }
    const otpResult = await verifyEmailOtp({
      email: normalizedEmail,
      purpose: "registration",
      code: emailOtp,
      consume: true,
    });
    if (!otpResult.verified) {
      return res.status(400).json({
        message: otpResult.reason || "Email Verification is required.",
      });
    }
    const baseSlug = slugify(businessName || name) || "business";

    let finalSlug = baseSlug;
    let counter = 1;
    while (await User.findOne({ slug: finalSlug })) {
      finalSlug = `${baseSlug}-${counter}`;
      counter += 1;
    }
    const hashPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email: normalizedEmail,
      password: hashPassword,
      slug: finalSlug,
      businessName: businessName || "",
      businessDescription: businessDescription || "",
      timezone: timezone || "Asia/Kolkata",
    });

    const token = createToken(user._id);
    res.status(201).json({
      message: "Registered Successfully",
      token,
      user: toUserResponse(user),
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

export const requestRegistrationOTP = async (req, res) => {
  try {
    const { email } = req.body;
    const normalizedEmail = email?.toLowerCase().trim();
    if (!normalizedEmail) {
      return res.status(400).json({ message: "Email is required." });
    }
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists." });
    }
    const result = await requestEmailOtp({
      email: normalizedEmail,
      purpose: "registration",
    });
    return res.json({ message: "Verification code sent ", result });
  } catch (error) {
    return res.status(503).json({ message: error.message });
  }
};

export const verifyRegistrationOTP = async (req, res) => {
  try {
    const { email, emailOtp } = req.body;
    const normalizedEmail = email?.toLowerCase().trim();
    if (!normalizedEmail || !emailOtp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ message: "Email already exists." });
    }
    const otpResult = await verifyEmailOtp({
      email: normalizedEmail,
      purpose: "registration",
      code: emailOtp,
      consume: false,
    });
    if (!otpResult.verified) {
      return res
        .status(400)
        .json({ message: otpResult.reason || "Invalid OTP" });
    }
    return res.json({ message: "OTP Verified" });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server Error", error: error.message });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email or Password are required." });
    }
    const normalizedEmail = email?.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials." });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials." });
    }
    const token = createToken(user._id);
    return res.json({
      message: "Logged in successfully",
      token,
      user: toUserResponse(user),
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    return res.json({ user: toUserResponse(user) });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server Error", error: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const {
      businessName,
      businessDescription,
      timezone,
      brandTheme,
      brandAccent,
    } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (businessName !== undefined) user.businessName = businessName;
    if (businessDescription !== undefined)
      user.businessDescription = businessDescription;
    if (timezone !== undefined) user.timezone = timezone;
    if (brandTheme !== undefined) user.brandTheme = brandTheme;
    if (brandAccent !== undefined) user.brandAccent = brandAccent;

    const baseSlug = slugify(user.businessName || user.name) || "business";
    let finalSlug = baseSlug;
    let counter = 1;

    while (await User.findOne({ slug: finalSlug, _id: { $ne: user._id } })) {
      finalSlug = `${baseSlug}-${counter}`;
      counter += 1;
    }

    user.slug = finalSlug;

    await user.save();

    res.json({
      message: "Profile updated successfully",
      user: toUserResponse(user),
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

//controllers/auth.controller.js