import Razorpay from "razorpay";

export const getRazorpay = () => {
  if (
    !process.env.RAZORPAY_KEY_ID ||
    !process.env.RAZORPAY_KEY_SECRET
  ) {
    return null;
  }

  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
};

export const toRazorpayAmount = (price) => {
  return Math.round(Number(price || 0) * 100);
};
