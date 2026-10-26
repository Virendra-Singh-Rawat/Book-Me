import client from "./client.js";

export const getPublicBusiness = (slug) => client.get(`/public/${slug}`);

export const getPublicSlots = (slug, params) =>
  client.get(`/public/${slug}/slots`, { params });

export const requestPublicBookingOtp = (slug, customerEmail) =>
  client.post(`/public/${slug}/booking/request-otp`, { customerEmail });

export const verifyPublicBookingOtp = (slug, data) =>
  client.post(`/public/${slug}/booking/verify-otp`, data);

export const createPublicBooking = (slug, data) =>
  client.post(`/public/${slug}/booking`, data);

export const getBookingStatus = (params) =>
  client.get(`/public/booking/status`, { params });

export const cancelPublicBookingPayment = (bookingId) =>
  client.post("/public/booking/cancel-payment", { booking_id: bookingId });

export const verifyPublicBookingPayment = (data) =>
  client.post("/public/booking/verify-payment", data);
