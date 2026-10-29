import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { cancelPublicBookingPayment, getBookingStatus } from "../api/public";
import { ArrowLeft, BadgeCheck, XCircle } from "lucide-react";
import { bookingCancelledPageStyles as s } from "../assets/dummyStyles";

export default function BookingCancelledPage() {
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get("booking_id");
  const slug = searchParams.get("slug");

  const [booking, setBooking] = useState(null);
  const [message, setMessage] = useState("Checking your booking status...");

  useEffect(() => {
    let isCurrent = true;

    const checkBookingStatus = async () => {
      if (!bookingId) {
        setMessage(
          "We could not check the payment because the booking ID is missing.",
        );
        return;
      }

      try {
        // This endpoint dismisses checkout but intentionally keeps a
        // pending payment booking unchanged while payment may be processing.
        await cancelPublicBookingPayment(bookingId).catch(() => {});

        const { data } = await getBookingStatus({
          booking_id: bookingId,
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
            "Your payment may still be processing. Please check again shortly.",
          );
        } else if (
          currentBooking.status === "payment_failed" ||
          currentBooking.paymentStatus === "failed"
        ) {
          setMessage(
            "Payment was not completed. You can return to the booking page and choose a slot again.",
          );
        } else if (currentBooking.status === "cancelled") {
          setMessage("This booking has been cancelled.");
        } else {
          setMessage(
            "We found your booking, but its payment is not confirmed yet.",
          );
        }
      } catch (error) {
        if (!isCurrent) return;

        setMessage(
          error.response?.data?.message ||
            "We could not check your payment status. Please try again shortly.",
        );
      }
    };

    checkBookingStatus();

    return () => {
      isCurrent = false;
    };
  }, [bookingId]);

  const isConfirmed =
    booking?.status === "confirmed" &&
    ["paid", "not_required"].includes(booking?.paymentStatus);
  const StatusIcon = isConfirmed ? BadgeCheck : XCircle;

  return (
    <div className={s.container}>
      <main className={s.card}>
        <div className={s.iconCircle}>
          <StatusIcon className={s.icon} />
        </div>

        <p className={s.statusLabel}>Payment status</p>
        <h1 className={s.heading}>{message}</h1>

        {booking && (
          <p className={s.description}>
            Booking: {booking.id} ·{" "}
            {booking.status?.replaceAll("_", " ") || "Unknown"} · Payment:{" "}
            {booking.paymentStatus?.replaceAll("_", " ") || "Unknown"}
          </p>
        )}

        <Link
          to={slug ? `/book/${encodeURIComponent(slug)}` : "/"}
          className={s.homeLink}
        >
          <ArrowLeft className={s.homeLinkIcon} />
          Back to Booking Page
        </Link>
      </main>
    </div>
  );
}
