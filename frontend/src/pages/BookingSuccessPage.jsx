import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getBookingStatus } from "../api/public";
import { BadgeCheck, Calendar, ArrowLeft } from "lucide-react";
import { bookingSuccessPageStyles as s } from "../assets/dummyStyles";

export default function BookingSuccessPage() {
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get("booking_id");
  const slug = searchParams.get("slug");
  const statusToken = searchParams.get("status_token");
  const [booking, setBooking] = useState(null);
  const [message, setMessage] = useState("Verifying your payment...");

  useEffect(() => {
    let isCurrent = true;

    const loadBookingStatus = async () => {
      if (!bookingId || !statusToken) {
        setMessage(
          "We could not verify this payment because the booking access details are missing.",
        );
        return;
      }

      try {
        const { data } = await getBookingStatus({
          booking_id: bookingId,
          status_token: statusToken,
        });
        if (!isCurrent) return;

        const currentBooking = data.booking;
        setBooking(currentBooking);

        if (
          currentBooking.status === "confirmed" &&
          ["paid", "not_required"].includes(currentBooking.paymentStatus)
        ) {
          setMessage("Payment received. Your booking is confirmed.");
        } else if (currentBooking.status === "pending_payment") {
          setMessage(
            "Your payment is still being processed. Please check again shortly.",
          );
        } else if (currentBooking.status === "payment_failed") {
          setMessage(
            "We could not confirm your payment. Please contact support if you were charged.",
          );
        } else {
          setMessage(
            "We found your booking, but its payment is not confirmed yet.",
          );
        }
      } catch (error) {
        if (!isCurrent) return;
        setMessage(
          error.response?.data?.message ||
            "We could not verify the payment status. Please try again shortly.",
        );
      }
    };

    loadBookingStatus();
    return () => {
      isCurrent = false;
    };
  }, [bookingId, statusToken]);

  return (
    <div className={s.container}>
      <main className={s.card}>
        <div className={s.iconCircle}>
          <BadgeCheck className={s.checkIcon} />
        </div>
        <p className={s.statusLabel}>Payment verification</p>
        <h1 className={s.heading}>{message}</h1>

        {booking && (
          <div className={s.bookingDetails}>
            <div className={s.serviceRow}>
              <Calendar className={s.calendarDaysIcon} />
              <p className={s.serviceName}>Booking reference: {booking.id}</p>
            </div>
            <p className={s.statusText}>
              Booking status:{" "}
              {booking.status?.replaceAll("_", " ") || "Unknown"}
            </p>
            <p className={s.statusText}>
              Payment status:{" "}
              {booking.paymentStatus?.replaceAll("_", " ") || "Unknown"}
            </p>
          </div>
        )}

        <Link
          to={slug ? `/book/${encodeURIComponent(slug)}` : "/"}
          className={s.backLink}
        >
          <ArrowLeft className={s.backIcon} />
          Back to Booking Page
        </Link>
      </main>
    </div>
  );
}
