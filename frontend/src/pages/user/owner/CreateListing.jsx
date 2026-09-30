import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Check,
  ArrowRight,
  ArrowLeft,
  Plus,
  Trash2,
  Sparkles,
} from "lucide-react";
import api from "../../../utils/api";
import { POPULAR_CATEGORIES } from "../../../utils/mockData";
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
  { id: 3, title: "Photos", sub: "High-resolution photos" },
  { id: 4, title: "Pricing & Rules", sub: "Rate & deposit" },
  { id: 5, title: "Preview & Publish", sub: "Final review" },
];

export default function CreateListing() {
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "Apartments",
    location: "",
    amenitiesInput: "High-speed WiFi, Air Conditioning, Free Parking",
    rentalPricePerDay: 1500,
    deposit: 3000,
    availability: "available",
    rules: "Valid Govt ID required at handover. Return in original clean condition.",
  });

  // Photos state
  const [images, setImages] = useState([
    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&auto=format&fit=crop&q=80",
  ]);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleAddImage = () => {
    if (!newImageUrl.trim()) return;
    setImages((prev) => [...prev, newImageUrl.trim()]);
    setNewImageUrl("");
    setErrors((prev) => ({ ...prev, images: "" }));
  };

  const handleRemoveImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

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
        errs.location = "Please enter a valid city or area.";
      }
    } else if (step === 3) {
      if (images.length === 0) {
        errs.images = "Please provide at least one photo URL for your listing.";
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

  const handlePublish = async () => {
    setLoading(true);
    setServerError("");

    try {
      await api.post("/listings", {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        rentalPricePerDay: Number(formData.rentalPricePerDay),
        location: formData.location.trim(),
        images,
        availability: formData.availability,
      });

      navigate("/my-listings", {
        state: { successMessage: `Listing "${formData.title}" published successfully!` },
      });
    } catch (err) {
      setServerError(
        err.response?.data?.message || "Failed to publish listing. Please verify required fields."
      );
    } finally {
      setLoading(false);
    }
  };

  // Preview Object for Step 5
  const previewListing = {
    title: formData.title || "Sample Title",
    category: formData.category,
    rentalPricePerDay: Number(formData.rentalPricePerDay) || 1500,
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
                  placeholder="e.g. Sony FX3 Cinema Camera + 24-70mm G-Master Lens"
                  value={formData.title}
                  onChange={handleChange}
                  error={errors.title}
                  helperText="Use a descriptive, clear title mentioning brand and key features."
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
                  {POPULAR_CATEGORIES.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.icon} {c.name}
                    </option>
                  ))}
                </Select>

                <Textarea
                  label="Listing Description"
                  name="description"
                  rows={5}
                  placeholder="Describe condition, specifications, what it's best for, and any inclusions..."
                  value={formData.description}
                  onChange={handleChange}
                  error={errors.description}
                  helperText="Minimum 20 characters. Detailed listings attract 3x more bookings."
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
                  helperText="Renters will use this to find rentals near them."
                  required
                />

                <Input
                  label="What's Included (Comma separated)"
                  name="amenitiesInput"
                  placeholder="e.g. Charger, Extra battery, Carry case, Lens hood"
                  value={formData.amenitiesInput}
                  onChange={handleChange}
                  helperText="List accessories, chargers, cases, or amenities included with the rental."
                />
              </div>
            )}

            {/* Step 3: Photos */}
            {currentStep === 3 && (
              <div className="flex flex-col gap-5">
                <h2 className="text-lg font-bold text-[var(--color-espresso)]">Step 3: High-Resolution Photos</h2>

                <div className="flex gap-2">
                  <Input
                    placeholder="Paste image URL (e.g. https://images.unsplash.com/...)"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    error={errors.images}
                  />
                  <Button variant="primary" onClick={handleAddImage} icon={Plus}>
                    Add
                  </Button>
                </div>

                <div className="text-xs text-[var(--color-muted-grey)]">
                  Added {images.length} photo{images.length !== 1 ? "s" : ""}:
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {images.map((img, idx) => (
                    <div key={idx} className="relative rounded-xl overflow-hidden border border-[var(--color-border)] group">
                      <img src={img} alt={`Preview ${idx + 1}`} className="w-full h-24 object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="absolute top-1.5 right-1.5 bg-black/70 text-white rounded-full w-6 h-6 grid place-items-center cursor-pointer hover:bg-red-600 transition-colors"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
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
                    value={formData.deposit}
                    onChange={handleChange}
                    helperText="Refunded to renter upon safe return."
                    required
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
                  <h2 className="text-lg font-bold text-[var(--color-espresso)] mb-1">Step 5: Review & Publish</h2>
                  <p className="text-xs text-[var(--color-muted-grey)]">
                    Here is how your rental card will appear to prospective renters on RentHub.
                  </p>
                </div>

                <div className="max-w-xs mx-auto w-full">
                  <ListingCard listing={previewListing} />
                </div>

                <div className="bg-[var(--color-surface-secondary)] p-4 rounded-xl text-xs space-y-1 text-[var(--color-espresso)] leading-relaxed">
                  <div><strong>Title:</strong> {formData.title}</div>
                  <div><strong>Daily Rate:</strong> ₹{Number(formData.rentalPricePerDay).toLocaleString("en-IN")}/day</div>
                  <div><strong>Refundable Deposit:</strong> ₹{Number(formData.deposit).toLocaleString("en-IN")}</div>
                  <div><strong>Location:</strong> {formData.location}</div>
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
