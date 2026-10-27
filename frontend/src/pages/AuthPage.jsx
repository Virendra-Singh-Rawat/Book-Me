import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import {
  login,
  register,
  requestRegistrationOTP,
  verifyRegistrationOTP,
} from "../api/auth";
import logo from "../assets/logo.png";
import {
  User,
  Mail,
  Lock,
  Building2,
  ArrowRight,
  CalendarDays,
  Shield,
  Zap,
  BadgeCheck,
} from "lucide-react";
import { authPageStyles as s } from "../assets/dummyStyles";

const initialForm = {
  name: "",
  email: "",
  password: "",
  businessName: "",
  emailOtp: "",
};

export default function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [mode, setMode] = useState("login");
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpSentTo, setOtpSentTo] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [message, setMessage] = useState("");
  const [otpCooldown, setOtpCooldown] = useState(0);

  // Prevent older OTP verification responses from overriding newer input.
  const otpRequestId = useRef(0);

  const isRegister = mode === "register";
  const fromLocation = location.state?.from;

  const redirectTo = fromLocation
    ? `${fromLocation.pathname}${fromLocation.search || ""}`
    : "/profile";

  useEffect(() => {
    if (otpCooldown <= 0) return undefined;

    const interval = setInterval(() => {
      setOtpCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [otpCooldown]);

  const handleChange = async (event) => {
    const { name, value } = event.target;

    if (name === "email") {
      // Invalidate any OTP verification currently in progress.
      otpRequestId.current += 1;

      setOtpVerified(false);
      setOtpSentTo("");
      setMessage("");

      setForm((prev) => ({
        ...prev,
        email: value,
        emailOtp: "",
      }));

      return;
    }

    if (name === "emailOtp") {
      const digitsOnly = value.replace(/\D/g, "").slice(0, 6);
      const currentEmail = form.email.trim().toLowerCase();

      setForm((prev) => ({
        ...prev,
        emailOtp: digitsOnly,
      }));

      setOtpVerified(false);
      setMessage("");

      const requestId = ++otpRequestId.current;

      // Verify only a complete OTP sent to the current email.
      if (
        digitsOnly.length !== 6 ||
        !currentEmail ||
        otpSentTo !== currentEmail
      ) {
        setOtpVerifying(false);
        return;
      }

      setOtpVerifying(true);

      try {
        await verifyRegistrationOTP({
          email: currentEmail,
          emailOtp: digitsOnly,
        });

        // Ignore a response if the email or OTP has changed since the request.
        if (requestId !== otpRequestId.current) return;

        setOtpVerified(true);
        setMessage("Email verified successfully.");
      } catch (error) {
        if (requestId !== otpRequestId.current) return;

        setOtpVerified(false);
        setMessage(
          error.response?.data?.message || "Invalid verification code.",
        );
      } finally {
        if (requestId === otpRequestId.current) {
          setOtpVerifying(false);
        }
      }

      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const sendOtp = async () => {
    const email = form.email.trim().toLowerCase();

    if (!email) {
      setMessage("Enter your email first.");
      return;
    }

    // Avoid sending duplicate requests while one is in progress.
    if (otpLoading || otpCooldown > 0) return;

    setOtpLoading(true);
    setMessage("");

    try {
      await requestRegistrationOTP(email);

      // Invalidate any verification response from a previous OTP.
      otpRequestId.current += 1;

      setForm((prev) => ({
        ...prev,
        emailOtp: "",
      }));

      setOtpSentTo(email);
      setOtpVerified(false);
      setOtpCooldown(30);
      setMessage("Verification code sent to your email.");
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Could not send verification code.",
      );
    } finally {
      setOtpLoading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (loading) return;

    if (isRegister) {
      const currentEmail = form.email.trim().toLowerCase();

      if (!otpSentTo || otpSentTo !== currentEmail || !otpVerified) {
        setMessage("Please verify your email before registering.");
        return;
      }
    }

    setLoading(true);
    setMessage("");

    try {
      const payload = isRegister
        ? {
            ...form,
            name: form.name.trim(),
            email: form.email.trim().toLowerCase(),
            businessName: form.businessName.trim(),
          }
        : {
            email: form.email.trim().toLowerCase(),
            password: form.password,
          };

      const { data } = await (isRegister ? register(payload) : login(payload));

      if (!data?.token) {
        setMessage(
          "Authentication response did not include a token. Please try again.",
        );
        return;
      }

      // Keep the existing authentication convention used by client.js.
      localStorage.setItem("token", data.token);

      navigate(redirectTo, { replace: true });
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Authentication failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    otpRequestId.current += 1;

    setMode((prev) => (prev === "register" ? "login" : "register"));
    setForm(initialForm);
    setOtpLoading(false);
    setOtpVerifying(false);
    setOtpSentTo("");
    setOtpVerified(false);
    setOtpCooldown(0);
    setMessage("");
  };

  return (
    <div className={s.pageBg}>
      <div className={s.gridContainer}>
        {/* Left branding */}
        <section className={s.brandSection}>
          <div className={s.logoRow}>
            <img src={logo} alt="BookMe logo" className={s.logoImg} />
            <span className={s.brandName}>BookMe</span>
          </div>

          <h1 className={s.mainHeading}>
            A calm booking desk for{" "}
            <span className={s.gradientText}>Small Business</span>
          </h1>

          <p className={s.subtitle}>
            Create your business profile, add services, set availability, and
            share one clean booking link.
          </p>

          <div className={s.featureGrid}>
            <div className={s.featureCard}>
              <div className={s.featureIconWrapPurple}>
                <CalendarDays className={s.featureIconPurple} />
              </div>
              <div>
                <p className={s.featureTitle}>Easy Setup</p>
                <p className={s.featureDesc}>Get started in minutes</p>
              </div>
            </div>

            <div className={s.featureCard}>
              <div className={s.featureIconWrapEmerald}>
                <Shield className={s.featureIconEmerald} />
              </div>
              <div>
                <p className={s.featureTitle}>Secure</p>
                <p className={s.featureDesc}>Razorpay-powered Payments</p>
              </div>
            </div>

            <div className={s.featureCard}>
              <div className={s.featureIconWrapAmber}>
                <Zap className={s.featureIconAmber} />
              </div>
              <div>
                <p className={s.featureTitle}>Fast</p>
                <p className={s.featureDesc}>Instant booking links</p>
              </div>
            </div>
          </div>
        </section>

        {/* Right: authentication form */}
        <section className={s.formCard}>
          <h2 className={s.formHeading}>
            {isRegister ? "Create account" : "Welcome back"}
          </h2>

          <p className={s.formSubtitle}>
            {isRegister
              ? "Set up your business in minutes"
              : "Log in to manage your bookings"}
          </p>

          <form onSubmit={handleSubmit} className={s.form}>
            {isRegister && (
              <>
                <div>
                  <label htmlFor="name" className={s.inputLabel}>
                    Name
                  </label>
                  <div className={s.inputWrapper}>
                    <User className={s.inputIcon} />
                    <input
                      id="name"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="Your full name"
                      className={s.inputField}
                      autoComplete="name"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="businessName" className={s.inputLabel}>
                    Business Name
                  </label>
                  <div className={s.inputWrapper}>
                    <Building2 className={s.inputIcon} />
                    <input
                      id="businessName"
                      name="businessName"
                      value={form.businessName}
                      onChange={handleChange}
                      placeholder="Your business name"
                      className={s.inputField}
                      autoComplete="organization"
                      required
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label htmlFor="email" className={s.inputLabel}>
                Email
              </label>
              <div className={s.inputWrapper}>
                <Mail className={s.inputIcon} />
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className={s.inputField}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            {isRegister && (
              <div className={s.otpContainer}>
                <label htmlFor="emailOtp" className={s.otpLabel}>
                  Email verification code
                </label>

                <div className={s.otpGrid}>
                  <input
                    id="emailOtp"
                    name="emailOtp"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={form.emailOtp}
                    onChange={handleChange}
                    className={s.otpField}
                    placeholder="Enter 6-digit code"
                    autoComplete="one-time-code"
                    pattern="[0-9]{6}"
                    required
                    aria-describedby="otp-status"
                  />

                  {otpVerified ? (
                    <button
                      type="button"
                      disabled
                      className={s.otpVerifiedButton}
                    >
                      <BadgeCheck className={s.otpVerifiedIcon} />
                      Verified
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={sendOtp}
                      disabled={
                        otpLoading ||
                        otpVerifying ||
                        !form.email.trim() ||
                        otpCooldown > 0
                      }
                      className={s.otpButton}
                    >
                      {otpLoading
                        ? "Sending..."
                        : otpCooldown > 0
                          ? `Resend code (${otpCooldown}s)`
                          : otpSentTo === form.email.trim().toLowerCase()
                            ? "Resend code"
                            : "Send code"}
                    </button>
                  )}
                </div>

                <p id="otp-status" className={s.message} aria-live="polite">
                  {otpVerifying
                    ? "Verifying email code..."
                    : otpSentTo &&
                        otpSentTo === form.email.trim().toLowerCase() &&
                        !otpVerified
                      ? "Enter the code sent to your email."
                      : ""}
                </p>
              </div>
            )}

            <div>
              <label htmlFor="password" className={s.inputLabel}>
                Password
              </label>
              <div className={s.inputWrapper}>
                <Lock className={s.inputIcon} />
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className={s.inputField}
                  autoComplete={
                    isRegister ? "new-password" : "current-password"
                  }
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || otpVerifying}
              className={s.submitBtn}
            >
              {loading
                ? "Please wait..."
                : isRegister
                  ? "Create account"
                  : "Log in"}
              <ArrowRight className={s.submitIcon} />
            </button>

            {message && (
              <p className={s.message} role="status" aria-live="polite">
                {message}
              </p>
            )}
          </form>

          <button
            type="button"
            onClick={toggleMode}
            className={s.toggleMode}
            disabled={loading}
          >
            {isRegister
              ? "Already have an account? Log in"
              : "Need an account? Register"}
          </button>
        </section>
      </div>

      <div className={s.footerLinks}>
        <Link to="/privacy" className={s.footerLink}>
          Privacy Policy
        </Link>
        <Link to="/terms" className={s.footerLink}>
          Terms of Service
        </Link>
      </div>
    </div>
  );
}
