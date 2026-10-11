const multer = require("multer");

// Keep images in memory buffers so they can be streamed directly to Cloudinary
const storage = multer.memoryStorage();

// Validate image file formats
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/avif",
    "image/jpg",
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Unsupported file type: ${file.mimetype}. Allowed types: JPG, PNG, WEBP, AVIF.`
      ),
      false
    );
  }
};

// Configure Multer instance
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max per file
    files: 10, // Max 10 files per request
  },
});

// Middleware for multiple images
exports.uploadMultipleImages = upload.array("images", 10);

// Middleware for single image (e.g. avatar or single upload)
exports.uploadSingleImage = upload.single("image");
