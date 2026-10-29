import { useCallback, useEffect, useState } from "react";
import p6Image from "../assets/P6.png";
import C1 from "../assets/icons/C1.png";
import C2 from "../assets/icons/C2.png";
import C3 from "../assets/icons/C3.png";
import C4 from "../assets/icons/C4.png";
import C5 from "../assets/icons/C5.png";
import C6 from "../assets/icons/C6.png";
import C7 from "../assets/icons/C7.png";
import C8 from "../assets/icons/C8.png";
import AppLayout from "../components/AppLayout";
import { UseToast } from "../context/ToastContext";
import {
  createService,
  deleteService,
  listServices,
  updateService,
} from "../api/service";
import {
  Plus,
  Save,
  X,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Clock,
  IndianRupee,
  FileText,
  Layers,
} from "lucide-react";
import { servicesPageStyles as s } from "../assets/dummyStyles";

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

const emptyForm = {
  name: "",
  duration: 30,
  price: 0,
  description: "",
  icon: "C1.png",
};

export default function ServicesPage() {
  const [services, setServices] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState("");
  const [message, setMessage] = useState("");
  const [loadingServices, setLoadingServices] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingServiceId, setUpdatingServiceId] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const showToast = UseToast();

  const loadServices = useCallback(async () => {
    setMessage("");

    try {
      const { data } = await listServices();
      setServices(Array.isArray(data?.services) ? data.services : []);
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Could not load services";
      setMessage(errorMessage);
      showToast(errorMessage, "error");
    }
  }, [showToast]);

  useEffect(() => {
    let isCurrent = true;

    const fetchInitialServices = async () => {
      try {
        const { data } = await listServices();

        if (isCurrent) {
          setServices(Array.isArray(data?.services) ? data.services : []);
        }
      } catch (error) {
        if (!isCurrent) return;

        const errorMessage =
          error.response?.data?.message || "Could not load services";
        setMessage(errorMessage);
        showToast(errorMessage, "error");
      } finally {
        if (isCurrent) {
          setLoadingServices(false);
        }
      }
    };

    fetchInitialServices();

    return () => {
      isCurrent = false;
    };
  }, [showToast]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previousForm) => ({
      ...previousForm,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const payload = {
        ...form,
        name: form.name.trim(),
        duration: Number(form.duration),
        price: Number(form.price),
      };

      if (editingId) {
        await updateService(editingId, payload);
      } else {
        await createService(payload);
      }

      const wasEditing = Boolean(editingId);
      setForm(emptyForm);
      setEditingId("");

      showToast(
        wasEditing
          ? "Service updated successfully"
          : "Service added successfully",
      );

      await loadServices();
    } catch (error) {
      showToast(
        error.response?.data?.message || "Could not save service",
        "error",
      );
    } finally {
      setSaving(false);
    }
  };

  const toggleService = async (service) => {
    setUpdatingServiceId(service._id);

    try {
      await updateService(service._id, {
        isActive: !service.isActive,
      });

      showToast(
        service.isActive
          ? "Service hidden from your booking page"
          : "Service is now active on your booking page",
      );

      await loadServices();
    } catch (error) {
      showToast(
        error.response?.data?.message || "Could not update service",
        "error",
      );
    } finally {
      setUpdatingServiceId("");
    }
  };

  const startEditing = (service) => {
    setEditingId(service._id);
    setForm({
      name: service.name || "",
      duration: service.duration ?? 30,
      price: service.price ?? 0,
      description: service.description || "",
      icon: service.icon || "C1.png",
    });
    setMessage("");
  };

  const cancelEditing = () => {
    setEditingId("");
    setForm(emptyForm);
    setMessage("");
  };

  const executeDelete = async () => {
    if (!deleteConfirm || deleting) return;

    setDeleting(true);

    try {
      await deleteService(deleteConfirm._id);

      if (editingId === deleteConfirm._id) {
        cancelEditing();
      }

      setDeleteConfirm(null);
      showToast("Service deleted successfully");
      await loadServices();
    } catch (error) {
      showToast(
        error.response?.data?.message || "Could not delete service",
        "error",
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AppLayout>
      <div className={s.mainGrid}>
        <section>
          <div className={s.headerRow}>
            <div>
              <p className={s.pageLabel}>Services</p>
              <h1 className={s.mainHeading}>
                Shape what customers can{" "}
                <span className={s.gradientText}>book.</span>
              </h1>
              <p className={s.subText}>
                Add each appointment type with a duration and price. Active
                services appear on your public booking page.
              </p>
            </div>

            <div className={s.illustrationContainer}>
              <img src={p6Image} alt="" className={s.illustrationImg} />
            </div>
          </div>

          <form onSubmit={handleSubmit} className={s.formCard}>
            <h3 className={s.formTitle}>
              <Plus className={s.formTitleIcon} />
              {editingId ? "Edit service" : "Add new service"}
            </h3>

            <div className={s.formGrid}>
              <label className={s.inputLabel}>
                Service name
                <div className={s.inputWrapper}>
                  <Layers className={s.inputIcon} />
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    className={s.textInput}
                    placeholder="Consultation"
                    required
                    maxLength={100}
                  />
                </div>
              </label>

              <div className={s.durationPriceGrid}>
                <label className={s.inputLabel}>
                  Duration
                  <div className={s.inputWrapper}>
                    <Clock className={s.inputIcon} />
                    <select
                      name="duration"
                      value={form.duration}
                      onChange={handleChange}
                      className={s.selectInput}
                    >
                      {[15, 30, 45, 60, 90, 120].map((value) => (
                        <option key={value} value={value}>
                          {value} minutes
                        </option>
                      ))}
                    </select>
                  </div>
                </label>

                <label className={s.inputLabel}>
                  Price
                  <div className={s.inputWrapper}>
                    <IndianRupee className={s.inputIcon} />
                    <input
                      name="price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.price}
                      onChange={handleChange}
                      className={s.priceInput}
                    />
                  </div>
                </label>
              </div>

              <label className={s.inputLabel}>
                Description
                <div className={s.textareaWrapper}>
                  <FileText className={s.textareaIcon} />
                  <textarea
                    name="description"
                    rows={3}
                    value={form.description}
                    onChange={handleChange}
                    className={s.textareaInput}
                    placeholder="A short customer-facing description"
                    maxLength={1000}
                  />
                </div>
              </label>

              <fieldset className={s.inputLabel}>
                <legend>Service icon</legend>
                <div className={s.iconGrid}>
                  {Object.keys(ICON_MAP).map((iconName) => (
                    <button
                      key={iconName}
                      type="button"
                      aria-label={`Choose ${iconName} service icon`}
                      aria-pressed={form.icon === iconName}
                      onClick={() =>
                        setForm((previousForm) => ({
                          ...previousForm,
                          icon: iconName,
                        }))
                      }
                      className={
                        form.icon === iconName
                          ? s.iconBtnActive
                          : s.iconBtnInactive
                      }
                    >
                      <img
                        src={ICON_MAP[iconName]}
                        alt=""
                        className={s.iconImg}
                      />
                    </button>
                  ))}
                </div>
              </fieldset>
            </div>

            <div className={s.formActions}>
              <button
                type="submit"
                disabled={saving}
                className={s.submitButton}
              >
                <Save className={s.submitIcon} />
                {saving
                  ? "Saving..."
                  : editingId
                    ? "Save changes"
                    : "Add service"}
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={cancelEditing}
                  className={s.cancelButton}
                  disabled={saving}
                >
                  <X className={s.cancelIcon} />
                  Cancel
                </button>
              )}
            </div>

            {message && <p className={s.message}>{message}</p>}
          </form>
        </section>

        <section className={s.rightSection}>
          <h2 className={s.rightTitle}>
            <Layers className={s.rightTitleIcon} />
            Your services
          </h2>

          <div className={s.serviceList}>
            {loadingServices ? (
              <div className={s.emptyState}>
                <p className={s.emptyText}>Loading services...</p>
              </div>
            ) : services.length === 0 ? (
              <div className={s.emptyState}>
                <Layers className={s.emptyIcon} />
                <p className={s.emptyText}>No services yet.</p>
              </div>
            ) : (
              services.map((service) => {
                const serviceIcon =
                  ICON_MAP[service.icon] || ICON_MAP["C1.png"];
                const isUpdating = updatingServiceId === service._id;

                return (
                  <article key={service._id} className={s.serviceCard}>
                    <div className={s.serviceCardInner}>
                      <div className={s.serviceInfoRow}>
                        <div className={s.serviceIconContainer}>
                          <img
                            src={serviceIcon}
                            alt=""
                            className={s.serviceIconImg}
                          />
                        </div>

                        <div className={s.serviceTextBlock}>
                          <h3 className={s.serviceName}>{service.name}</h3>
                          <p className={s.serviceDetail}>
                            {service.duration} min · ₹
                            {Number(service.price).toLocaleString("en-IN")}
                          </p>
                          {service.description && (
                            <p className={s.serviceDesc}>
                              {service.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className={s.serviceActions}>
                        <button
                          type="button"
                          onClick={() => toggleService(service)}
                          disabled={isUpdating || saving || deleting}
                          className={
                            service.isActive
                              ? s.visibilityBadgeActive
                              : s.visibilityBadgeInactive
                          }
                          aria-label={
                            service.isActive
                              ? `Hide ${service.name}`
                              : `Activate ${service.name}`
                          }
                        >
                          {service.isActive ? (
                            <Eye className="h-3 w-3" />
                          ) : (
                            <EyeOff className="h-3 w-3" />
                          )}
                          {isUpdating
                            ? "Updating..."
                            : service.isActive
                              ? "Active"
                              : "Hidden"}
                        </button>

                        <button
                          type="button"
                          onClick={() => startEditing(service)}
                          disabled={saving || deleting}
                          className={s.editButton}
                          aria-label={`Edit ${service.name}`}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setDeleteConfirm(service)}
                          disabled={saving || deleting}
                          className={s.deleteButton}
                          aria-label={`Delete ${service.name}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </section>

        {deleteConfirm && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
            role="presentation"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget && !deleting) {
                setDeleteConfirm(null);
              }
            }}
          >
            <div
              className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl"
              role="dialog"
              aria-modal="true"
              aria-labelledby="delete-service-title"
            >
              <div className="p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                  <Trash2 className="h-6 w-6 text-red-600" />
                </div>

                <h2
                  id="delete-service-title"
                  className="mb-2 text-xl font-bold text-slate-900"
                >
                  Delete service
                </h2>

                <p className="mb-6 text-sm leading-relaxed text-slate-500">
                  Delete{" "}
                  <span className="font-semibold text-slate-700">
                    {deleteConfirm.name}
                  </span>
                  ? Existing bookings will remain, but customers will no longer
                  be able to book this service.
                </p>

                <div className="flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setDeleteConfirm(null)}
                    disabled={deleting}
                    className="rounded-xl px-5 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={executeDelete}
                    disabled={deleting}
                    className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
                  >
                    {deleting ? "Deleting..." : "Delete service"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
