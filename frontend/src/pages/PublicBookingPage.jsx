import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  createPublicBooking,
  getPublicBusiness,
  getPublicSlots,
  requestPublicBookingOtp,
  verifyPublicBookingOtp,
  verifyPublicBookingPayment,
} from "../api/public";
import {
  Clock,
  CalendarDays,
  User,
  Mail,
  Lock,
  BadgeCheck,
  Shield,
  Check,
} from "lucide-react";
import greenBanner from "../assets/green.png";
import purpleBanner from "../assets/purple.png";
import redBanner from "../assets/red.png";
import whiteBanner from "../assets/white.png";
import yellowBanner from "../assets/yellow.png";
import C1 from "../assets/icons/C1.png";
import C2 from "../assets/icons/C2.png";
import C3 from "../assets/icons/C3.png";
import C4 from "../assets/icons/C4.png";
import C5 from "../assets/icons/C5.png";
import C6 from "../assets/icons/C6.png";
import C7 from "../assets/icons/C7.png";
import C8 from "../assets/icons/C8.png";
import A1 from "../assets/avatars/A1.png";
import A2 from "../assets/avatars/A2.png";
import A3 from "../assets/avatars/A3.png";
import A4 from "../assets/avatars/A4.png";
import A5 from "../assets/avatars/A5.png";
import A6 from "../assets/avatars/A6.png";
import A7 from "../assets/avatars/A7.png";
import A8 from "../assets/avatars/A8.png";
import A9 from "../assets/avatars/A9.png";
import A10 from "../assets/avatars/A10.png";
import A11 from "../assets/avatars/A11.png";
import A12 from "../assets/avatars/A12.png";
import A13 from "../assets/avatars/A13.png";
import A15 from "../assets/avatars/A15.png";
import A16 from "../assets/avatars/A16.png";
import {
  getBrandThemeStyle,
  publicBookingPageStyles as s,
} from "../assets/dummyStyles";

const getLocalDateKey = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const loadRazorpayScript = () =>
  new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const existingScript = document.querySelector(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]',
    );

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(true), {
        once: true,
      });
      existingScript.addEventListener(
        "error",
        () => reject(new Error("Could not load Razorpay Checkout.")),
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () =>
      reject(new Error("Could not load Razorpay Checkout."));
    document.body.appendChild(script);
  });

const ICON_MAP = {
  "C1.png": C1,
  "C2.png": C2,
  "C3.png": C3,
  "C4.png": C4,
  "C5.png": C5,
  "C6.png": C6,
  "C7.png": C7,
  "C8.png": C8,
};

const AVATAR_MAP = {
  "A1.png": A1,
  "A2.png": A2,
  "A3.png": A3,
  "A4.png": A4,
  "A5.png": A5,
  "A6.png": A6,
  "A7.png": A7,
  "A8.png": A8,
  "A9.png": A9,
  "A10.png": A10,
  "A11.png": A11,
  "A12.png": A12,
  "A13.png": A13,
  "A15.png": A15,
  "A16.png": A16,
};

const themeBannerImages = {
  emerald: greenBanner,
  indigo: purpleBanner,
  rose: redBanner,
  amber: yellowBanner,
  slate: whiteBanner,
};

