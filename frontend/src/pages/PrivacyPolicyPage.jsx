import { Link } from "react-router-dom";
import { ArrowLeft, Shield } from "lucide-react";
import logo from "../assets/logo.png";

const sections = [
  {
    title: "1. Introduction",
    content: (
      <p>
        Welcome to BookMe (“we,” “our,” or “us”). This Privacy Policy explains
        how information is collected, used, and shared when you use the BookMe
        web application and related services (the “Service”).
      </p>
    ),
  },
  {
    title: "2. Information We Collect",
    content: (
      <>
        <p>Depending on how you use the Service, we may process:</p>
        <ul>
          <li>
            <strong>Account information:</strong> name, email address, business
            name, business description, profile settings, and timezone.
          </li>
          <li>
            <strong>Booking information:</strong> customer name and email,
            selected service, appointment date and time, notes, booking status,
            and payment status.
          </li>
          <li>
            <strong>Payment and payout information:</strong> payment references,
            amounts, currencies, and statuses. Razorpay processes customer
            payments. For provider payout details, BookMe stores bank details
            such as the account holder, bank name, IFSC, UPI ID, and only the
            last four digits of an account number.
          </li>
          <li>
            <strong>Calendar integration information:</strong> Google account
            authorization information needed to create, update, or cancel
            booking events in the connected calendar.
          </li>
          <li>
            <strong>Verification and communication information:</strong> email
            addresses used for booking verification codes and booking-related
            notifications.
          </li>
        </ul>
      </>
    ),
  },
  {
    title: "3. How We Use Information",
    content: (
      <ul>
        <li>To provide and maintain the Service and user accounts.</li>
        <li>To create and manage bookings and appointment availability.</li>
        <li>
          To verify customer email addresses and send booking notifications.
        </li>
        <li>To process payments and maintain payment and payout records.</li>
        <li>
          To create, update, or cancel booking events in a connected Google
          Calendar.
        </li>
        <li>To protect the Service and investigate suspected misuse.</li>
      </ul>
    ),
  },
  {
    title: "4. Third-Party Services",
    content: (
      <>
        <p>
          BookMe uses third-party services to provide certain features. Their
          own terms and privacy policies also apply to your use of those
          services.
        </p>
        <ul>
          <li>
            <strong>Razorpay:</strong> processes customer payments.
          </li>
          <li>
            <strong>Google Calendar API:</strong> creates, updates, or cancels
            booking events in a provider's connected calendar.
          </li>
          <li>
            <strong>Brevo:</strong> sends transactional booking notifications
            and email verification codes on behalf of BookMe.
          </li>
        </ul>
      </>
    ),
  },
  {
    title: "5. Google API Services",
    content: (
      <p>
        BookMe's use and transfer of information received from Google APIs
        adheres to the{" "}
        <a
          href="https://developers.google.com/terms/api-services-user-data-policy"
          target="_blank"
          rel="noreferrer"
        >
          Google API Services User Data Policy
        </a>
        , including its Limited Use requirements. Google Calendar access is used
        to manage BookMe booking events in a calendar the provider has
        connected.
      </p>
    ),
  },
  {
    title: "6. Data Security",
    content: (
      <p>
        We use measures intended to protect information processed by the
        Service. No method of electronic transmission or storage is completely
        secure, and we cannot guarantee absolute security.
      </p>
    ),
  },
  {
    title: "7. Data Retention",
    content: (
      <p>
        We retain information for as long as needed to operate the Service,
        maintain booking and financial records, resolve issues, and meet
        applicable obligations. Retention periods may vary by information type
        and purpose. Contact us with questions about a particular record.
      </p>
    ),
  },
  {
    title: "8. Your Choices and Requests",
    content: (
      <p>
        You can update some account and business information in your profile
        settings and disconnect Google Calendar from there. You may contact us
        to ask about access, correction, or deletion of your information.
        Requests may be subject to legal, operational, and record-keeping
        requirements.
      </p>
    ),
  },
  {
    title: "9. Browser Storage",
    content: (
      <p>
        The web application stores an authentication token in your browser's
        local storage to maintain your signed-in session. We do not describe
        this as a cookie-based session. Hosting providers or other services used
        to operate the website may have their own storage practices.
      </p>
    ),
  },
  {
    title: "10. Changes to This Policy",
    content: (
      <p>
        We may update this Privacy Policy as the Service changes. When we do, we
        will update the date shown above. Please review this page periodically.
      </p>
    ),
  },
  {
    title: "11. Contact Us",
    content: (
      <p>
        For questions or requests about this Privacy Policy, contact{" "}
        <a href="mailto:support@hexagondigitalservices.com">
          support@bookme.com
        </a>
        .
      </p>
    ),
  },
];

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#f8f9fc] text-slate-900">
      <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2.5">
            <img src={logo} alt="BookMe" className="h-8 w-auto" />
            <span className="custom-brand-font text-[22px] tracking-tight text-slate-900">
              BookMe
            </span>
          </Link>

          <Link
            to="/"
            className="flex items-center gap-2 text-sm font-semibold text-slate-500 transition-colors hover:text-slate-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-12 md:py-16">
        <div className="mb-8 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F4F0FF]">
            <Shield className="h-7 w-7 text-[#7D57F5]" />
          </div>
          <div>
            <h1 className="text-[32px] font-extrabold leading-tight tracking-tight text-slate-900 md:text-[40px]">
              Privacy Policy
            </h1>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Last updated: October 29, 2026
            </p>
          </div>
        </div>

        <div className="space-y-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm md:p-12">
          {sections.map(({ title, content }) => (
            <section key={title}>
              <h2 className="mb-3 text-xl font-extrabold text-slate-900">
                {title}
              </h2>
              <div className="space-y-3 text-[15px] leading-relaxed text-slate-600 [&_a]:font-semibold [&_a]:text-[#7D57F5] [&_a]:hover:underline [&_li]:ml-2 [&_li]:list-inside [&_li]:list-disc [&_ul]:space-y-2">
                {content}
              </div>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
