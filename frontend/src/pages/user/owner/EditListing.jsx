import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Save,
  Search,
  ChevronDown,
  MapPin,
  Check,
} from "lucide-react";
import api from "../../../utils/api";
import { getUser } from "../../../utils/auth";
import Container from "../../../components/Container";
import {
  Input,
  Textarea,
  Button,
  Card,
} from "../../../components/ui";
import ImageUploader from "../../../components/ImageUploader";
import MapPicker from "../../../components/MapPicker";
import AiDescriptionButton from "../../../components/AiDescriptionButton";

export default function EditListing() {
  const { id } = useParams();
  const navigate = useNavigate();
  const currentUser = getUser();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState([]);
  const [serverError, setServerError] = useState("");
  const [errors, setErrors] = useState({});

  // Category combobox state
  const [categorySearch, setCategorySearch] = useState("");
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const categoryDropdownRef = useRef(null);

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
    rules: "",
  });

  const [images, setImages] = useState([]);

  // Fetch Categories & Listing Details
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
          coordinates: listing.coordinates || null,
          rentalPricePerDay: listing.rentalPricePerDay || "",
          deposit: listing.deposit !== undefined ? listing.deposit : "",
          weekendPricePerDay: listing.weekendPricePerDay !== undefined && listing.weekendPricePerDay !== null ? listing.weekendPricePerDay : "",
          weeklyDiscountPercentage: listing.weeklyDiscountPercentage !== undefined && listing.weeklyDiscountPercentage !== null ? listing.weeklyDiscountPercentage : "",
          monthlyDiscountPercentage: listing.monthlyDiscountPercentage !== undefined && listing.monthlyDiscountPercentage !== null ? listing.monthlyDiscountPercentage : "",
          minRentalDays: listing.minRentalDays || "1",
          maxRentalDays: listing.maxRentalDays || "90",
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
      errs.location = "Please enter or pin a valid city or pickup area on the map.";
    }
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

    try {
      await api.put(`/listings/${id}`, {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        rentalPricePerDay: Number(formData.rentalPricePerDay),
        deposit: Number(formData.deposit || 0),
        weekendPricePerDay: formData.weekendPricePerDay !== "" && formData.weekendPricePerDay !== undefined ? Number(formData.weekendPricePerDay) : undefined,
        weeklyDiscountPercentage: formData.weeklyDiscountPercentage !== "" ? Number(formData.weeklyDiscountPercentage) : 0,
        monthlyDiscountPercentage: formData.monthlyDiscountPercentage !== "" ? Number(formData.monthlyDiscountPercentage) : 0,
        minRentalDays: formData.minRentalDays ? Math.max(1, Number(formData.minRentalDays)) : 1,
        maxRentalDays: formData.maxRentalDays ? Math.max(1, Number(formData.maxRentalDays)) : 90,
        rules: formData.rules.trim(),
        location: formData.location.trim(),
        coordinates: formData.coordinates,
        images,
        availability: formData.availability,
        amenities: [],
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
          : "Failed to update listing. Please check required fields and network connection.");
      setServerError(serverMsg);
    } finally {
      setSaving(false);
    }
  };

  const selectedCategoryDoc = categories.find((c) => c._id === formData.category);
  const filteredCategories = categories.filter((cat) =>
    (cat.name || "").toLowerCase().includes(categorySearch.toLowerCase())
  );

  if (loading) {
    return (
      <Container>
        <div className="py-24 text-center text-xs text-[var(--color-muted-grey)]">
          Loading listing details for editing...
        </div>
      </Container>
    );
  }

  return (
    <div className="py-8 sm:py-12 min-h-[calc(100vh-180px)]">
      <Container>
        <div className="max-w-4xl mx-auto">
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
              Update pricing, specifications, map coordinates, photos, and availability for your rental asset.
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
            <Card padding="lg" variant="elevated" className="space-y-6 border border-[var(--color-border)] shadow-xl rounded-3xl">
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
                          Click to search and select category...
                        </span>
                        <ChevronDown size={16} className="text-[var(--color-muted-grey)]" />
                      </div>
                    )}

                    {/* Combobox Dropdown Popover */}
                    {isCategoryOpen && (
                      <div className="absolute top-[calc(100%+6px)] left-0 right-0 z-30 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-2xl p-2.5 animate-in fade-in zoom-in-95 duration-100">
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
                      features={formData.rules}
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
                    value={formData.description}
                    onChange={handleChange}
                    error={errors.description}
                    placeholder="Describe condition, specifications, what's included (accessories, chargers, cases), and usage guidelines..."
                    helperText="Minimum 20 characters. Include all included accessories, chargers, and cases directly here."
                    required
                  />
                </div>
              </div>

              {/* Section 2: Location & Interactive Map Coordinates */}
              <div className="space-y-4 pt-2">
                <h2 className="text-base font-bold text-[var(--color-espresso)] border-b border-[var(--color-border-subtle)] pb-2">
                  Pickup Location &amp; Map Coordinates
                </h2>

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
                  value={formData.location}
                  onChange={handleChange}
                  error={errors.location}
                  placeholder="e.g. Indiranagar, Bengaluru, Karnataka"
                  helperText="Auto-populated from map pin above, or refine manually."
                  required
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
                  Pricing &amp; Rules
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
                    Availability Status
                  </label>
                  <select
                    name="availability"
                    value={formData.availability}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-espresso)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]/20 font-medium"
                  >
                    <option value="available">Active &amp; Available for Rent</option>
                    <option value="unavailable">Paused / Unavailable</option>
                  </select>
                </div>

                <Textarea
                  label="Rental Rules &amp; Verification"
                  name="rules"
                  rows={3}
                  value={formData.rules}
                  onChange={handleChange}
                  helperText="ID requirements or handover timings."
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
