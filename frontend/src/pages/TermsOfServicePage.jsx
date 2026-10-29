import { Link } from "react-router-dom";
import { ArrowLeft, FileText } from "lucide-react";
import logo from "../assets/logo.png";

const sections = [
  {
    title: "1. Acceptance of Terms",
    content: (
      <p>
        By accessing or using BookMe (the “Service”), you agree to these Terms
        of Service (“Terms”). If you do not agree, do not use the Service.
      </p>
    ),
  },
  {
    title: "2. Description of Service",
    content: (
      <p>
        BookMe provides tools for providers to publish services and
        availability, manage appointments, and receive booking-related
        notifications. Customers can use provider booking pages to view
        available times and request appointments.
      </p>
    ),
  },
  {
    title: "3. User Accounts",
    content: (
      <ul>
        <li>
          Provide accurate information when creating and maintaining an account.
        </li>
        <li>
          Keep your account credentials secure and be responsible for account
          activity.
        </li>
        <li>
          Notify us if you believe your account has been accessed without
          authorization.
        </li>
        <li>
          Do not use the Service in violation of applicable law or these Terms.
        </li>
      </ul>
    ),
  },
  {
    title: "4. Bookings and Payments",
    content: (
      <>
        <ul>
          <li>
            Customer payments are processed through Razorpay. BookMe's
            application does not collect or store full payment card numbers.
          </li>
          <li>
            Providers are responsible for the accuracy of their service
            descriptions, availability, and prices.
          </li>
          <li>
            BookMe currently calculates a platform fee of 10% on eligible
            booking payments before recording the provider payout balance.
          </li>
          <li>
            A booking that requires payment is not confirmed until payment has
            been verified. A checkout window being closed does not by itself
            establish that a payment failed; its status may remain pending while
            it is checked.
          </li>
          <li>
            If a paid booking cannot be confirmed because its slot has been
            taken, BookMe's backend attempts to initiate a refund through
            Razorpay. Refund processing and timing depend on the payment
            provider.
          </li>
          <li>
            Closing checkout or changing a booking's status does not necessarily
            reverse a payment. Contact support about payment disputes or refund
            questions.
          </li>
        </ul>
      </>
    ),
  },
  {
    title: "5. Provider Withdrawals",
    content: (
      <p>
        Providers may submit withdrawal requests for eligible available balances
        after entering payout details. A request places a hold on the requested
        balance. Submitting a request does not itself mean that funds have been
        transferred or paid out; processing and completion depend on the
        applicable payout process.
      </p>
    ),
  },
  {
    title: "6. Third-Party Services",
    content: (
      <>
        <ul>
          <li>
            <strong>Google Calendar:</strong> providers may connect a calendar
            so BookMe can create, update, or cancel booking events.
          </li>
          <li>
            <strong>Brevo:</strong> sends transactional booking notifications
            and email verification codes for BookMe.
          </li>
          <li>
            <strong>Razorpay:</strong> processes customer payments and may
            handle related payment or refund processing.
          </li>
        </ul>
        <p>
          Your use of third-party services may also be subject to their own
          terms and policies.
        </p>
      </>
    ),
  },
  {
    title: "7. Acceptable Use",
    content: (
      <>
        <p>You agree not to use the Service to:</p>
        <ul>
          <li>Violate applicable laws or regulations.</li>
          <li>
            Infringe another person's intellectual property or privacy rights.
          </li>
          <li>Upload malware or other harmful code.</li>
          <li>Interfere with another person's use of the Service.</li>
          <li>Engage in fraudulent, deceptive, or unauthorized activity.</li>
          <li>
            Attempt to access accounts or information without authorization.
          </li>
        </ul>
      </>
    ),
  },
  {
    title: "8. Intellectual Property",
    content: (
      <p>
        The Service and its original content, features, and functionality are
        owned by BookMe or its licensors, excluding content provided by users.
        Subject to these Terms, you may use the Service for its intended
        purpose.
      </p>
    ),
  },
  {
    title: "9. Disclaimer and Limitation of Liability",
    content: (
      <p>
        To the extent permitted by applicable law, the Service is provided on an
        “as is” and “as available” basis. BookMe does not guarantee that the
        Service will be uninterrupted or error-free. To the extent permitted by
        law, BookMe will not be liable for indirect, incidental, special,
        consequential, or punitive damages arising from use of, or inability to
        use, the Service.
      </p>
    ),
  },
  {
    title: "10. Suspension and Termination",
    content: (
      <p>
        You may stop using the Service at any time. We may suspend or restrict
        access where reasonably necessary to protect the Service, users, or
        comply with applicable obligations. Contact us if you need help with an
        account.
      </p>
    ),
  },
  {
    title: "11. Changes to These Terms",
    content: (
      <p>
        We may update these Terms as the Service or its requirements change. We
        will update the date shown above when we publish a revision. Continued
        use of the Service after updated Terms take effect means that you accept
        the revised Terms, to the extent permitted by applicable law.
      </p>
    ),
  },
  {
    title: "12. Governing Law",
    content: (
      <p>
        These Terms are intended to be governed by the laws of India, subject to
        applicable law. Any mandatory consumer or other legal protections that
        apply to you remain unaffected.
      </p>
    ),
  },
  {
    title: "13. Contact Us",
    content: (
      <p>
        For questions about these Terms, contact{" "}
        <a href="mailto:support@hexagondigitalservices.com">
          support@bookme.com
        </a>
        .
      </p>
    ),
  },
];

export default function TermsOfServicePage() {
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
            <FileText className="h-7 w-7 text-[#7D57F5]" />
          </div>
          <div>
            <h1 className="text-[32px] font-extrabold leading-tight tracking-tight text-slate-900 md:text-[40px]">
              Terms of Service
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
