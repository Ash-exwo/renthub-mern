import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Check,
  ArrowRight,
  ArrowLeft,
  Plus,
  Trash2,
  Sparkles,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
} from "lucide-react";
import api from "../../../utils/api";
import Container from "../../../components/Container";
import {
  Input,
  Select,
  Textarea,
  Button,
  Card,
  ListingCard,
} from "../../../components/ui";

const STEPS = [
  { id: 1, title: "Basic Info", sub: "Title & category" },
  { id: 2, title: "Specifications", sub: "Location & included items" },
  { id: 3, title: "Photos", sub: "Upload photos" },
  { id: 4, title: "Pricing & Rules", sub: "Rate & deposit" },
  { id: 5, title: "Preview & Publish", sub: "Final review" },
];

export default function CreateListing() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [currentStep, setCurrentStep] = useState(1);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");
  const [uploadError, setUploadError] = useState("");

  // Form State - Clean initial values (no hardcoded dummy values)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    location: "",
    amenitiesInput: "",
    rentalPricePerDay: "",
    deposit: "",
    availability: "available",
    rules: "Valid Govt ID required at handover. Return in original clean condition.",
  });

  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await api.get("/categories");
        if (res.data?.categories) {
          setCategories(res.data.categories);
        }
      } catch (err) {
        console.error("Failed to load categories", err);
      }
    }
    loadCategories();
  }, []);

  // Photos state - Starts empty without forced apartment photos
  const [images, setImages] = useState([]);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // Compress image on client side to keep Base64 lightweight (< 200KB) and prevent payload limits
  const compressImage = (file, maxWidth = 1200, quality = 0.8) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result;
        img.onload = () => {
          let width = img.width;
          let height = img.height;

          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);

          const compressedDataUrl = canvas.toDataURL("image/jpeg", quality);
          resolve(compressedDataUrl);
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  // 1. Local File Upload Handler with client-side compression
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError("");

    if (!file.type.startsWith("image/")) {
      setUploadError("Please select a valid image file (PNG, JPG, WEBP).");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError("Original image size must be under 10MB.");
      return;
    }

    try {
      const compressedDataUrl = await compressImage(file);
      setImages((prev) => [...prev, compressedDataUrl]);
      setErrors((prev) => ({ ...prev, images: "" }));
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      console.error("Compression error:", err);
      setUploadError("Failed to process image file. Please try another image.");
    }
  };

  // 2. URL addition handler
  const handleAddImage = () => {
    if (!newImageUrl.trim()) return;
    setImages((prev) => [...prev, newImageUrl.trim()]);
    setNewImageUrl("");
    setErrors((prev) => ({ ...prev, images: "" }));
  };

  // 3. Remove photo
  const handleRemoveImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Validation
  const validateStep = (step) => {
    const errs = {};
    if (step === 1) {
      if (!formData.title.trim() || formData.title.trim().length < 5) {
        errs.title = "Title must be at least 5 characters.";
      }
      if (!formData.description.trim() || formData.description.trim().length < 20) {
        errs.description = "Description must be at least 20 characters.";
      }
      if (!formData.category) {
        errs.category = "Please select a category.";
      }
    } else if (step === 2) {
      if (!formData.location.trim() || formData.location.trim().length < 3) {
        errs.location = "Please enter a valid city or pickup area.";
      }
    } else if (step === 3) {
      if (images.length === 0) {
        errs.images = "Please add at least one photo (upload from device or choose a preset).";
      }
    } else if (step === 4) {
      if (!formData.rentalPricePerDay || Number(formData.rentalPricePerDay) <= 0) {
        errs.rentalPricePerDay = "Enter a valid daily rental price.";
      }
    }
    return errs;
  };

  const handleNext = () => {
    const stepErrors = validateStep(currentStep);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }
    setCurrentStep((prev) => Math.min(STEPS.length, prev + 1));
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1));
  };

  // Publish with all fields officially transmitted to MongoDB
  const handlePublish = async () => {
    setLoading(true);
    setServerError("");

    const amenitiesArray = formData.amenitiesInput
      ? formData.amenitiesInput
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

    try {
      await api.post("/listings", {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        rentalPricePerDay: Number(formData.rentalPricePerDay),
        deposit: Number(formData.deposit || 0),
        amenities: amenitiesArray,
        rules: formData.rules.trim(),
        location: formData.location.trim(),
        images,
        availability: formData.availability,
      });

      navigate("/my-listings");
    } catch (err) {
      console.error("Listing publish error:", err);
      const serverMsg =
        err.response?.data?.message ||
        (err.response?.status === 413
          ? "Photo size is too large. Please upload a smaller photo."
          : err.response?.status === 401
          ? "Your session expired. Please log in again to publish."
          : err.response?.status === 400
          ? "Please verify all required listing fields."
          : "Failed to publish listing. Please check required fields and network connection.");
      setServerError(serverMsg);
    } finally {
      setLoading(false);
    }
  };

  // Preview Object for Step 5
  const selectedCategoryDoc = categories.find((c) => c._id === formData.category);
  const previewCategoryLabel = selectedCategoryDoc
    ? `${selectedCategoryDoc.icon ? selectedCategoryDoc.icon + " " : ""}${selectedCategoryDoc.name}`
    : "Category";

  const previewListing = {
    title: formData.title || "Sample Title",
    category: selectedCategoryDoc || { name: previewCategoryLabel, icon: "🏷️" },
    rentalPricePerDay: Number(formData.rentalPricePerDay) || 0,
    location: formData.location || "City, State",
    images,
    availability: formData.availability,
    rating: 5.0,
    reviewsCount: 0,
  };

  return (
    <div className="py-8 sm:py-12 min-h-[calc(100vh-180px)]">
      <Container>
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <span className="text-xs font-bold text-[var(--color-brand-primary)] uppercase tracking-wider">
              Publisher Wizard
            </span>
            <h1 className="font-[var(--font-heading)] text-2xl sm:text-3xl font-extrabold text-[var(--color-espresso)] my-1">
              List an Asset on RentHub
            </h1>
            <p className="text-xs text-[var(--color-muted-grey)]">
              Step {currentStep} of {STEPS.length}: {STEPS[currentStep - 1].title}
            </p>
          </div>

          {/* Stepper Indicator */}
          <div className="flex justify-between items-center mb-10 relative">
            {STEPS.map((step) => {
              const isCompleted = currentStep > step.id;
              const isCurrent = currentStep === step.id;
              return (
                <div
                  key={step.id}
                  className={`flex flex-col items-center gap-1.5 z-10 ${
                    isCompleted ? "cursor-pointer" : "cursor-default"
                  }`}
                  onClick={() => isCompleted && setCurrentStep(step.id)}
                >
                  <div
                    className={`w-9 h-9 rounded-full grid place-items-center font-bold text-xs transition-colors duration-150 ${
                      isCompleted
                        ? "bg-emerald-600 text-white"
                        : isCurrent
                        ? "bg-[var(--color-brand-primary)] text-white shadow-md shadow-indigo-500/30"
                        : "bg-[var(--color-surface-secondary)] text-[var(--color-muted-grey)]"
                    }`}
                  >
                    {isCompleted ? <Check size={14} /> : step.id}
                  </div>
                </div>
              );
            })}

            {/* Connecting line */}
            <div className="absolute top-4 left-4 right-4 h-0.5 bg-[var(--color-border)] z-0" />
          </div>

          {serverError && (
            <div
              className="p-3.5 rounded-xl bg-red-500/10 text-red-600 border border-red-500/25 text-xs font-medium mb-6"
              role="alert"
            >
              {serverError}
            </div>
          )}

          {/* Step Form Body */}
          <Card padding="lg" variant="elevated">
            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <div className="flex flex-col gap-5">
                <h2 className="text-lg font-bold text-[var(--color-espresso)]">Step 1: Title & Category</h2>

                <Input
                  label="Listing Title"
                  name="title"
                  placeholder="e.g. Sony Alpha A7 IV Camera + 24-70mm Lens"
                  value={formData.title}
                  onChange={handleChange}
                  error={errors.title}
                  helperText="Use a clear, descriptive title mentioning brand and model."
                  required
                />

                <Select
                  label="Category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  error={errors.category}
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.icon ? `${c.icon} ` : ""}{c.name}
                    </option>
                  ))}
                </Select>

                <Textarea
                  label="Listing Description"
                  name="description"
                  rows={5}
                  placeholder="Describe condition, technical specifications, and what it's best suited for..."
                  value={formData.description}
                  onChange={handleChange}
                  error={errors.description}
                  helperText="Minimum 20 characters. Detailed listings attract significantly more bookings."
                  required
                />
              </div>
            )}

            {/* Step 2: Location & Specifications */}
            {currentStep === 2 && (
              <div className="flex flex-col gap-5">
                <h2 className="text-lg font-bold text-[var(--color-espresso)]">Step 2: Location & Inclusions</h2>

                <Input
                  label="Pickup Location / Area"
                  name="location"
                  placeholder="e.g. Marine Drive, Kochi or Indiranagar, Bangalore"
                  value={formData.location}
                  onChange={handleChange}
                  error={errors.location}
                  helperText="Renters will see this area when searching for rentals near them."
                  required
                />

                <Input
                  label="What's Included (Comma separated)"
                  name="amenitiesInput"
                  placeholder="e.g. Charger, Extra battery, Padded bag, Lens hood, 64GB SD Card"
                  value={formData.amenitiesInput}
                  onChange={handleChange}
                  helperText="List accessories, cables, bags, or items included with the rental."
                />
              </div>
            )}

            {/* Step 3: Photos */}
            {currentStep === 3 && (
              <div className="flex flex-col gap-5">
                <div>
                  <h2 className="text-lg font-bold text-[var(--color-espresso)]">Step 3: High-Resolution Photos</h2>
                  <p className="text-xs text-[var(--color-muted-grey)] mt-0.5">
                    Upload photos directly from your computer or paste image links.
                  </p>
                </div>

                {/* Local File Upload Button + Hidden Input */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="listing-photo-upload"
                  />
                  <label
                    htmlFor="listing-photo-upload"
                    className="cursor-pointer flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 border-dashed border-indigo-500/40 bg-indigo-500/5 hover:bg-indigo-50/10 text-indigo-600 dark:text-indigo-400 font-bold text-xs transition-all shadow-sm"
                  >
                    <Upload size={16} />
                    <span>Upload Photo from Computer (Instant preview)</span>
                  </label>
                </div>

                {uploadError && (
                  <div className="text-xs text-red-500 font-medium">{uploadError}</div>
                )}

                {/* Or Paste URL */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Or paste an image web link (https://...)"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    error={errors.images}
                  />
                  <Button variant="primary" onClick={handleAddImage} icon={Plus}>
                    Add URL
                  </Button>
                </div>

                {/* Added Photos Grid */}
                <div>
                  <div className="text-xs font-semibold text-[var(--color-espresso)] mb-2 flex items-center justify-between">
                    <span>Added Photos ({images.length})</span>
                    {images.length > 0 && (
                      <span className="text-[11px] text-[var(--color-muted-grey)]">First photo is cover image</span>
                    )}
                  </div>

                  {images.length === 0 ? (
                    <div className="border border-dashed border-[var(--color-border)] rounded-2xl p-8 text-center bg-[var(--color-surface-secondary)]/50">
                      <ImageIcon size={32} className="mx-auto text-[var(--color-muted-grey)] mb-2 opacity-50" />
                      <p className="text-xs text-[var(--color-muted-grey)] font-medium">
                        No photos added yet. Upload from your computer, paste an image link, or pick a preset above.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {images.map((img, idx) => (
                        <div
                          key={idx}
                          className="relative rounded-xl overflow-hidden border border-[var(--color-border)] group bg-slate-900 aspect-video shadow-sm"
                        >
                          <img
                            src={img}
                            alt={`Preview ${idx + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&auto=format&fit=crop&q=60";
                            }}
                          />
                          {idx === 0 && (
                            <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-indigo-600 text-white text-[10px] font-bold shadow-sm">
                              Cover Photo
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(idx)}
                            className="absolute top-2 right-2 bg-black/70 hover:bg-red-600 text-white rounded-full w-7 h-7 grid place-items-center cursor-pointer transition-colors shadow-sm"
                            title="Remove photo"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 4: Pricing & Security Deposit */}
            {currentStep === 4 && (
              <div className="flex flex-col gap-5">
                <h2 className="text-lg font-bold text-[var(--color-espresso)]">Step 4: Pricing & Rental Rules</h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Rent per Day (₹)"
                    name="rentalPricePerDay"
                    type="number"
                    min="1"
                    placeholder="e.g. 800"
                    value={formData.rentalPricePerDay}
                    onChange={handleChange}
                    error={errors.rentalPricePerDay}
                    required
                  />

                  <Input
                    label="Security Deposit (₹)"
                    name="deposit"
                    type="number"
                    min="0"
                    placeholder="e.g. 1500"
                    value={formData.deposit}
                    onChange={handleChange}
                    helperText="Refunded to renter upon safe return."
                  />
                </div>

                <Select
                  label="Initial Availability"
                  name="availability"
                  value={formData.availability}
                  onChange={handleChange}
                >
                  <option value="available">Available Immediately</option>
                  <option value="unavailable">Paused / Unavailable</option>
                </Select>

                <Textarea
                  label="Rental Rules & Verification Requirements"
                  name="rules"
                  rows={3}
                  value={formData.rules}
                  onChange={handleChange}
                  helperText="Specify ID requirements, return timings, or usage restrictions."
                />
              </div>
            )}

            {/* Step 5: Live Summary Preview */}
            {currentStep === 5 && (
              <div className="flex flex-col gap-6">
                <div>
                  <h2 className="text-lg font-bold text-[var(--color-espresso)] mb-1">
                    Step 5: Review & Publish
                  </h2>
                  <p className="text-xs text-[var(--color-muted-grey)]">
                    Live preview of your listing. Verify all specifications and pricing before making it live.
                  </p>
                </div>

                {/* The Interactive Preview Card */}
                <div className="max-w-sm mx-auto w-full">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted-grey)] mb-2 flex items-center justify-between">
                    <span>Card Appearance in Catalog</span>
                    <span className="text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full text-[10px] font-semibold">
                      Ready to Publish
                    </span>
                  </div>
                  <ListingCard listing={previewListing} isPreview={true} />
                </div>

                {/* Full Specifications Breakdown */}
                <div className="bg-[var(--color-surface-secondary)] border border-[var(--color-border)] p-5 rounded-2xl text-xs space-y-3 text-[var(--color-espresso)]">
                  <h3 className="font-bold text-sm text-[var(--color-espresso)] border-b border-[var(--color-border-subtle)] pb-2 flex items-center gap-2">
                    <Sparkles size={15} className="text-[var(--color-brand-primary)]" />
                    Listing Details Summary
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-[var(--color-muted-grey)] block">Title:</span>
                      <span className="font-semibold text-[var(--color-espresso)]">{formData.title || "Not provided"}</span>
                    </div>
                    <div>
                      <span className="text-[var(--color-muted-grey)] block">Category:</span>
                      <span className="font-semibold text-[var(--color-espresso)]">{previewCategoryLabel}</span>
                    </div>
                    <div>
                      <span className="text-[var(--color-muted-grey)] block">Daily Rental:</span>
                      <span className="font-bold text-indigo-600 text-sm">
                        ₹{Number(formData.rentalPricePerDay || 0).toLocaleString("en-IN")}/day
                      </span>
                    </div>
                    <div>
                      <span className="text-[var(--color-muted-grey)] block">Refundable Deposit:</span>
                      <span className="font-semibold text-emerald-600">
                        ₹{Number(formData.deposit || 0).toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-[var(--color-muted-grey)] block">Pickup Location:</span>
                      <span className="font-semibold text-[var(--color-espresso)]">{formData.location || "Not provided"}</span>
                    </div>
                  </div>

                  {/* Included items */}
                  {formData.amenitiesInput && (
                    <div className="pt-2 border-t border-[var(--color-border-subtle)]">
                      <span className="text-[var(--color-muted-grey)] block mb-1.5 font-semibold">Included Items:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {formData.amenitiesInput.split(",").map((item, idx) => {
                          const trimmed = item.trim();
                          if (!trimmed) return null;
                          return (
                            <span
                              key={idx}
                              className="px-2.5 py-1 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] text-[11px] font-medium text-[var(--color-espresso)] inline-flex items-center gap-1"
                            >
                              <CheckCircle2 size={12} className="text-emerald-500" />
                              {trimmed}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Rules */}
                  {formData.rules && (
                    <div className="pt-2 border-t border-[var(--color-border-subtle)]">
                      <span className="text-[var(--color-muted-grey)] block mb-1 font-semibold">Rental Terms & Rules:</span>
                      <p className="text-[var(--color-secondary-text)] italic bg-[var(--color-surface)] p-2.5 rounded-lg border border-[var(--color-border)]">
                        "{formData.rules}"
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Stepper Navigation Buttons */}
            <div className="flex justify-between items-center mt-8 pt-5 border-t border-[var(--color-border-subtle)]">
              {currentStep > 1 ? (
                <Button variant="outline" onClick={handleBack} icon={ArrowLeft}>
                  Back
                </Button>
              ) : (
                <div />
              )}

              {currentStep < STEPS.length ? (
                <Button variant="primary" onClick={handleNext} icon={ArrowRight} iconPosition="right">
                  Continue
                </Button>
              ) : (
                <Button
                  variant="primary"
                  onClick={handlePublish}
                  loading={loading}
                  icon={Sparkles}
                >
                  Publish Listing Now
                </Button>
              )}
            </div>
          </Card>
        </div>
      </Container>
    </div>
  );
}