export default function PublicBookingPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const today = useMemo(() => getLocalDateKey(), []);

  const [business, setBusiness] = useState(null);
  const [services, setServices] = useState([]);
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [message, setMessage] = useState("");
  const [calendarUrl, setCalendarUrl] = useState("");
  const [businessLoading, setBusinessLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpSentTo, setOtpSentTo] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);

  const [form, setForm] = useState({
    serviceId: "",
    date: today,
    customerName: "",
    customerEmail: "",
    customerAvatar: "A1.png",
    emailOtp: "",
    notes: "",
  });

  const selectedService = useMemo(
    () => services.find((service) => service._id === form.serviceId),
    [services, form.serviceId],
  );

  const brandTheme = getBrandThemeStyle(business?.brandTheme);
  const accent = business?.brandAccent || brandTheme.accent;
  const brandStyleVars = {
    "--brand-accent": accent,
    "--brand-panel": brandTheme.panel,
  };
  const bannerImage = themeBannerImages[business?.brandTheme] || greenBanner;
  const normalizedEmail = form.customerEmail.trim().toLowerCase();
  const isEmailVerified =
    otpVerified && Boolean(normalizedEmail) && otpSentTo === normalizedEmail;

  useEffect(() => {
    if (otpCooldown <= 0) return undefined;

    const timer = window.setTimeout(() => {
      setOtpCooldown((remaining) => Math.max(0, remaining - 1));
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [otpCooldown]);

  useEffect(() => {
    let isCurrent = true;

    const loadBusiness = async () => {
      setBusinessLoading(true);
      setMessage("");

      try {
        const { data } = await getPublicBusiness(slug);
        if (!isCurrent) return;

        const activeServices = Array.isArray(data.services)
          ? data.services
          : [];
        setBusiness(data.business);
        setServices(activeServices);
        setForm((previousForm) => ({
          ...previousForm,
          serviceId: activeServices[0]?._id || "",
        }));
      } catch (error) {
        if (!isCurrent) return;

        setMessage(
          error.response?.data?.message || "Could not load booking page",
        );
      } finally {
        if (isCurrent) setBusinessLoading(false);
      }
    };

    loadBusiness();

    return () => {
      isCurrent = false;
    };
  }, [slug]);

  useEffect(() => {
    let isCurrent = true;

    const loadSlots = async () => {
      setSelectedSlot(null);

      if (!form.serviceId || !form.date) {
        setSlots([]);
        setSlotsLoading(false);
        return;
      }

      setSlotsLoading(true);

      try {
        const { data } = await getPublicSlots(slug, {
          serviceId: form.serviceId,
          date: form.date,
        });

        if (!isCurrent) return;
        setSlots(Array.isArray(data) ? data : []);
      } catch (error) {
        if (!isCurrent) return;

        setSlots([]);
        setMessage(
          error.response?.data?.message || "Could not load time slots",
        );
      } finally {
        if (isCurrent) setSlotsLoading(false);
      }
    };

    loadSlots();

    return () => {
      isCurrent = false;
    };
  }, [slug, form.serviceId, form.date]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    if (name === "emailOtp") {
      const digitsOnly = value.replace(/\D/g, "").slice(0, 6);
      setForm((previousForm) => ({
        ...previousForm,
        emailOtp: digitsOnly,
      }));
      setOtpVerified(false);
      setMessage("");
      return;
    }

    if (name === "customerEmail") {
      setOtpVerified(false);
      setOtpSentTo("");
      setOtpCooldown(0);
      setForm((previousForm) => ({
        ...previousForm,
        customerEmail: value,
        emailOtp: "",
      }));
      return;
    }

    setForm((previousForm) => ({
      ...previousForm,
      [name]: value,
    }));

    if (name === "date" || name === "serviceId") {
      setCalendarUrl("");
      setMessage("");
    }
  };

  const sendBookingOtp = async () => {
    if (!normalizedEmail) {
      setMessage("Enter your email address first.");
      return;
    }

    setOtpLoading(true);
    setMessage("");
    setOtpVerified(false);

    try {
      await requestPublicBookingOtp(slug, normalizedEmail);
      setOtpSentTo(normalizedEmail);
      setOtpCooldown(30);
      setMessage("Verification code sent to your email.");
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Could not send verification code",
      );
    } finally {
      setOtpLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (!normalizedEmail || otpSentTo !== normalizedEmail) {
      setMessage("Send a verification code to this email address first.");
      return;
    }

    if (!/^\d{6}$/.test(form.emailOtp)) {
      setMessage("Enter the 6-digit verification code.");
      return;
    }

    setOtpLoading(true);
    setMessage("");

    try {
      await verifyPublicBookingOtp(slug, {
        customerEmail: normalizedEmail,
        emailOtp: form.emailOtp,
      });
      setOtpVerified(true);
      setMessage("Email verified successfully.");
    } catch (error) {
      setOtpVerified(false);
      setMessage(error.response?.data?.message || "Invalid verification code");
    } finally {
      setOtpLoading(false);
    }
  };

  const openRazorpayCheckout = async (orderData) => {
    await loadRazorpayScript();

    if (!window.Razorpay) {
      throw new Error("Razorpay Checkout is unavailable. Please try again.");
    }

    let verificationStarted = false;

    const checkout = new window.Razorpay({
      key: orderData.razorpayKeyId,
      amount: orderData.amount,
      currency: orderData.currency,
      name: orderData.businessName || business?.businessName || business?.name,
      description: orderData.serviceName || selectedService?.name,
      order_id: orderData.razorpayOrderId,
      prefill: {
        name: orderData.customerName || form.customerName,
        email: orderData.customerEmail || normalizedEmail,
      },
      theme: {
        color: accent,
      },
      handler: async (paymentResponse) => {
        verificationStarted = true;
        setLoading(true);
        setMessage("Verifying your payment...");

        try {
          await verifyPublicBookingPayment({
            bookingId: orderData.bookingId,
            ...paymentResponse,
          });

          const query = new URLSearchParams({
            booking_id: orderData.bookingId,
            status_token: orderData.statusToken,
            slug,
          });
          navigate(`/booking/success?${query.toString()}`);
        } catch (error) {
          setMessage(
            error.response?.data?.message ||
              "Payment was received, but we could not confirm the booking yet. Please check your booking status.",
          );
        } finally {
          setLoading(false);
        }
      },
      modal: {
        ondismiss: () => {
          if (verificationStarted) return;

          const query = new URLSearchParams({
            booking_id: orderData.bookingId,
            status_token: orderData.statusToken,
            slug,
          });
          navigate(`/booking/cancelled?${query.toString()}`);
        },
      },
    });

    checkout.open();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    setCalendarUrl("");

    if (!selectedService) {
      setMessage("Choose a service first.");
      return;
    }

    if (!selectedSlot) {
      setMessage("Choose an available time slot.");
      return;
    }

    if (!isEmailVerified) {
      setMessage("Verify your email address before booking.");
      return;
    }

    setLoading(true);

    try {
      const { data } = await createPublicBooking(slug, {
        serviceId: form.serviceId,
        date: form.date,
        customerName: form.customerName.trim(),
        customerEmail: normalizedEmail,
        customerAvatar: form.customerAvatar,
        emailOtp: form.emailOtp,
        notes: form.notes.trim(),
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
      });

      if (data.bookingId && data.razorpayOrderId) {
        await openRazorpayCheckout(data);
        return;
      }

      if (data.booking?.status === "confirmed") {
        setMessage(
          data.customerCalendarUrl
            ? "Your booking is confirmed. You can add it to Google Calendar below."
            : "Your booking is confirmed.",
        );
        setCalendarUrl(data.customerCalendarUrl || "");
        setSelectedSlot(null);
        setOtpVerified(false);
        setForm((previousForm) => ({
          ...previousForm,
          emailOtp: "",
        }));
        return;
      }

      throw new Error(
        data.message || "The booking response could not be confirmed.",
      );
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          error.message ||
          "Could not create or verify booking",
      );
    } finally {
      setLoading(false);
    }
  };

  const renderIcon = (service, isActive, customColor) => (
    <div
      className={s.serviceIconBase}
      style={{
        boxShadow: isActive ? `0 0 0 2px ${customColor}` : "none",
      }}
    >
      <img
        src={ICON_MAP[service.icon] || ICON_MAP["C1.png"]}
        alt=""
        className="h-full w-full object-cover"
      />
    </div>
  );

  return (
    <div className={s.pageContainer} style={brandStyleVars}>
      <main className={s.mainGrid}>
        <section className={s.leftPanel}>
          <div className={s.bgImageContainer}>
            <img
              src={bannerImage}
              alt=""
              className={s.bgImage}
              style={{
                WebkitMaskImage:
                  "linear-gradient(to bottom right, transparent, black 60%)",
                maskImage:
                  "linear-gradient(to bottom right, transparent, black 60%)",
              }}
            />
            <div className={s.bgImageOverlay}></div>
          </div>
          <div className={s.bgFadeOverlay}></div>

          <div className={s.leftContent}>
            <div className={s.businessInfoRow}>
              <div className={s.businessAvatar}>
                {(business?.businessName || business?.name || "M")
                  .slice(0, 1)
                  .toUpperCase()}
              </div>
              <p className={s.bookOnlineLabel}>Book online</p>
            </div>

            <h1 className={s.businessName}>
              {business?.businessName ||
                business?.name ||
                "Loading business..."}
            </h1>

            {business?.businessDescription && (
              <p className={s.businessDesc}>{business.businessDescription}</p>
            )}
          </div>

          <div className={s.serviceList}>
            {businessLoading ? (
              <p className={s.noServiceText}>Loading services...</p>
            ) : services.length === 0 ? (
              <p className={s.noServiceText}>
                This business has no active services available.
              </p>
            ) : (
              services.map((service) => {
                const isActive = form.serviceId === service._id;

                return (
                  <button
                    key={service._id}
                    type="button"
                    onClick={() =>
                      setForm((previousForm) => ({
                        ...previousForm,
                        serviceId: service._id,
                      }))
                    }
                    className={
                      isActive ? s.serviceBtnActive : s.serviceBtnInactive
                    }
                    aria-pressed={isActive}
                  >
                    {renderIcon(service, isActive, accent)}

                    <div className={s.serviceTextBlock}>
                      <span
                        className={
                          isActive ? s.serviceNameActive : s.serviceNameInactive
                        }
                      >
                        {service.name}
                      </span>
                      <p
                        className={
                          isActive
                            ? s.serviceDetailActive
                            : s.serviceDetailInactive
                        }
                      >
                        {service.duration} min · ₹
                        {Number(service.price).toLocaleString("en-IN")}
                      </p>
                      {service.description && (
                        <p
                          className={
                            isActive
                              ? s.serviceDescActive
                              : s.serviceDescInactive
                          }
                        >
                          {service.description}
                        </p>
                      )}
                    </div>

                    <div
                      className={`${s.selectorIconBase} ${
                        isActive ? "opacity-100" : "opacity-0"
                      }`}
                      style={{ backgroundColor: accent }}
                    >
                      <Check className="h-3.5 w-3.5 text-white" />
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </section>

        <section className={s.rightPanel}>
          <h2 className={s.bookingTitle}>Choose your appointment</h2>

          {selectedService ? (
            <p className={s.selectedServiceInfo}>
              <Clock className="h-4 w-4" style={{ color: accent }} />
              <span style={{ color: accent }}>{selectedService.name}</span>
              <span className="text-slate-300">·</span>
              {selectedService.duration} minutes
              <span className="text-slate-300">·</span>₹
              {Number(selectedService.price).toLocaleString("en-IN")}
            </p>
          ) : (
            <p className={s.noServiceText}>Select a service to begin</p>
          )}

          <form onSubmit={handleSubmit} className={s.form}>
            <div>
              <label className={s.inputLabel} htmlFor="booking-date">
                Date
              </label>
              <div className={s.inputWrapper}>
                <CalendarDays className={s.inputIcon} />
                <input
                  id="booking-date"
                  type="date"
                  name="date"
                  min={today}
                  value={form.date}
                  onChange={handleChange}
                  className={s.dateInput}
                  style={{ "--tw-ring-color": accent }}
                  disabled={businessLoading || loading}
                />
              </div>
            </div>

            <div className="pt-2">
              <p className={s.inputLabel}>Available times</p>
              <div className={s.timeSlotGrid}>
                {slots.map((slot) => {
                  const isSlotSelected =
                    selectedSlot?.startTime === slot.startTime &&
                    selectedSlot?.endTime === slot.endTime;

                  return (
                    <button
                      key={`${slot.startTime}-${slot.endTime}`}
                      type="button"
                      onClick={() => setSelectedSlot(slot)}
                      className={`${s.slotBtnBase} ${
                        isSlotSelected ? s.slotBtnSelected : s.slotBtnUnselected
                      }`}
                      style={
                        isSlotSelected ? { backgroundColor: accent } : undefined
                      }
                      disabled={loading || slotsLoading}
                      aria-pressed={isSlotSelected}
                    >
                      {slot.startTime}
                      {isSlotSelected && <BadgeCheck className="h-4 w-4" />}
                    </button>
                  );
                })}
              </div>

              {slotsLoading ? (
                <p className={s.noSlotsText}>Loading available times...</p>
              ) : (
                slots.length === 0 && (
                  <p className={s.noSlotsText}>
                    No times available for this date.
                  </p>
                )
              )}
            </div>

            <div className={s.nameEmailGrid}>
              <div>
                <label className={s.inputLabel} htmlFor="customer-name">
                  Your name
                </label>
                <div className={s.inputWrapper}>
                  <User className={s.inputIcon} />
                  <input
                    id="customer-name"
                    name="customerName"
                    value={form.customerName}
                    onChange={handleChange}
                    placeholder="Enter your name"
                    className={s.textInput}
                    autoComplete="name"
                    required
                    maxLength={100}
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <label className={s.inputLabel} htmlFor="customer-email">
                  Email address
                </label>
                <div className={s.inputWrapper}>
                  <Mail className={s.inputIcon} />
                  <input
                    id="customer-email"
                    name="customerEmail"
                    type="email"
                    value={form.customerEmail}
                    onChange={handleChange}
                    placeholder="Enter your email"
                    className={s.emailInput}
                    autoComplete="email"
                    required
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            <div className={s.otpBlock}>
              <label
                className={s.otpLabel}
                htmlFor="booking-email-otp"
                style={{ color: accent }}
              >
                Email verification code
              </label>

              <div className={s.otpRow}>
                <input
                  id="booking-email-otp"
                  name="emailOtp"
                  inputMode="numeric"
                  maxLength={6}
                  value={form.emailOtp}
                  onChange={handleChange}
                  className={s.otpInput}
                  placeholder="Enter 6-digit code"
                  autoComplete="one-time-code"
                  required
                  disabled={loading || !otpSentTo}
                />

                <button
                  type="button"
                  onClick={sendBookingOtp}
                  disabled={
                    otpLoading || loading || !normalizedEmail || otpCooldown > 0
                  }
                  className={s.otpButton}
                >
                  {otpLoading && !form.emailOtp
                    ? "Sending..."
                    : otpCooldown > 0 && otpSentTo === normalizedEmail
                      ? `Resend code (${otpCooldown}s)`
                      : otpSentTo === normalizedEmail
                        ? "Resend code"
                        : "Send code"}
                </button>

                <button
                  type="button"
                  onClick={verifyOtp}
                  disabled={
                    otpLoading ||
                    loading ||
                    !otpSentTo ||
                    otpSentTo !== normalizedEmail ||
                    form.emailOtp.length !== 6 ||
                    isEmailVerified
                  }
                  className={s.otpButton}
                >
                  {isEmailVerified ? "Verified" : "Verify"}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <label className={s.inputLabel}>Choose your avatar</label>
              <div className={s.avatarGrid}>
                {Object.keys(AVATAR_MAP).map((avatarName) => (
                  <button
                    key={avatarName}
                    type="button"
                    onClick={() =>
                      setForm((previousForm) => ({
                        ...previousForm,
                        customerAvatar: avatarName,
                      }))
                    }
                    className={`${s.avatarBtnBase} ${
                      form.customerAvatar === avatarName
                        ? s.avatarBtnSelected
                        : s.avatarBtnUnselected
                    }`}
                    style={
                      form.customerAvatar === avatarName
                        ? { borderColor: accent, "--tw-ring-color": accent }
                        : undefined
                    }
                    aria-label={`Choose avatar ${avatarName.replace(".png", "")}`}
                    aria-pressed={form.customerAvatar === avatarName}
                    disabled={loading}
                  >
                    <img
                      src={AVATAR_MAP[avatarName]}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <label className={s.inputLabel} htmlFor="booking-notes">
                Notes{" "}
                <span className="ml-1 font-medium text-slate-400">
                  (Optional)
                </span>
              </label>
              <textarea
                id="booking-notes"
                name="notes"
                rows={3}
                value={form.notes}
                onChange={handleChange}
                placeholder="Add any notes or special requests..."
                className={s.notesTextarea}
                maxLength={1000}
                disabled={loading}
              />
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={
                  loading ||
                  businessLoading ||
                  slotsLoading ||
                  !selectedService ||
                  !selectedSlot ||
                  !isEmailVerified
                }
                className={s.submitButton}
                style={{ backgroundColor: accent }}
              >
                <Lock className="h-4.5 w-4.5" />
                {loading
                  ? "Preparing..."
                  : Number(selectedService?.price || 0) > 0
                    ? `Pay ₹${Number(selectedService.price).toLocaleString(
                        "en-IN",
                      )} and book appointment`
                    : "Confirm booking"}
              </button>

              <p className={s.securePaymentText}>
                <Shield className="h-4 w-4 text-slate-400" />
                Secure payments powered by Razorpay
              </p>
            </div>

            {message && (
              <div
                role="status"
                className={`${s.messageBase} ${
                  message.toLowerCase().includes("confirmed") ||
                  message.toLowerCase().includes("verified") ||
                  message.toLowerCase().includes("sent")
                    ? s.messageSuccess
                    : s.messageInfo
                }`}
              >
                {message}
              </div>
            )}

            {calendarUrl && (
              <a
                href={calendarUrl}
                target="_blank"
                rel="noreferrer"
                className={s.calendarLink}
                style={{ color: accent }}
              >
                Add to Google Calendar
              </a>
            )}
          </form>
        </section>
      </main>
    </div>
  );
}
