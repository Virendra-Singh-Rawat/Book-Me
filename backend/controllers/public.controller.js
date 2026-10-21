import crypto from "crypto";
import mongoose from "mongoose";

import Booking from "../models/booking.model.js";
import Service from "../models/service.model.js";
import User from "../models/user.model.js";

import { buildCustomerCalendarUrl } from "../utils/calendarLink.js";
import { createBookingCalendarEvent } from "../utils/googleCalendar.js";
import { sendBookingNotification } from "../utils/bookingNotifications.js";
import { requestEmailOtp, verifyEmailOtp } from "../utils/emailOtp.js";
import { generateSlots } from "../utils/slotGenerator.js";
import { getRazorpay, toRazorpayAmount } from "../utils/razorpay.js";
import { calculatePlatformSplit } from "../utils/money.js";
import { timeOverlap } from "../utils/overlap.js";
import { createBookingPayoutTransaction } from "../utils/wallet.js";

// --------------------------------------------------
// PUBLIC BUSINESS HELPERS
// --------------------------------------------------

const getBusinessBySlug = async (slug) => {
  return User.findOne({ slug }).select("-password");
};

const toPublicBusiness = (business) => ({
  id: business._id,
  name: business.name,
  slug: business.slug,
  businessName: business.businessName,
  businessDescription: business.businessDescription,
  brandTheme: business.brandTheme,
  brandAccent: business.brandAccent,
  timezone: business.timezone,
  googleCalendarConnected: business.googleCalendarConnected,
});

// Hold a slot for 30 minutes while payment is pending.
const holdWindowStart = () => new Date(Date.now() - 30 * 60 * 1000);

const findActiveSlotBookings = ({ userId, date }) => {
  return Booking.find({
    userId,
    date,
    $or: [
      { status: "confirmed" },
      {
        status: "pending_payment",
        createdAt: { $gte: holdWindowStart() },
      },
    ],
  });
};

// --------------------------------------------------
// GET PUBLIC BUSINESS
// --------------------------------------------------

