import { useEffect, useMemo, useState } from "react";
import p5Image from "../assets/P5.png";
import { UseToast } from "../context/ToastContext";
import { listAvailability, saveAvailability } from "../api/availability";
import {
  CalendarDays,
  Sun,
  Plus,
  Trash2,
  Save,
  Clock,
  BadgeCheck,
} from "lucide-react";
import { availabilityPageStyles as s } from "../assets/dummyStyles";
import AppLayout from "../components/AppLayout";

const days = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const daysIcon = [
  Sun,
  CalendarDays,
  CalendarDays,
  CalendarDays,
  CalendarDays,
  CalendarDays,
  Sun,
];

const defaultSlot = { startTime: "09:00", endTime: "17:00" };

const sortSlots = (items) =>
  [...items].sort((a, b) => a.startTime.localeCompare(b.startTime));

const validateSlots = (items) => {
  for (const slot of items) {
    if (!slot.startTime || !slot.endTime || slot.startTime >= slot.endTime) {
      return "Each time window must have an end time later than its start time.";
    }
  }

  const sorted = sortSlots(items);
  for (let index = 1; index < sorted.length; index += 1) {
    if (sorted[index].startTime < sorted[index - 1].endTime) {
      return "Time windows cannot overlap.";
    }
  }

  return "";
};

