const express = require("express");
const router = express.Router();
const uploadController = require("../controllers/uploadController");
const { uploadMultipleImages } = require("../middleware/uploadMiddleware");
const { protectUser } = require("../middleware/userAuthMiddleware");

// All upload routes require authenticated user
router.use(protectUser);

// Wrapper to handle Multer upload errors cleanly
const handleMulterUpload = (req, res, next) => {
  uploadMultipleImages(req, res, (err) => {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res
          .status(400)
          .json({ message: "File too large. Maximum size allowed is 10MB per image." });
      }
      if (err.code === "LIMIT_FILE_COUNT") {
        return res
          .status(400)
          .json({ message: "Too many files. You can upload a maximum of 10 images at once." });
      }
      return res.status(400).json({ message: err.message || "File upload validation failed." });
    }
    next();
  });
};

// POST /api/upload/images
router.post("/images", handleMulterUpload, uploadController.uploadImages);

// DELETE /api/upload/image
router.delete("/image", uploadController.deleteImage);

module.exports = router;
