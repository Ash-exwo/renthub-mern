import React, { useState, useRef, useEffect } from "react";
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
  X,
  FileCheck,
} from "lucide-react";
import api from "../utils/api";
import { Button, Input } from "./ui";

export default function ImageUploader({
  images = [],
  onChange,
  maxImages = 8,
  error = "",
}) {
  const [stagedFiles, setStagedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const fileInputRef = useRef(null);

  const availableSlots = maxImages - images.length - stagedFiles.length;

  // Revoke object URLs on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      stagedFiles.forEach((item) => {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      });
    };
  }, []);

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Stage files locally for user preview and acknowledgement
  const handleStageFiles = (fileList) => {
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
        `You can only stage ${Math.max(0, availableSlots)} more photo(s). Maximum is ${maxImages}.`
      );
      return;
    }

    // Check size limit (10MB)
    const oversized = files.find((f) => f.size > 10 * 1024 * 1024);
    if (oversized) {
      setUploadError(`File "${oversized.name}" exceeds the 10MB size limit.`);
      return;
    }

    const newStaged = files.map((file) => ({
      id: `${file.name}-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      file,
      previewUrl: URL.createObjectURL(file),
      name: file.name,
      sizeFormatted: formatFileSize(file.size),
    }));

    setStagedFiles((prev) => [...prev, ...newStaged]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemoveStaged = (id) => {
    setStagedFiles((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((item) => item.id !== id);
    });
  };

  const handleClearStaged = () => {
    stagedFiles.forEach((item) => {
      if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
    });
    setStagedFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Explicit confirmation: Upload staged files to Cloudinary
  const handleConfirmUpload = async () => {
    if (stagedFiles.length === 0) return;
    setUploadError("");
    setUploading(true);
    setUploadProgress(`Uploading ${stagedFiles.length} photo(s) to Cloudinary...`);

    try {
      const formData = new FormData();
      stagedFiles.forEach((item) => {
        formData.append("images", item.file);
      });

      const res = await api.post("/upload/images", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (res.data?.urls && Array.isArray(res.data.urls)) {
        onChange([...images, ...res.data.urls]);
        // Clean up staged previews
        stagedFiles.forEach((item) => {
          if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
        });
        setStagedFiles([]);
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
    handleStageFiles(e.target.files);
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
      handleStageFiles(e.dataTransfer.files);
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
      {availableSlots > 0 && !uploading && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all ${
            isDragging
              ? "border-indigo-600 bg-indigo-50/20 scale-[1.01]"
              : "border-[var(--color-border)] hover:border-indigo-500/50 bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)]"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            multiple
            onChange={handleFileInputChange}
            className="hidden"
          />

          <div className="flex flex-col items-center justify-center gap-2">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 grid place-items-center mb-1">
              <CloudUpload size={26} />
            </div>

            <div className="font-extrabold text-sm sm:text-base text-[var(--color-espresso)]">
              Choose photos or{" "}
              <span className="text-indigo-600 hover:underline">browse from device</span>
            </div>

            <p className="text-xs text-[var(--color-muted-grey)] max-w-md">
              Select photos to preview and confirm before sending to Cloudinary CDN. High-resolution files up to 10MB each (JPG, PNG, WEBP).
            </p>

            <div className="mt-2 text-[11px] font-bold px-3 py-1 rounded-full bg-[var(--color-surface-secondary)] text-[var(--color-muted-grey)] border border-[var(--color-border)]">
              {images.length + stagedFiles.length} / {maxImages} slots used ({availableSlots} remaining)
            </div>
          </div>
        </div>
      )}

      {/* Uploading progress indicator */}
      {uploading && (
        <div className="border border-indigo-500/30 bg-indigo-500/5 rounded-2xl p-6 text-center flex flex-col items-center justify-center gap-2">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          <div className="font-extrabold text-sm text-[var(--color-espresso)]">
            {uploadProgress}
          </div>
          <p className="text-xs text-[var(--color-muted-grey)]">
            Optimizing images and uploading to Cloudinary CDN...
          </p>
        </div>
      )}

      {/* STAGED FILES PREVIEW & CONFIRMATION BOX */}
      {stagedFiles.length > 0 && !uploading && (
        <div className="p-4 sm:p-5 rounded-2xl border-2 border-indigo-500/30 bg-indigo-500/5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <FileCheck size={18} className="text-indigo-600 dark:text-indigo-400" />
              <h4 className="font-extrabold text-sm text-[var(--color-espresso)] m-0">
                Staged Photos ({stagedFiles.length}) — Awaiting Upload Confirmation
              </h4>
            </div>

            <button
              type="button"
              onClick={handleClearStaged}
              className="text-xs font-semibold text-[var(--color-muted-grey)] hover:text-rose-600 cursor-pointer"
            >
              Clear All Staged
            </button>
          </div>

          <p className="text-xs text-[var(--color-secondary-text)]">
            Review your selected photos below. When ready, click "Confirm &amp; Upload" to dispatch them to Cloudinary.
          </p>

          {/* Staged Thumbnails Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {stagedFiles.map((item) => (
              <div
                key={item.id}
                className="relative rounded-xl overflow-hidden border border-[var(--color-border)] bg-slate-900 aspect-video shadow-xs group"
              >
                <img
                  src={item.previewUrl}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />

                {/* File size badge */}
                <div className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/70 text-white text-[10px] font-mono backdrop-blur-xs">
                  {item.sizeFormatted}
                </div>

                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => handleRemoveStaged(item.id)}
                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-lg bg-black/70 hover:bg-rose-600 text-white grid place-items-center backdrop-blur-xs transition-colors cursor-pointer"
                  title="Remove staged photo"
                >
                  <X size={13} />
                </button>
              </div>
            ))}
          </div>

          {/* Explicit User Confirmation Action */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-indigo-500/20">
            <span className="text-xs text-[var(--color-muted-grey)]">
              {stagedFiles.length} file{stagedFiles.length === 1 ? "" : "s"} ready for upload
            </span>

            <Button
              type="button"
              variant="primary"
              size="sm"
              icon={CloudUpload}
              onClick={handleConfirmUpload}
              className="w-full sm:w-auto"
            >
              Confirm &amp; Upload {stagedFiles.length} Photo{stagedFiles.length === 1 ? "" : "s"} to Cloudinary
            </Button>
          </div>
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

      {/* Uploaded Photos Gallery (Already on Cloudinary) */}
      {images.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-[var(--color-espresso)]">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-emerald-500" />
              <span>Uploaded Gallery ({images.length} on Cloudinary)</span>
            </span>
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
                        className="px-2 py-0.5 rounded-lg bg-black/60 hover:bg-indigo-600 text-white text-[10px] font-bold backdrop-blur-sm pointer-events-auto transition-colors cursor-pointer"
                        title="Make this the cover photo"
                      >
                        Set as Cover
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleRemove(idx)}
                      className="w-6 h-6 rounded-lg bg-black/60 hover:bg-rose-600 text-white grid place-items-center backdrop-blur-sm pointer-events-auto transition-colors shadow-sm cursor-pointer"
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
                      className="p-1 rounded-lg bg-black/60 hover:bg-black/90 disabled:opacity-30 disabled:cursor-not-allowed text-white backdrop-blur-sm cursor-pointer"
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
                      className="p-1 rounded-lg bg-black/60 hover:bg-black/90 disabled:opacity-30 disabled:cursor-not-allowed text-white backdrop-blur-sm cursor-pointer"
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
