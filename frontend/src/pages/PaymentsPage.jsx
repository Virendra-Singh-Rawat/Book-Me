import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import p3Image from "../assets/P3.png";
import AppLayout from "../components/AppLayout";
import {
  getPaymentOverview,
  requestWithdrawal,
  updatePayoutDetails,
} from "../api/payment";
import {
  Wallet,
  TrendingUp,
  Clock,
  ArrowDownToLine,
  Building2,
  CreditCard,
  Save,
  ExternalLink,
  IndianRupee,
  ArrowUpRight,
  ArrowDownLeft,
} from "lucide-react";
import { paymentsPageStyles as s } from "../assets/dummyStyles";

const formatMoney = (amount = 0, currency = "INR") =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: String(currency).toUpperCase(),
  }).format((Number(amount) || 0) / 100);

const transactionLabel = (transaction) => {
  if (transaction.type === "booking_payout") {
    return transaction.description || "Booking payment received";
  }

  if (transaction.type === "withdrawal_hold") {
    return transaction.description || "Withdrawal requested";
  }

  if (transaction.type === "withdrawal_reversal") {
    return transaction.description || "Withdrawal returned";
  }

  return transaction.description || transaction.type || "Wallet activity";
};

const transactionAmount = (transaction) => {
  const amount = Number(transaction.amount) || 0;

  if (transaction.type === "withdrawal_hold") {
    return -Math.abs(amount);
  }

  return amount;
};

const payoutFormFromDetails = (details = {}) => ({
  accountHolderName: details.accountHolderName || "",
  bankName: details.bankName || "",
  accountNumber: "",
  ifsc: details.ifsc || "",
  upiId: details.upiId || "",
});