export default function AvailabilityPage() {
  const INITIAL_SELECTED_DAY = 1;
  const [availability, setAvailability] = useState([]);
  const [selectedDay, setSelectedDay] = useState(INITIAL_SELECTED_DAY);
  const [slots, setSlots] = useState([defaultSlot]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const showToast = UseToast();

  const currentDaySummary = useMemo(
    () => availability.find((item) => item.dayOfWeek === selectedDay),
    [availability, selectedDay],
  );

  useEffect(() => {
    let isCurrent = true;

    const loadAvailability = async () => {
      setLoading(true);
      setLoadError("");

      try {
        const { data } = await listAvailability();
        const items = Array.isArray(data) ? data : [];

        if (!isCurrent) return;

        setAvailability(items);

        const initialDayAvailability = items.find(
          (item) => item.dayOfWeek === INITIAL_SELECTED_DAY,
        );
        setSlots(initialDayAvailability?.slots ?? [defaultSlot]);
      } catch (error) {
        if (!isCurrent) return;

        const errorMessage =
          error.response?.data?.message || "Could not load availability";
        setLoadError(errorMessage);
        showToast(errorMessage, "error");
      } finally {
        if (isCurrent) setLoading(false);
      }
    };

    loadAvailability();

    return () => {
      isCurrent = false;
    };
  }, [showToast]);

  const selectDay = (dayIndex) => {
    setSelectedDay(dayIndex);

    const dayAvailability = availability.find(
      (item) => item.dayOfWeek === dayIndex,
    );

    // Use a starter window for a day that has never been saved.
    // An explicitly saved empty slots array represents a closed day.
    setSlots(dayAvailability ? dayAvailability.slots : [defaultSlot]);
  };

  const updateSlot = (index, field, value) => {
    setSlots((currentSlots) =>
      currentSlots.map((slot, slotIndex) =>
        slotIndex === index ? { ...slot, [field]: value } : slot,
      ),
    );
  };

  const addSlot = () => {
    if (slots.length === 0) {
      setSlots([defaultSlot]);
      return;
    }

    const sorted = sortSlots(slots);
    const latestEnd = sorted[sorted.length - 1].endTime;
    const [hourText, minute] = latestEnd.split(":");
    const hour = Number(hourText);

    if (hour >= 23) {
      showToast("Cannot add a time window after 11:00 PM.", "error");
      return;
    }

    const nextStart = `${String(hour).padStart(2, "0")}:${minute}`;
    const nextEnd = `${String(hour + 1).padStart(2, "0")}:${minute}`;

    setSlots((currentSlots) => [
      ...currentSlots,
      { startTime: nextStart, endTime: nextEnd },
    ]);
  };

  const removeSlot = (index) => {
    setSlots((currentSlots) =>
      currentSlots.filter((_, slotIndex) => slotIndex !== index),
    );
  };

  const handleSave = async () => {
    const validationError = validateSlots(slots);

    if (validationError) {
      showToast(validationError, "error");
      return;
    }

    setSaving(true);

    try {
      const { data } = await saveAvailability({
        dayOfWeek: selectedDay,
        slots: sortSlots(slots),
      });

      setAvailability((currentAvailability) => {
        const withoutSelectedDay = currentAvailability.filter(
          (item) => item.dayOfWeek !== selectedDay,
        );

        return [...withoutSelectedDay, data.availability].sort(
          (a, b) => a.dayOfWeek - b.dayOfWeek,
        );
      });

      showToast("Availability saved");
    } catch (error) {
      showToast(
        error.response?.data?.message || "Could not save availability",
        "error",
      );
    } finally {
      setSaving(false);
    }
  };

  const formatTime = (time24) => {
    if (!time24) return "";

    const [hourText, minute] = time24.split(":");
    const hour = Number(hourText);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;

    return `${String(displayHour).padStart(2, "0")}:${minute} ${ampm}`;
  };

  const savedWindowCount = currentDaySummary?.slots?.length ?? 0;

  return (
    <AppLayout>
      <div className={s.mainGrid}>
        <section>
          <div className={s.leftTopArea}>
            <div>
              <p className={s.availabilityLabel}>Availability</p>
              <h1 className={s.mainHeading}>
                Set the hours customers can{" "}
                <span className={s.gradientText}>choose.</span>
              </h1>
              <p className={s.subText}>
                Select a weekday, add one or more time windows, then save.
              </p>
            </div>

            <div className={s.illustrationContainer}>
              <img src={p5Image} alt="" className={s.illustrationImg} />
            </div>
          </div>

          <div className={s.dayListContainer}>
            {days.map((day, index) => {
              const Icon = daysIcon[index];
              const isSelected = selectedDay === index;
              const hasSavedAvailability = availability.some(
                (item) => item.dayOfWeek === index && item.slots?.length > 0,
              );

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => selectDay(index)}
                  className={
                    isSelected ? s.dayButtonActive : s.dayButtonInactive
                  }
                  aria-pressed={isSelected}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={
                        isSelected
                          ? s.dayIconContainerActive
                          : s.dayIconContainerInactive
                      }
                    >
                      <Icon className={s.dayIcon} />
                    </div>
                    <span
                      className={
                        isSelected ? s.dayLabelActive : s.dayLabelInactive
                      }
                    >
                      {day}
                    </span>
                  </div>

                  {isSelected ? (
                    <div className={s.dayCheckActiveContainer}>
                      <BadgeCheck className={s.dayCheckActiveIcon} />
                    </div>
                  ) : (
                    <span className={s.dayIconContainerInactive}>
                      {hasSavedAvailability ? "Open" : ""}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className={s.infoBox}>
            <Clock className={s.infoBoxIcon} />
            <p className={s.infoBoxText}>
              Customers can book only during the days and times you make
              available.
            </p>
          </div>
        </section>

        <section className={s.rightSection}>
          <div className={s.rightTopBar}>
            <div className={s.rightTopLeft}>
              <div className={s.rightTopIconContainer}>
                <CalendarDays className={s.rightTopCalendarIcon} />
              </div>
              <div>
                <h2 className={s.rightDayName}>{days[selectedDay]}</h2>
                <p className={s.rightSummaryText}>
                  {loading
                    ? "Loading availability..."
                    : `${savedWindowCount} saved time ${
                        savedWindowCount === 1 ? "window" : "windows"
                      }`}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={addSlot}
              className={s.addWindowButton}
              disabled={loading || saving}
            >
              <Plus className={s.addWindowIcon} />
              Add window
            </button>
          </div>

          {loadError && <p className={s.message}>{loadError}</p>}

          <div className={s.slotsContainer}>
            {!loading && slots.length === 0 && (
              <p className={s.message}>
                This day is closed. Add a time window to accept bookings.
              </p>
            )}

            {slots.map((slot, index) => (
              <div key={`${index}-${slot.startTime}`} className={s.slotCard}>
                <div className={s.slotGrid}>
                  <label className={s.slotLabel}>
                    Start
                    <div className={s.timeInputContainer}>
                      <Clock className={s.timeInputClockIcon} />
                      <input
                        type="time"
                        value={slot.startTime}
                        onChange={(event) =>
                          updateSlot(index, "startTime", event.target.value)
                        }
                        className={s.timeInput}
                        disabled={loading || saving}
                      />
                    </div>
                    <span className="sr-only">
                      {formatTime(slot.startTime)}
                    </span>
                  </label>

                  <label className={s.slotLabel}>
                    End
                    <div className={s.timeInputContainer}>
                      <Clock className={s.timeInputClockIcon} />
                      <input
                        type="time"
                        value={slot.endTime}
                        onChange={(event) =>
                          updateSlot(index, "endTime", event.target.value)
                        }
                        className={s.timeInput}
                        disabled={loading || saving}
                      />
                    </div>
                    <span className="sr-only">{formatTime(slot.endTime)}</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => removeSlot(index)}
                    className={s.removeSlotButton}
                    disabled={loading || saving}
                    aria-label={`Remove ${formatTime(
                      slot.startTime,
                    )} to ${formatTime(slot.endTime)} window`}
                  >
                    <Trash2 className={s.removeSlotIcon} />
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addSlot}
            className={s.dashedAddButton}
            disabled={loading || saving}
          >
            <Plus className={s.dashedAddIcon} />
            Add another time window
          </button>

          <button
            type="button"
            disabled={loading || saving}
            onClick={handleSave}
            className={s.saveButton}
          >
            <Save className={s.saveIcon} />
            {saving ? "Saving..." : "Save availability"}
          </button>
        </section>
      </div>
    </AppLayout>
  );
}