export const getPublicBusiness = async (req, res) => {
  try {
    const business = await getBusinessBySlug(req.params.slug);

    if (!business) {
      return res.status(404).json({
        message: "Business not found.",
      });
    }

    const services = await Service.find({
      userId: business._id,
      isActive: true,
      isDeleted: { $ne: true },
    }).sort({ name: 1 });

    return res.json({
      business: toPublicBusiness(business),
      services,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// --------------------------------------------------
// GET AVAILABLE SLOTS
// --------------------------------------------------

export const getPublicSlots = async (req, res) => {
  try {
    const { date, serviceId } = req.query;

    if (!date || !serviceId) {
      return res.status(400).json({
        message: "Date and service are required.",
      });
    }

    if (!mongoose.isValidObjectId(serviceId)) {
      return res.status(400).json({
        message: "Invalid service ID.",
      });
    }

    const business = await getBusinessBySlug(req.params.slug);

    if (!business) {
      return res.status(404).json({
        message: "Business not found.",
      });
    }

    const service = await Service.findOne({
      _id: serviceId,
      userId: business._id,
      isActive: true,
      isDeleted: { $ne: true },
    });

    if (!service) {
      return res.status(404).json({
        message: "Service not found.",
      });
    }

    const slots = await generateSlots({
      userId: business._id,
      service,
      date,
    });

    return res.json(slots);
  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// --------------------------------------------------
// REQUEST BOOKING EMAIL OTP
// --------------------------------------------------

export const requestPublicBookingOtp = async (req, res) => {
  try {
    const { customerEmail } = req.body;
    const normalizedEmail = customerEmail?.toLowerCase().trim();

    if (!normalizedEmail) {
      return res.status(400).json({
        message: "Customer email is required.",
      });
    }

    const business = await getBusinessBySlug(req.params.slug);

    if (!business) {
      return res.status(404).json({
        message: "Business not found.",
      });
    }

    const result = await requestEmailOtp({
      email: normalizedEmail,
      purpose: "booking",
    });

    return res.json({
      message: "Verification code sent.",
      result,
    });
  } catch (error) {
    return res.status(503).json({
      message: "Unable to send verification code.",
      error: error.message,
    });
  }
};

// --------------------------------------------------
// VERIFY BOOKING EMAIL OTP
// --------------------------------------------------

export const verifyPublicBookingOtp = async (req, res) => {
  try {
    const { customerEmail, emailOtp } = req.body;

    if (!customerEmail || !emailOtp) {
      return res.status(400).json({
        message: "Email and OTP are required.",
      });
    }

    const otpResult = await verifyEmailOtp({
      email: customerEmail,
      purpose: "booking",
      code: emailOtp,
      consume: false,
    });

    if (!otpResult.verified) {
      return res.status(400).json({
        message: otpResult.reason || "Invalid OTP.",
      });
    }

    return res.json({
      message: "OTP verified.",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// --------------------------------------------------
// CREATE PUBLIC BOOKING + RAZORPAY ORDER
// --------------------------------------------------

export const createPublicBooking = async (req, res) => {
  let createdBooking = null;

  try {
    const {
      serviceId,
      customerName,
      customerEmail,
      customerAvatar,
      date,
      startTime,
      endTime,
      notes,
      emailOtp,
    } = req.body;

    if (
      !serviceId ||
      !customerName?.trim() ||
      !customerEmail?.trim() ||
      !date ||
      !startTime ||
      !endTime ||
      !emailOtp
    ) {
      return res.status(400).json({
        message: "All booking fields, including email OTP, are required.",
      });
    }

    if (!mongoose.isValidObjectId(serviceId)) {
      return res.status(400).json({
        message: "Invalid service ID.",
      });
    }

    if (
      !/^\d{2}:\d{2}$/.test(startTime) ||
      !/^\d{2}:\d{2}$/.test(endTime) ||
      startTime >= endTime
    ) {
      return res.status(400).json({
        message: "Invalid start or end time.",
      });
    }

    const normalizedCustomerEmail = customerEmail.toLowerCase().trim();
    const normalizedCustomerName = customerName.trim();

    const business = await getBusinessBySlug(req.params.slug);

    if (!business) {
      return res.status(404).json({
        message: "Business not found.",
      });
    }

    const service = await Service.findOne({
      _id: serviceId,
      userId: business._id,
      isActive: true,
      isDeleted: { $ne: true },
    });

    if (!service) {
      return res.status(404).json({
        message: "Service not found.",
      });
    }

    // Check whether the requested slot is still available.
    const bookings = await findActiveSlotBookings({
      userId: business._id,
      date,
    });

    const hasConflict = bookings.some((booking) =>
      timeOverlap(startTime, endTime, booking.startTime, booking.endTime),
    );

    if (hasConflict) {
      return res.status(409).json({
        message: "That slot is no longer available.",
      });
    }

    // Convert service price from rupees to paise.
    // Razorpay expects amounts in the smallest currency unit.
    const amount = toRazorpayAmount(service.price);

    if (!Number.isSafeInteger(amount) || amount < 0) {
      return res.status(400).json({
        message: "Invalid service price.",
      });
    }

    const razorpay = amount > 0 ? getRazorpay() : null;

    if (amount > 0 && !razorpay) {
      return res.status(503).json({
        message: "Razorpay payments are not configured yet.",
      });
    }

    // Verify and consume the booking OTP.
    const otpResult = await verifyEmailOtp({
      email: normalizedCustomerEmail,
      purpose: "booking",
      code: emailOtp,
      consume: true,
    });

    if (!otpResult.verified) {
      return res.status(400).json({
        message: otpResult.reason || "Email verification is required.",
      });
    }

    // Split the booking amount into platform fee and provider payout.
    const { platformFeeAmount, providerPayoutAmount } =
      calculatePlatformSplit(amount);

    const currency = "inr";

    const customerCalendarUrl = buildCustomerCalendarUrl({
      business,
      service,
      booking: {
        date,
        startTime,
        endTime,
        customerName: normalizedCustomerName,
        customerEmail: normalizedCustomerEmail,
        notes,
      },
    });

    // Create the booking first.
    createdBooking = await Booking.create({
      userId: business._id,
      serviceId,
      customerName: normalizedCustomerName,
      customerEmail: normalizedCustomerEmail,
      customerAvatar: customerAvatar || "A1.png",
      date,
      startTime,
      endTime,
      notes: notes || "",
      amount,
      platformFeeAmount,
      providerPayoutAmount,
      payoutStatus: amount > 0 ? "pending" : "not_required",
      currency,
      paymentStatus: amount > 0 ? "pending" : "not_required",
      status: amount > 0 ? "pending_payment" : "confirmed",
      customerCalendarUrl,
    });

    // Free bookings do not require a Razorpay order.
    if (amount === 0) {
      try {
        const calendarResult = await createBookingCalendarEvent({
          business,
          service,
          booking: createdBooking,
        });

        createdBooking.googleEventId = calendarResult.googleEventId || "";

        createdBooking.customerCalendarUrl =
          calendarResult.customerCalendarUrl || customerCalendarUrl;

        await createdBooking.save();
      } catch (calendarError) {
        console.error(
          "Google Calendar creation failed:",
          calendarError.message,
        );
      }

      sendBookingNotification({
        business,
        service,
        booking: createdBooking,
        type: "confirmed",
      }).catch((emailError) =>
        console.error("Booking confirmation email failed:", emailError.message),
      );

      return res.status(201).json({
        message: "Booking confirmed.",
        booking: createdBooking,
        customerCalendarUrl: createdBooking.customerCalendarUrl,
      });
    }

    // Create a Razorpay order for paid bookings.
    const order = await razorpay.orders.create({
      amount,
      currency: currency.toUpperCase(),
      receipt: String(createdBooking._id),
      notes: {
        bookingId: String(createdBooking._id),
        businessSlug: business.slug,
        serviceId: String(service._id),
      },
    });

    // Save the Razorpay order ID against the booking.
    createdBooking.razorpayOrderId = order.id;
    await createdBooking.save();

    // Return the details needed by Razorpay Checkout on the frontend.
    return res.status(201).json({
      message: "Continue to payment.",
      bookingId: createdBooking._id,
      razorpayOrderId: order.id,
      amount: order.amount,
      currency: order.currency,
      razorpayKeyId: process.env.RAZORPAY_KEY_ID,
      businessName: business.businessName || business.name,
      serviceName: service.name,
      customerName: normalizedCustomerName,
      customerEmail: normalizedCustomerEmail,
    });
  } catch (error) {
    // If order creation fails, release the slot by failing the pending booking.
    if (
      createdBooking &&
      createdBooking.status === "pending_payment" &&
      !createdBooking.razorpayOrderId
    ) {
      try {
        createdBooking.status = "payment_failed";
        createdBooking.paymentStatus = "failed";
        await createdBooking.save();
      } catch (saveError) {
        console.error(
          "Failed to update booking after order creation error:",
          saveError.message,
        );
      }
    }

    console.error("Public booking creation failed:", error.message);

    return res.status(500).json({
      message: "Unable to create booking or payment order.",
    });
  }
};

// --------------------------------------------------
// CONFIRM A SUCCESSFULLY PAID BOOKING
// --------------------------------------------------

const confirmPaidBooking = async ({ booking, business, service }) => {
  if (booking.status === "confirmed" && booking.paymentStatus === "paid") {
    return booking;
  }

  // Check again in case another booking was confirmed in the meantime.
  const conflictingBookings = await Booking.find({
    _id: { $ne: booking._id },
    userId: booking.userId,
    date: booking.date,
    status: "confirmed",
  });

  const hasConflict = conflictingBookings.some((candidate) =>
    timeOverlap(
      booking.startTime,
      booking.endTime,
      candidate.startTime,
      candidate.endTime,
    ),
  );

  if (hasConflict) {
    booking.status = "payment_failed";
    booking.paymentStatus = "failed";

    let refundInitiated = false;

    try {
      const razorpay = getRazorpay();
      if (razorpay && booking.razorpayPaymentId) {
        await razorpay.payments.refund(booking.razorpayPaymentId, {
          amount: booking.amount,
          notes: {
            reason: "Slot no longer available",
            bookingId: String(booking._id),
          },
        });
        booking.paymentStatus = "refunded";
        refundInitiated = true;
      }
    } catch (refundError) {
      console.error(
        "Refund failed for booking",
        String(booking._id),
        refundError.message,
      );
    }

    await booking.save();

    const error = new Error(
      refundInitiated
        ? "That slot was just taken. Your payment has been refunded."
        : "That slot was just taken. Your refund could not be processed automatically; please contact support.",
    );
    error.code = "SLOT_CONFLICT";
    error.refundInitiated = refundInitiated;
    throw error;
  }

  booking.status = "confirmed";
  booking.paymentStatus = "paid";
  booking.payoutStatus =
    booking.providerPayoutAmount > 0 ? "available" : "not_required";

  try {
    const calendarResult = await createBookingCalendarEvent({
      business,
      service,
      booking,
    });

    booking.googleEventId = calendarResult.googleEventId || "";

    booking.customerCalendarUrl =
      calendarResult.customerCalendarUrl || booking.customerCalendarUrl;
  } catch (calendarError) {
    console.error(
      "Google Calendar confirmation failed:",
      calendarError.message,
    );
  }

  await booking.save();

  // The wallet utility should be idempotent for this booking.
  await createBookingPayoutTransaction({
    booking,
    description: `Booking payment from ${booking.customerName || "Customer"}`,
  });

  sendBookingNotification({
    business,
    service,
    booking,
    type: "confirmed",
  }).catch((emailError) =>
    console.error("Booking confirmation email failed:", emailError.message),
  );

  return booking;
};

// --------------------------------------------------
// VERIFY RAZORPAY PAYMENT SIGNATURE
// --------------------------------------------------

const isValidRazorpaySignature = ({ orderId, paymentId, signature }) => {
  const secret = process.env.RAZORPAY_KEY_SECRET;

  if (!secret || !orderId || !paymentId || !signature) {
    return false;
  }

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  const expected = Buffer.from(expectedSignature, "hex");
  const received = Buffer.from(signature, "hex");

  return (
    expected.length === received.length &&
    crypto.timingSafeEqual(expected, received)
  );
};

// --------------------------------------------------
// VERIFY PAYMENT + CONFIRM BOOKING
// --------------------------------------------------

export const verifyPublicBookingPayment = async (req, res) => {
  try {
    const {
      bookingId,
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: razorpayPaymentId,
      razorpay_signature: razorpaySignature,
    } = req.body;

    if (
      !bookingId ||
      !mongoose.isValidObjectId(bookingId) ||
      !razorpayOrderId ||
      !razorpayPaymentId ||
      !razorpaySignature
    ) {
      return res.status(400).json({
        message: "Booking ID and Razorpay payment details are required.",
      });
    }

    const booking = await Booking.findOne({
      _id: bookingId,
      razorpayOrderId,
    });

    if (!booking) {
      return res.status(404).json({
        message: "Booking or Razorpay order not found.",
      });
    }

    // Support safe retries if the frontend submits verification more than once.
    if (
      booking.status === "confirmed" &&
      booking.paymentStatus === "paid" &&
      booking.razorpayPaymentId === razorpayPaymentId
    ) {
      return res.json({
        message: "Payment already verified.",
        booking,
      });
    }

    if (booking.status !== "pending_payment") {
      return res.status(409).json({
        message: "This booking is no longer awaiting payment.",
        booking,
      });
    }

    // Verify the signature on the server. Never trust the frontend alone.
    const signatureValid = isValidRazorpaySignature({
      orderId: razorpayOrderId,
      paymentId: razorpayPaymentId,
      signature: razorpaySignature,
    });

    if (!signatureValid) {
      return res.status(400).json({
        message: "Razorpay payment signature verification failed.",
      });
    }

    const razorpay = getRazorpay();

    if (!razorpay) {
      return res.status(503).json({
        message: "Razorpay payments are not configured yet.",
      });
    }

    // Fetch payment details from Razorpay to verify the actual payment.
    const payment = await razorpay.payments.fetch(razorpayPaymentId);

    if (
      payment.order_id !== booking.razorpayOrderId ||
      Number(payment.amount) !== Number(booking.amount) ||
      String(payment.currency).toLowerCase() !==
        String(booking.currency).toLowerCase()
    ) {
      return res.status(400).json({
        message: "Payment details do not match the booking.",
      });
    }

    // This implementation confirms bookings only after capture.
    if (payment.status !== "captured") {
      return res.status(409).json({
        message: "Payment has not been captured yet.",
        paymentStatus: payment.status,
      });
    }

    const [business, service] = await Promise.all([
      User.findById(booking.userId),
      Service.findById(booking.serviceId),
    ]);

    if (!business || !service) {
      return res.status(404).json({
        message: "Booking business or service was not found.",
      });
    }

    booking.razorpayPaymentId = razorpayPaymentId;

    await confirmPaidBooking({
      booking,
      business,
      service,
    });

    const updatedBooking = await Booking.findById(booking._id).populate(
      "serviceId",
      "name duration price",
    );

    return res.json({
      message: "Payment verified and booking confirmed.",
      booking: updatedBooking,
    });
  } catch (error) {
    if (error.code === "SLOT_CONFLICT") {
      return res.status(409).json({
        message: error.message,
        refunded: error.refundInitiated,
      });
    }

    console.error("Razorpay payment verification failed:", error.message);

    return res.status(500).json({
      message: "Unable to verify payment at this time.",
    });
  }
};

// --------------------------------------------------
// GET BOOKING STATUS
// --------------------------------------------------

export const getBookingStatus = async (req, res) => {
  try {
    const { booking_id: bookingId } = req.query;

    if (!bookingId || !mongoose.isValidObjectId(bookingId)) {
      return res.status(400).json({
        message: "A valid booking ID is required.",
      });
    }

    const booking = await Booking.findById(bookingId).populate(
      "serviceId",
      "name duration price",
    );

    if (!booking) {
      return res.status(404).json({
        message: "Booking not found.",
      });
    }

    return res.json({ booking });
  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// --------------------------------------------------
// CANCEL / DISMISS PUBLIC BOOKING PAYMENT
// --------------------------------------------------

export const cancelPublicBookingPayment = async (req, res) => {
  try {
    const { booking_id: bookingId } = req.body;

    if (!bookingId || !mongoose.isValidObjectId(bookingId)) {
      return res.status(400).json({
        message: "A valid booking ID is required.",
      });
    }

    const booking = await Booking.findOne({
      _id: bookingId,
      status: "pending_payment",
    });

    if (!booking) {
      return res.json({
        message: "No pending booking to cancel.",
      });
    }

    // Do not mark the booking as failed solely because the Checkout
    // window was closed. The payment may still be processing.
    // A later verification or reconciliation can determine its final status.
    return res.json({
      message: "Payment was not completed. The booking remains pending.",
      bookingId: booking._id,
      status: booking.status,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};
// this is public.controller.js