export default function PaymentsPage() {
  const [overview, setOverview] = useState(null);
  const [message, setMessage] = useState("");
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [savingPayoutDetails, setSavingPayoutDetails] = useState(false);
  const [requestingWithdrawal, setRequestingWithdrawal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [form, setForm] = useState({
    accountHolderName: "",
    bankName: "",
    accountNumber: "",
    ifsc: "",
    upiId: "",
  });

  const wallet = overview?.wallet || {};
  const payoutDetails = overview?.payoutDetails || {};

  const availableRupees = useMemo(
    () => ((Number(wallet.available) || 0) / 100).toFixed(2),
    [wallet.available],
  );

  const loadOverview = async () => {
    const { data } = await getPaymentOverview();

    setOverview(data);
    setForm(payoutFormFromDetails(data.payoutDetails));
    return data;
  };

  useEffect(() => {
    let isCurrent = true;

    const fetchOverview = async () => {
      try {
        const { data } = await getPaymentOverview();

        if (!isCurrent) return;

        setOverview(data);
        setForm(payoutFormFromDetails(data.payoutDetails));
      } catch (error) {
        if (!isCurrent) return;

        setMessage(
          error.response?.data?.message || "Could not load payment details",
        );
      } finally {
        if (isCurrent) {
          setLoadingOverview(false);
        }
      }
    };

    fetchOverview();

    return () => {
      isCurrent = false;
    };
  }, []);

  const handleChange = (event) => {
    setForm((previousForm) => ({
      ...previousForm,
      [event.target.name]: event.target.value,
    }));
  };

  const savePayoutDetails = async (event) => {
    event.preventDefault();
    setMessage("");

    if (!form.accountHolderName.trim()) {
      setMessage("Enter the account holder name.");
      return;
    }

    if (!form.accountNumber.trim() && !form.upiId.trim()) {
      setMessage("Enter a bank account number or UPI ID.");
      return;
    }

    if (
      payoutDetails.accountLast4 &&
      (form.bankName.trim() || form.ifsc.trim()) &&
      !form.accountNumber.trim()
    ) {
      setMessage(
        "Re-enter the full bank account number to save bank details. The existing number is masked and cannot be recovered.",
      );
      return;
    }

    setSavingPayoutDetails(true);

    try {
      const { data } = await updatePayoutDetails({
        ...form,
        accountHolderName: form.accountHolderName.trim(),
        bankName: form.bankName.trim(),
        accountNumber: form.accountNumber.trim(),
        ifsc: form.ifsc.trim().toUpperCase(),
        upiId: form.upiId.trim(),
      });

      setOverview((previousOverview) => ({
        ...(previousOverview || {}),
        payoutDetails: data.payoutDetails,
      }));
      setForm(payoutFormFromDetails(data.payoutDetails));
      setMessage(data.message || "Payout details saved.");
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Could not save payout details",
      );
    } finally {
      setSavingPayoutDetails(false);
    }
  };

  const submitWithdrawal = async (event) => {
    event.preventDefault();
    setMessage("");

    const rupeeAmount = Number(withdrawAmount);
    const amountInPaise = Math.round(rupeeAmount * 100);
    const availableInPaise = Number(wallet.available) || 0;

    if (!Number.isFinite(rupeeAmount) || rupeeAmount <= 0) {
      setMessage("Enter a valid withdrawal amount.");
      return;
    }

    if (amountInPaise < 100) {
      setMessage("The minimum withdrawal amount is ₹1.");
      return;
    }

    if (amountInPaise > availableInPaise) {
      setMessage("Withdrawal amount cannot exceed your available balance.");
      return;
    }

    if (!payoutDetails.isComplete) {
      setMessage("Save payout details before requesting a withdrawal.");
      return;
    }

    setRequestingWithdrawal(true);

    try {
      const { data } = await requestWithdrawal(amountInPaise);
      setWithdrawAmount("");
      setMessage(data.message || "Withdrawal requested.");

      try {
        await loadOverview();
      } catch {
        setMessage(
          `${data.message || "Withdrawal requested."} The balance could not be refreshed.`,
        );
      }
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Could not request withdrawal",
      );
    } finally {
      setRequestingWithdrawal(false);
    }
  };

  const isBusy =
    loadingOverview || savingPayoutDetails || requestingWithdrawal;

  return (
    <AppLayout>
      <section className={s.mainGrid}>
        <div className={s.leftColumn}>
          <div className={s.leftTopArea}>
            <div>
              <p className={s.pageLabel}>Payments</p>
              <h1 className={s.mainHeading}>
                Track <span className={s.gradientEarnings}>earnings</span>
                <br />
                and request withdrawals.
              </h1>
              <p className={s.subText}>
                Customer payments land with the platform first. A 10% platform
                fee is deducted, then the remaining balance becomes available
                here.
              </p>
            </div>

            <div className={s.illustrationContainer}>
              <img
                src={p3Image}
                alt=""
                className={s.illustrationImg}
              />
            </div>
          </div>

          <div className={s.walletCardsGrid}>
            <div className={s.walletCard}>
              <div className={s.walletCardHeader}>
                <div className={s.walletIconBoxAvailable}>
                  <Wallet className="h-4 w-4 text-emerald-600" />
                </div>
                <span className={s.walletCardLabel}>Available</span>
              </div>
              <h2 className={s.walletAmount}>
                {loadingOverview ? "Loading..." : formatMoney(wallet.available)}
              </h2>
            </div>

            <div className={s.walletCard}>
              <div className={s.walletCardHeader}>
                <div className={s.walletIconBoxEarned}>
                  <TrendingUp className="h-4 w-4 text-[#7D57F5]" />
                </div>
                <span className={s.walletCardLabel}>Total earned</span>
              </div>
              <h2 className={s.walletAmount}>
                {loadingOverview ? "Loading..." : formatMoney(wallet.earned)}
              </h2>
            </div>

            <div className={s.walletCard}>
              <div className={s.walletCardHeader}>
                <div className={s.walletIconBoxPending}>
                  <Clock className="h-4 w-4 text-amber-600" />
                </div>
                <span className={s.walletCardLabel}>Pending payouts</span>
              </div>
              <h2 className={s.walletAmount}>
                {loadingOverview
                  ? "Loading..."
                  : formatMoney(wallet.pendingWithdrawals)}
              </h2>
              <p className={s.paidOutText}>
                Paid out:{" "}
                {loadingOverview ? "Loading..." : formatMoney(wallet.paidWithdrawals)}
              </p>
            </div>
          </div>

          <section className={s.withdrawSection}>
            <h2 className={s.withdrawTitle}>
              <ArrowDownToLine className={s.withdrawIcon} />
              Withdraw balance
            </h2>

            <form onSubmit={submitWithdrawal} className={s.withdrawForm}>
              <div className={s.withdrawInputContainer}>
                <IndianRupee className={s.withdrawInputIcon} />
                <input
                  type="number"
                  min="1"
                  max={availableRupees}
                  step="0.01"
                  required
                  value={withdrawAmount}
                  onChange={(event) => setWithdrawAmount(event.target.value)}
                  placeholder={loadingOverview ? "Loading balance..." : availableRupees}
                  className={s.withdrawInput}
                  disabled={isBusy || !payoutDetails.isComplete}
                />
              </div>

              <button
                type="submit"
                disabled={
                  isBusy ||
                  !payoutDetails.isComplete ||
                  Number(wallet.available) < 100
                }
                className={s.requestButton}
              >
                <ArrowDownToLine className={s.requestButtonIcon} />
                {requestingWithdrawal ? "Requesting..." : "Request"}
              </button>
            </form>

            {!payoutDetails.isComplete && (
              <p className={s.withdrawWarning}>
                Save payout details before requesting a withdrawal.
              </p>
            )}
          </section>

          {message && <p className={s.messageBox}>{message}</p>}
        </div>

        <div className={s.rightColumn}>
          <section className={s.payoutDetailsSection}>
            <h2 className={s.payoutTitle}>
              <Building2 className={s.payoutTitleIcon} />
              Payout details
            </h2>
            <p className={s.payoutDescription}>
              The account number is stored as a masked last four digits. Re-enter
              the full number when saving bank details.
            </p>

            <form onSubmit={savePayoutDetails} className={s.payoutForm}>
              <label className={s.inputLabel}>
                Account holder
                <input
                  name="accountHolderName"
                  value={form.accountHolderName}
                  onChange={handleChange}
                  className={s.textInput}
                  autoComplete="name"
                  required
                  disabled={isBusy}
                />
              </label>

              <label className={s.inputLabel}>
                Bank name
                <input
                  name="bankName"
                  value={form.bankName}
                  onChange={handleChange}
                  className={s.textInput}
                  autoComplete="organization"
                  disabled={isBusy}
                />
              </label>

              <label className={s.inputLabel}>
                Account number
                <input
                  name="accountNumber"
                  type="password"
                  inputMode="numeric"
                  value={form.accountNumber}
                  onChange={handleChange}
                  placeholder={
                    payoutDetails.accountLast4
                      ? `Re-enter account ending ${payoutDetails.accountLast4}`
                      : "Enter account number"
                  }
                  className={s.textInput}
                  autoComplete="off"
                  disabled={isBusy}
                />
              </label>

              <div className={s.payoutGridTwoCol}>
                <label className={s.inputLabel}>
                  IFSC
                  <input
                    name="ifsc"
                    value={form.ifsc}
                    onChange={handleChange}
                    className={s.textInput}
                    autoCapitalize="characters"
                    disabled={isBusy}
                  />
                </label>

                <label className={s.inputLabel}>
                  UPI ID
                  <input
                    name="upiId"
                    value={form.upiId}
                    onChange={handleChange}
                    className={s.textInput}
                    autoComplete="off"
                    disabled={isBusy}
                  />
                </label>
              </div>

              <button
                type="submit"
                disabled={isBusy}
                className={s.saveButton}
              >
                <Save className={s.saveIcon} />
                {savingPayoutDetails ? "Saving..." : "Save payout details"}
              </button>
            </form>
          </section>

          <section className={s.recentActivitySection}>
            <div className={s.recentActivityHeader}>
              <h2 className={s.recentActivityTitle}>
                <CreditCard className={s.recentActivityTitleIcon} />
                Recent activity
              </h2>
              <Link to="/bookings" className={s.bookingsLink}>
                Bookings
                <ExternalLink className={s.bookingsLinkIcon} />
              </Link>
            </div>

            <div className={s.transactionList}>
              {(overview?.transactions || []).map((transaction) => {
                const amount = transactionAmount(transaction);
                const isNegative = amount < 0;

                return (
                  <div key={transaction._id} className={s.transactionItem}>
                    <div className={s.transactionLeft}>
                      <div
                        className={
                          isNegative
                            ? s.transactionIconBoxNegative
                            : s.transactionIconBoxPositive
                        }
                      >
                        {isNegative ? (
                          <ArrowUpRight className="h-4 w-4" />
                        ) : (
                          <ArrowDownLeft className="h-4 w-4" />
                        )}
                      </div>
                      <span className={s.transactionLabel}>
                        {transactionLabel(transaction)}
                      </span>
                    </div>

                    <strong
                      className={
                        isNegative
                          ? s.transactionAmountNegative
                          : s.transactionAmountPositive
                      }
                    >
                      {formatMoney(amount, transaction.currency)}
                    </strong>
                  </div>
                );
              })}

              {!loadingOverview &&
                overview?.transactions?.length === 0 && (
                  <p className={s.emptyText}>No wallet activity yet.</p>
                )}

              {loadingOverview && (
                <p className={s.emptyText}>Loading wallet activity...</p>
              )}
            </div>
          </section>
        </div>
      </section>
    </AppLayout>
  );
}