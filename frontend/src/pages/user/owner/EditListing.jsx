import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Save,
  Upload,
  Plus,
  Trash2,
  Image as ImageIcon,
  CheckCircle2,
} from "lucide-react";
import api from "../../../utils/api";
import { getUser } from "../../../utils/auth";
import Container from "../../../components/Container";
import {
  Input,
  Select,
  Textarea,
  Button,
  Card,
} from "../../../components/ui";
import ImageUploader from "../../../components/ImageUploader";

export default function EditListing() {
  const { id } = useParams();
  const navigate = useNavigate();
  const currentUser = getUser();
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState([]);
  const [serverError, setServerError] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    location: "",
    amenitiesInput: "",
    rentalPricePerDay: "",
    deposit: "",
    availability: "available",
    rules: "",
  });

  const [images, setImages] = useState([]);
  const [newImageUrl, setNewImageUrl] = useState("");

  // 1. Fetch Categories & Listing Details
  useEffect(() => {
    async function loadData() {
      try {
        const [catRes, listingRes] = await Promise.all([
          api.get("/categories"),
          api.get(`/listings/${id}`),
        ]);

        if (catRes.data?.categories) {
          setCategories(catRes.data.categories);
        }

        const listing = listingRes.data?.listing;
        if (!listing) {
          setServerError("Listing not found.");
          setLoading(false);
          return;
        }

        // Ownership verification
        const ownerId = typeof listing.owner === "object" ? listing.owner?._id : listing.owner;
        if (currentUser && ownerId && currentUser._id && ownerId.toString() !== currentUser._id.toString()) {
          setServerError("You are not authorized to edit this listing.");
          setLoading(false);
          return;
        }

        const categoryId =
          typeof listing.category === "object" ? listing.category?._id : listing.category;

        setFormData({
          title: listing.title || "",
          description: listing.description || "",
          category: categoryId || "",
          location: listing.location || "",
          amenitiesInput: Array.isArray(listing.amenities)
            ? listing.amenities.join(", ")
            : listing.amenities || "",
          rentalPricePerDay: listing.rentalPricePerDay || "",
          deposit: listing.deposit !== undefined ? listing.deposit : "",
          availability: listing.availability || "available",
          rules: listing.rules || "",
        });

        setImages(Array.isArray(listing.images) ? listing.images : []);
      } catch (err) {
        console.error("Failed to load listing for edit:", err);
        setServerError(err.response?.data?.message || "Failed to load listing details.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validate = () => {
    const errs = {};
    if (!formData.title.trim() || formData.title.trim().length < 5) {
      errs.title = "Title must be at least 5 characters.";
    }
    if (!formData.description.trim() || formData.description.trim().length < 20) {
      errs.description = "Description must be at least 20 characters.";
    }
    if (!formData.category) {
      errs.category = "Please select a category.";
    }
    if (!formData.location.trim() || formData.location.trim().length < 3) {
      errs.location = "Please enter a valid city or pickup area.";
    }
    if (!formData.rentalPricePerDay || Number(formData.rentalPricePerDay) <= 0) {
      errs.rentalPricePerDay = "Enter a valid daily rental price.";
    }
    if (images.length === 0) {
      errs.images = "Please provide at least one photo for your listing.";
    }
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setSaving(true);
    setServerError("");

    const amenitiesArray = formData.amenitiesInput
      ? formData.amenitiesInput
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

    try {
      await api.put(`/listings/${id}`, {
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
      console.error("Listing update error:", err);
      const serverMsg =
        err.response?.data?.message ||
        (err.response?.status === 413
          ? "Photo size is too large. Please upload a smaller photo."
          : err.response?.status === 403
          ? "You are not authorized to update this listing."
          : "Failed to update listing. Please verify required fields.");
      setServerError(serverMsg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-sm text-[var(--color-muted-grey)]">
        Loading listing details...
      </div>
    );
  }

  return (
    <div className="py-8 sm:py-12 min-h-[calc(100vh-180px)]">
      <Container>
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <Link
              to="/my-listings"
              className="text-xs font-semibold text-[var(--color-muted-grey)] hover:text-[var(--color-brand-primary)] inline-flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft size={14} />
              <span>Back to My Listings</span>
            </Link>
          </div>

          <div className="mb-8">
            <h1 className="font-[var(--font-heading)] text-2xl sm:text-3xl font-extrabold text-[var(--color-espresso)]">
              Edit Listing
            </h1>
            <p className="text-xs sm:text-sm text-[var(--color-muted-grey)] mt-1">
              Update pricing, specifications, photos, and availability for your rental asset.
            </p>
          </div>

          {serverError && (
            <div
              className="p-3.5 rounded-xl bg-red-500/10 text-red-600 border border-red-500/25 text-xs font-medium mb-6"
              role="alert"
            >
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <Card padding="lg" variant="elevated" className="space-y-6">
              {/* Section 1: Basic Information */}
              <div className="space-y-4">
                <h2 className="text-base font-bold text-[var(--color-espresso)] border-b border-[var(--color-border-subtle)] pb-2">
                  Basic Information
                </h2>

                <Input
                  label="Listing Title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  error={errors.title}
                  placeholder="e.g. Sony Alpha A7 IV Mirrorless Camera Kit"
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
                  value={formData.description}
                  onChange={handleChange}
                  error={errors.description}
                  placeholder="Describe condition, specifications, and what is included..."
                  required
                />
              </div>

              {/* Section 2: Location & Specifications */}
              <div className="space-y-4 pt-2">
                <h2 className="text-base font-bold text-[var(--color-espresso)] border-b border-[var(--color-border-subtle)] pb-2">
                  Location & Inclusions
                </h2>

                <Input
                  label="Pickup Location / Area"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  error={errors.location}
                  placeholder="e.g. Marine Drive, Kochi"
                  required
                />

                <Input
                  label="What's Included (Comma separated)"
                  name="amenitiesInput"
                  value={formData.amenitiesInput}
                  onChange={handleChange}
                  placeholder="e.g. Charger, Extra battery, Lens hood, Case"
                  helperText="List accessories or items included with the rental."
                />
              </div>

              {/* Section 3: High-Resolution Photos */}
              <div className="space-y-4 pt-2">
                <h2 className="text-base font-bold text-[var(--color-espresso)] border-b border-[var(--color-border-subtle)] pb-2">
                  Photos
                </h2>
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

              {/* Section 4: Pricing, Deposit & Rules */}
              <div className="space-y-4 pt-2">
                <h2 className="text-base font-bold text-[var(--color-espresso)] border-b border-[var(--color-border-subtle)] pb-2">
                  Pricing & Rules
                </h2>

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
                    helperText="Refunded upon safe return."
                  />
                </div>

                <Select
                  label="Availability Status"
                  name="availability"
                  value={formData.availability}
                  onChange={handleChange}
                >
                  <option value="available">Active & Available for Rent</option>
                  <option value="unavailable">Paused / Unavailable</option>
                </Select>

                <Textarea
                  label="Rental Rules & Verification"
                  name="rules"
                  rows={3}
                  value={formData.rules}
                  onChange={handleChange}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between items-center pt-6 border-t border-[var(--color-border-subtle)]">
                <Link to="/my-listings">
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>

                <Button type="submit" variant="primary" loading={saving} icon={Save}>
                  Save Changes
                </Button>
              </div>
            </Card>
          </form>
        </div>
      </Container>
    </div>
  );
}
