import React, { useState, useRef } from "react";
import {
  Upload,
  CloudUpload,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Star,
  Plus,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Image as ImageIcon,
} from "lucide-react";
import api from "../utils/api";
import { Button, Input } from "./ui";

export default function ImageUploader({
  images = [],
  onChange,
  maxImages = 8,
  error = "",
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const fileInputRef = useRef(null);

  const availableSlots = maxImages - images.length;

  const handleUploadFiles = async (fileList) => {
    if (!fileList || fileList.length === 0) return;
    setUploadError("");

    // Filter only images
    const files = Array.from(fileList).filter((f) => f.type.startsWith("image/"));
    if (files.length === 0) {
      setUploadError("Please select valid image files (JPG, PNG, WEBP, AVIF).");
      return;
    }

    if (files.length > availableSlots) {
      setUploadError(
        `You can only add ${availableSlots} more photo(s). Maximum is ${maxImages}.`
      );
      return;
    }

    // Check size limit (10MB)
    const oversized = files.find((f) => f.size > 10 * 1024 * 1024);
    if (oversized) {
      setUploadError(`File "${oversized.name}" exceeds the 10MB size limit.`);
      return;
    }

    setUploading(true);
    setUploadProgress(`Uploading ${files.length} photo(s) to Cloudinary...`);

    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append("images", file);
      });

      const res = await api.post("/upload/images", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (res.data?.urls && Array.isArray(res.data.urls)) {
        onChange([...images, ...res.data.urls]);
      }
    } catch (err) {
      console.error("Upload error:", err);
      setUploadError(
        err.response?.data?.message ||
          "Failed to upload images to Cloudinary. Please check your network and try again."
      );
    } finally {
      setUploading(false);
      setUploadProgress("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleFileInputChange = (e) => {
    handleUploadFiles(e.target.files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!uploading && availableSlots > 0) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (!uploading && availableSlots > 0) {
      handleUploadFiles(e.dataTransfer.files);
    }
  };

  const handleRemove = (index) => {
    const targetUrl = images[index];
    // If it's a Cloudinary URL, asynchronously request deletion
    if (targetUrl && targetUrl.includes("cloudinary.com")) {
      api.delete("/upload/image", { data: { imageUrl: targetUrl } }).catch(() => {});
    }
    onChange(images.filter((_, i) => i !== index));
  };

  const handleMove = (fromIndex, toIndex) => {
    if (toIndex < 0 || toIndex >= images.length) return;
    const updated = [...images];
    const item = updated.splice(fromIndex, 1)[0];
    updated.splice(toIndex, 0, item);
    onChange(updated);
  };

  const handleSetCover = (index) => {
    if (index === 0) return;
    const updated = [...images];
    const item = updated.splice(index, 1)[0];
    updated.unshift(item);
    onChange(updated);
  };

  const handleAddUrl = () => {
    const url = urlInput.trim();
    if (!url) return;
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      setUploadError("Please provide a valid web link starting with http:// or https://");
      return;
    }
    if (availableSlots <= 0) {
      setUploadError(`Maximum of ${maxImages} images reached.`);
      return;
    }
    setUploadError("");
    onChange([...images, url]);
    setUrlInput("");
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Upload Dropzone */}
      {availableSlots > 0 && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all ${
            isDragging
              ? "border-indigo-600 bg-indigo-50/20 scale-[1.01]"
              : "border-[var(--color-border)] hover:border-indigo-500/50 bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)]"
          } ${uploading ? "pointer-events-none opacity-70" : ""}`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            multiple
            onChange={handleFileInputChange}
            className="hidden"
          />

          {uploading ? (
            <div className="flex flex-col items-center justify-center gap-2 py-2">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
              <div className="font-extrabold text-sm text-[var(--color-espresso)]">
                {uploadProgress}
              </div>
              <p className="text-xs text-[var(--color-muted-grey)]">
                Optimizing and delivering to Cloudinary CDN
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 grid place-items-center mb-1">
                <CloudUpload size={26} />
              </div>

              <div className="font-extrabold text-sm sm:text-base text-[var(--color-espresso)]">
                Drag and drop your photos here, or{" "}
                <span className="text-indigo-600 hover:underline">browse files</span>
              </div>

              <p className="text-xs text-[var(--color-muted-grey)] max-w-md">
                High-resolution images up to 10MB each (JPG, PNG, WEBP). Photos are automatically optimized on Cloudinary CDN.
              </p>

              <div className="mt-2 text-[11px] font-bold px-3 py-1 rounded-full bg-[var(--color-surface-secondary)] text-[var(--color-muted-grey)] border border-[var(--color-border)]">
                {images.length} / {maxImages} photos uploaded ({availableSlots} remaining)
              </div>
            </div>
          )}
        </div>
      )}

      {/* Or Paste Direct Image URL */}
      {availableSlots > 0 && !uploading && (
        <div className="flex gap-2">
          <Input
            placeholder="Or paste an image URL (https://...)"
            value={urlInput}
            onChange={(e) => {
              setUrlInput(e.target.value);
              setUploadError("");
            }}
            className="flex-1"
          />
          <Button variant="outline" onClick={handleAddUrl} icon={Plus}>
            Add URL
          </Button>
        </div>
      )}

      {/* Errors */}
      {(uploadError || error) && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
          <AlertCircle size={15} className="shrink-0" />
          <span>{uploadError || error}</span>
        </div>
      )}

      {/* Uploaded Photos Grid */}
      {images.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-[var(--color-espresso)]">
            <span>Uploaded Gallery ({images.length})</span>
            <span className="text-[11px] text-[var(--color-muted-grey)]">
              Slot #1 is used as your primary cover photo
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {images.map((url, idx) => {
              const isCover = idx === 0;

              return (
                <div
                  key={`${url}-${idx}`}
                  className="relative rounded-2xl overflow-hidden border border-[var(--color-border)] group bg-slate-900 aspect-video shadow-sm"
                >
                  <img
                    src={url}
                    alt={`Listing photo ${idx + 1}`}
                    className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src =
                        "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800";
                    }}
                  />

                  {/* Top Badges & Actions */}
                  <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none">
                    {isCover ? (
                      <span className="px-2 py-0.5 rounded-lg bg-indigo-600 text-white text-[10px] font-extrabold shadow-md pointer-events-auto flex items-center gap-1">
                        <Star size={10} className="fill-white" />
                        <span>Cover Photo</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSetCover(idx)}
                        className="px-2 py-0.5 rounded-lg bg-black/60 hover:bg-indigo-600 text-white text-[10px] font-bold backdrop-blur-sm pointer-events-auto transition-colors"
                        title="Make this the cover photo"
                      >
                        Set as Cover
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleRemove(idx)}
                      className="w-6 h-6 rounded-lg bg-black/60 hover:bg-rose-600 text-white grid place-items-center backdrop-blur-sm pointer-events-auto transition-colors shadow-sm"
                      title="Delete photo"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>

                  {/* Bottom Navigation Controls (Reorder) */}
                  <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMove(idx, idx - 1)}
                      className="p-1 rounded-lg bg-black/60 hover:bg-black/90 disabled:opacity-30 disabled:cursor-not-allowed text-white backdrop-blur-sm"
                      title="Move photo left"
                    >
                      <ChevronLeft size={14} />
                    </button>

                    <span className="text-[10px] font-extrabold text-white bg-black/50 px-1.5 py-0.5 rounded-md backdrop-blur-sm">
                      {idx + 1}
                    </span>

                    <button
                      type="button"
                      disabled={idx === images.length - 1}
                      onClick={() => handleMove(idx, idx + 1)}
                      className="p-1 rounded-lg bg-black/60 hover:bg-black/90 disabled:opacity-30 disabled:cursor-not-allowed text-white backdrop-blur-sm"
                      title="Move photo right"
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
