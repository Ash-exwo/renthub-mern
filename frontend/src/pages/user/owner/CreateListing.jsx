import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Check,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Search,
  MapPin,
  ChevronDown,
  X,
  CheckCircle2,
} from "lucide-react";
import api from "../../../utils/api";
import Container from "../../../components/Container";
import {
  Input,
  Textarea,
  Button,
  Card,
  ListingCard,
} from "../../../components/ui";
import ImageUploader from "../../../components/ImageUploader";
import MapPicker from "../../../components/MapPicker";
import AiDescriptionButton from "../../../components/AiDescriptionButton";

const STEPS = [
  { id: 1, title: "Basic Info", sub: "Title & category" },
  { id: 2, title: "Location", sub: "Interactive map pin" },
  { id: 3, title: "Photos", sub: "Upload photos" },
  { id: 4, title: "Pricing & Rules", sub: "Rate & deposit" },
  { id: 5, title: "Preview & Publish", sub: "Final review" },
];

export default function CreateListing() {
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(1);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  // Category searchable dropdown state
  const [categorySearch, setCategorySearch] = useState("");
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const categoryDropdownRef = useRef(null);

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    location: "",
    coordinates: null,
    rentalPricePerDay: "",
    deposit: "",
    weekendPricePerDay: "",
    weeklyDiscountPercentage: "",
    monthlyDiscountPercentage: "",
    minRentalDays: "1",
    maxRentalDays: "90",
    availability: "available",
    rules: "Valid Govt ID required at handover. Return in original clean condition.",
  });

  const [images, setImages] = useState([]);
  const [errors, setErrors] = useState({});

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

  // Close category combobox when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        categoryDropdownRef.current &&
        !categoryDropdownRef.current.contains(event.target)
      ) {
        setIsCategoryOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
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
        errs.location = "Please enter or pin a valid city or pickup area on the map.";
      }
    } else if (step === 3) {
      if (images.length === 0) {
        errs.images = "Please add at least one photo (upload from device or choose a preset).";
      }
    } else if (step === 4) {
      if (!formData.rentalPricePerDay || Number(formData.rentalPricePerDay) <= 0) {
        errs.rentalPricePerDay = "Enter a valid daily rental price.";
      }
      if (formData.weeklyDiscountPercentage && (Number(formData.weeklyDiscountPercentage) < 0 || Number(formData.weeklyDiscountPercentage) > 80)) {
        errs.weeklyDiscountPercentage = "Discount must be between 0% and 80%.";
      }
      if (formData.monthlyDiscountPercentage && (Number(formData.monthlyDiscountPercentage) < 0 || Number(formData.monthlyDiscountPercentage) > 80)) {
        errs.monthlyDiscountPercentage = "Discount must be between 0% and 80%.";
      }
      if (formData.minRentalDays && Number(formData.minRentalDays) < 1) {
        errs.minRentalDays = "Minimum rental duration must be at least 1 day.";
      }
      if (formData.maxRentalDays && formData.minRentalDays && Number(formData.maxRentalDays) < Number(formData.minRentalDays)) {
        errs.maxRentalDays = "Maximum rental duration cannot be less than minimum rental days.";
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

    try {
      await api.post("/listings", {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        rentalPricePerDay: Number(formData.rentalPricePerDay),
        deposit: Number(formData.deposit || 0),
        weekendPricePerDay: formData.weekendPricePerDay ? Number(formData.weekendPricePerDay) : undefined,
        weeklyDiscountPercentage: formData.weeklyDiscountPercentage ? Number(formData.weeklyDiscountPercentage) : 0,
        monthlyDiscountPercentage: formData.monthlyDiscountPercentage ? Number(formData.monthlyDiscountPercentage) : 0,
        minRentalDays: formData.minRentalDays ? Math.max(1, Number(formData.minRentalDays)) : 1,
        maxRentalDays: formData.maxRentalDays ? Math.max(1, Number(formData.maxRentalDays)) : 90,
        location: formData.location.trim(),
        coordinates: formData.coordinates,
        images,
        availability: formData.availability,
        rules: formData.rules.trim(),
        amenities: [],
      });

      navigate("/my-listings");
    } catch (err) {
      console.error("Listing publish error:", err);
      const serverMsg =
        err.response?.data?.message ||
        (err.response?.status === 413
          ? "Photo size is too large. Please upload a smaller photo."
          : err.response?.status === 401
          ? "Your session expired. Please log in again to list your item."
          : err.response?.status === 400
          ? "Please verify all required listing fields."
          : "Failed to list item. Please check required fields and network connection.");
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

  const filteredCategories = categories.filter((cat) =>
    (cat.name || "").toLowerCase().includes(categorySearch.toLowerCase())
  );

  return (
    <div className="py-8 sm:py-12 min-h-[calc(100vh-180px)]">
      <Container>
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <span className="text-xs font-bold text-[var(--color-brand-primary)] uppercase tracking-wider">
              Publisher Wizard
            </span>
            <h1 className="font-[var(--font-heading)] text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[var(--color-espresso)] my-1">
              List an Asset on RentHub
            </h1>
            <p className="text-xs sm:text-sm text-[var(--color-muted-grey)]">
              Step {currentStep} of {STEPS.length}: {STEPS[currentStep - 1].title} — {STEPS[currentStep - 1].sub}
            </p>
          </div>

          {/* Stepper Indicator */}
          <div className="flex justify-between items-center mb-10 relative px-2">
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
                        ? "bg-[var(--color-brand-primary)] text-white shadow-md shadow-indigo-500/30 ring-4 ring-indigo-500/20"
                        : "bg-[var(--color-surface-secondary)] text-[var(--color-muted-grey)] border border-[var(--color-border)]"
                    }`}
                  >
                    {isCompleted ? <Check size={14} /> : step.id}
                  </div>
                  <span className="hidden sm:block text-[11px] font-bold text-[var(--color-espresso)]">
                    {step.title}
                  </span>
                </div>
              );
            })}

            {/* Connecting line */}
            <div className="absolute top-4.5 left-6 right-6 h-0.5 bg-[var(--color-border)] z-0" />
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
          <Card padding="lg" variant="elevated" className="border border-[var(--color-border)] shadow-xl rounded-3xl">
            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <div className="flex flex-col gap-5">
                <div>
                  <h2 className="text-xl font-bold text-[var(--color-espresso)]">
                    Step 1: Title &amp; Category
                  </h2>
                  <p className="text-xs text-[var(--color-muted-grey)] mt-0.5">
                    Start with a catchy, descriptive title and select the most fitting category.
                  </p>
                </div>

                <Input
                  label="Listing Title"
                  name="title"
                  placeholder="e.g. Sony Alpha A7 IV Camera + 24-70mm GM Lens"
                  value={formData.title}
                  onChange={handleChange}
                  error={errors.title}
                  helperText="Use a clear, descriptive title mentioning brand, model, and year."
                  required
                />

                {/* Searchable Category Combobox */}
                <div className="space-y-1.5" ref={categoryDropdownRef}>
                  <label className="block text-xs font-bold text-[var(--color-espresso)]">
                    Category <span className="text-rose-500">*</span>
                  </label>

                  <div className="relative">
                    {selectedCategoryDoc ? (
                      <div className="flex items-center justify-between p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{selectedCategoryDoc.icon || "📦"}</span>
                          <span className="text-sm font-bold text-[var(--color-espresso)]">
                            {selectedCategoryDoc.name}
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setFormData((prev) => ({ ...prev, category: "" }));
                            setIsCategoryOpen(true);
                          }}
                        >
                          Change
                        </Button>
                      </div>
                    ) : (
                      <div
                        onClick={() => setIsCategoryOpen(true)}
                        className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer bg-[var(--color-surface)] ${
                          errors.category
                            ? "border-rose-500 ring-1 ring-rose-500/20"
                            : "border-[var(--color-border)] hover:border-indigo-500/50"
                        }`}
                      >
                        <span className="text-xs sm:text-sm text-[var(--color-muted-grey)]">
                          Click to search and select a category...
                        </span>
                        <ChevronDown size={16} className="text-[var(--color-muted-grey)]" />
                      </div>
                    )}

                    {/* Combobox Dropdown Popover */}
                    {isCategoryOpen && (
                      <div className="absolute top-[calc(100%+6px)] left-0 right-0 z-30 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-2xl p-2.5 animate-in fade-in zoom-in-95 duration-100">
                        {/* Search Input */}
                        <div className="relative mb-2">
                          <Search
                            size={14}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted-grey)]"
                          />
                          <input
                            type="text"
                            placeholder="Type to filter categories fast..."
                            value={categorySearch}
                            onChange={(e) => setCategorySearch(e.target.value)}
                            autoFocus
                            className="w-full pl-9 pr-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-secondary)] text-xs text-[var(--color-espresso)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]/20"
                          />
                        </div>

                        {/* List */}
                        <div className="max-h-56 overflow-y-auto space-y-1">
                          {filteredCategories.length > 0 ? (
                            filteredCategories.map((c) => (
                              <div
                                key={c._id}
                                onClick={() => {
                                  setFormData((prev) => ({ ...prev, category: c._id }));
                                  setErrors((prev) => ({ ...prev, category: "" }));
                                  setIsCategoryOpen(false);
                                  setCategorySearch("");
                                }}
                                className={`flex items-center gap-2.5 p-2.5 rounded-xl cursor-pointer text-xs transition-colors ${
                                  formData.category === c._id
                                    ? "bg-indigo-500/10 text-indigo-600 font-bold"
                                    : "hover:bg-[var(--color-surface-hover)] text-[var(--color-espresso)]"
                                }`}
                              >
                                <span className="text-base">{c.icon || "📦"}</span>
                                <span className="font-semibold">{c.name}</span>
                              </div>
                            ))
                          ) : (
                            <p className="text-xs text-[var(--color-muted-grey)] py-4 text-center">
                              No categories matching "{categorySearch}"
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  {errors.category && (
                    <p className="text-xs text-rose-500 font-medium">{errors.category}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-[var(--color-espresso)] flex items-center gap-1">
                      Listing Description <span className="text-[var(--color-terracotta)]" aria-hidden="true">*</span>
                    </label>
                    <AiDescriptionButton
                      title={formData.title}
                      categoryName={selectedCategoryDoc?.name || ""}
                      features={formData.amenitiesInput}
                      location={formData.location}
                      onGenerated={(generatedText) => {
                        setFormData((prev) => ({ ...prev, description: generatedText }));
                        if (errors.description) {
                          setErrors((prev) => ({ ...prev, description: "" }));
                        }
                      }}
                    />
                  </div>

                  <Textarea
                    name="description"
                    rows={6}
                    placeholder="Describe condition, technical specifications, what's included (chargers, batteries, cases, accessories), and best use cases..."
                    value={formData.description}
                    onChange={handleChange}
                    error={errors.description}
                    helperText="Minimum 20 characters. Include all included accessories, cables, and packaging directly here in the description."
                    required
                  />
                </div>
              </div>
            )}

            {/* Step 2: Location & Interactive Map Pin */}
            {currentStep === 2 && (
              <div className="flex flex-col gap-5">
                <div>
                  <h2 className="text-xl font-bold text-[var(--color-espresso)]">
                    Step 2: Pickup Location &amp; Map Coordinates
                  </h2>
                  <p className="text-xs text-[var(--color-muted-grey)] mt-0.5">
                    Search your location, use browser GPS, or click directly on the interactive map to set your rental pin.
                  </p>
                </div>

                <MapPicker
                  location={formData.location}
                  coordinates={formData.coordinates}
                  onChange={({ location, coordinates }) => {
                    setFormData((prev) => ({
                      ...prev,
                      location,
                      coordinates,
                    }));
                    if (errors.location) {
                      setErrors((prev) => ({ ...prev, location: "" }));
                    }
                  }}
                />

                <Input
                  label="Pickup Location / Area Address (as displayed to renters)"
                  name="location"
                  placeholder="e.g. Indiranagar, Bengaluru, Karnataka"
                  value={formData.location}
                  onChange={handleChange}
                  error={errors.location}
                  helperText="Automatically updated from the map pin above, or refine the text address manually."
                  required
                />
              </div>
            )}

            {/* Step 3: Photos */}
            {currentStep === 3 && (
              <div className="flex flex-col gap-5">
                <div>
                  <h2 className="text-xl font-bold text-[var(--color-espresso)]">
                    Step 3: High-Resolution Photos
                  </h2>
                  <p className="text-xs text-[var(--color-muted-grey)] mt-0.5">
                    Stage photos to preview them first, then confirm upload to Cloudinary CDN. Add up to 8 photos.
                  </p>
                </div>

                <ImageUploader
                  images={images}
                  onChange={(newImages) => {
                    setImages(newImages);
                    setErrors((prev) => ({ ...prev, images: "" }));
                  }}
                  maxImages={8}
                  error={errors.images}
                />
              </div>
            )}

            {/* Step 4: Pricing & Security Deposit */}
            {currentStep === 4 && (
              <div className="flex flex-col gap-5">
                <div>
                  <h2 className="text-xl font-bold text-[var(--color-espresso)]">
                    Step 4: Pricing &amp; Rental Rules
                  </h2>
                  <p className="text-xs text-[var(--color-muted-grey)] mt-0.5">
                    Set your daily rental rate, refundable security deposit, and verification rules.
                  </p>
                </div>

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

                {/* Advanced Pricing Engine (Tiered Discounts, Weekend Rate, Duration Limits) */}
                <div className="p-4 rounded-2xl bg-[var(--color-surface-secondary)]/50 border border-[var(--color-border)] space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-[var(--color-espresso)]">
                        Dynamic Pricing &amp; Duration Rules
                      </h3>
                      <p className="text-xs text-[var(--color-muted-grey)]">
                        Set custom weekend rates, duration discounts, and rental duration limits.
                      </p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                      Smart Engine
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Input
                      label="Weekend Rate / Day (₹)"
                      name="weekendPricePerDay"
                      type="number"
                      min="0"
                      placeholder="e.g. 1200 (optional)"
                      value={formData.weekendPricePerDay}
                      onChange={handleChange}
                      helperText="Applied for Fri, Sat &amp; Sun"
                    />

                    <Input
                      label="Weekly Discount (%)"
                      name="weeklyDiscountPercentage"
                      type="number"
                      min="0"
                      max="80"
                      placeholder="e.g. 10 (≥ 7 days)"
                      value={formData.weeklyDiscountPercentage}
                      onChange={handleChange}
                      error={errors.weeklyDiscountPercentage}
                      helperText="For rentals 7 days or longer"
                    />

                    <Input
                      label="Monthly Discount (%)"
                      name="monthlyDiscountPercentage"
                      type="number"
                      min="0"
                      max="80"
                      placeholder="e.g. 25 (≥ 30 days)"
                      value={formData.monthlyDiscountPercentage}
                      onChange={handleChange}
                      error={errors.monthlyDiscountPercentage}
                      helperText="For rentals 30 days or longer"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-[var(--color-border-subtle)]">
                    <Input
                      label="Min Rental Duration (Days)"
                      name="minRentalDays"
                      type="number"
                      min="1"
                      placeholder="1"
                      value={formData.minRentalDays}
                      onChange={handleChange}
                      error={errors.minRentalDays}
                      helperText="Minimum consecutive days required"
                    />

                    <Input
                      label="Max Rental Duration (Days)"
                      name="maxRentalDays"
                      type="number"
                      min="1"
                      placeholder="90"
                      value={formData.maxRentalDays}
                      onChange={handleChange}
                      error={errors.maxRentalDays}
                      helperText="Maximum allowable reservation length"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--color-espresso)] mb-1.5">
                    Initial Availability
                  </label>
                  <select
                    name="availability"
                    value={formData.availability}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-espresso)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]/20 font-medium"
                  >
                    <option value="available">Available Immediately</option>
                    <option value="unavailable">Paused / Unavailable</option>
                  </select>
                </div>

                <Textarea
                  label="Rental Rules & Verification Requirements"
                  name="rules"
                  rows={3}
                  value={formData.rules}
                  onChange={handleChange}
                  helperText="Specify Govt ID requirements, return timings, or usage restrictions."
                />
              </div>
            )}

            {/* Step 5: Live Summary Preview */}
            {currentStep === 5 && (
              <div className="flex flex-col gap-6">
                <div>
                  <h2 className="text-xl font-bold text-[var(--color-espresso)] mb-1">
                    Step 5: Review &amp; Publish
                  </h2>
                  <p className="text-xs text-[var(--color-muted-grey)]">
                    Live preview of your listing. Verify all specifications, location coordinates, and pricing before publishing.
                  </p>
                </div>

                {/* The Interactive Preview Card */}
                <div className="max-w-sm mx-auto w-full">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted-grey)] mb-2 flex items-center justify-between">
                    <span>Listing Card Preview</span>
                    <span className="text-emerald-600 bg-emerald-500/10 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                      Ready to List
                    </span>
                  </div>
                  <ListingCard listing={previewListing} isPreview={true} />
                </div>

                {/* Full Specifications Breakdown */}
                <div className="bg-[var(--color-surface-secondary)] border border-[var(--color-border)] p-6 rounded-2xl text-xs space-y-3 text-[var(--color-espresso)]">
                  <h3 className="font-bold text-sm text-[var(--color-espresso)] border-b border-[var(--color-border-subtle)] pb-2 flex items-center gap-2">
                    <Sparkles size={16} className="text-[var(--color-brand-primary)]" />
                    Listing Details Summary
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
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
                      <span className="text-[var(--color-muted-grey)] block">Pickup Location &amp; Coordinates:</span>
                      <span className="font-semibold text-[var(--color-espresso)] flex items-center gap-1.5 mt-0.5">
                        <MapPin size={13} className="text-rose-500" />
                        <span>{formData.location || "Not specified"}</span>
                        {formData.coordinates?.lat && (
                          <span className="font-mono text-[10px] text-[var(--color-muted-grey)]">
                            ({formData.coordinates.lat.toFixed(4)}°, {formData.coordinates.lng.toFixed(4)}°)
                          </span>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Rules */}
                  {formData.rules && (
                    <div className="pt-2 border-t border-[var(--color-border-subtle)]">
                      <span className="text-[var(--color-muted-grey)] block mb-1 font-semibold">Rental Terms &amp; Rules:</span>
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
                  List Item Now
                </Button>
              )}
            </div>
          </Card>
        </div>
      </Container>
    </div>
  );
}
