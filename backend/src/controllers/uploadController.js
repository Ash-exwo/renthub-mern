const cloudinary = require("../config/cloudinary");
const { Readable } = require("stream");

/**
 * Stream an in-memory file buffer directly to Cloudinary
 */
function streamUploadToCloudinary(buffer, folder = "renthub/listings") {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        quality: "auto:good",
        fetch_format: "auto",
        transformation: [
          { width: 1600, crop: "limit" }, // limit high-res images to max 1600px width
        ],
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }
        resolve({
          url: result.secure_url,
          public_id: result.public_id,
          format: result.format,
          bytes: result.bytes,
          width: result.width,
          height: result.height,
        });
      }
    );

    const readable = new Readable();
    readable.push(buffer);
    readable.push(null);
    readable.pipe(uploadStream);
  });
}

/**
 * POST /api/upload/images
 * Upload up to 10 image files to Cloudinary CDN
 */
exports.uploadImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No image files were provided for upload." });
    }

    // Upload all files in parallel
    const uploadPromises = req.files.map((file) =>
      streamUploadToCloudinary(file.buffer, "renthub/listings")
    );

    const uploadedResults = await Promise.all(uploadPromises);

    return res.status(200).json({
      message: `Successfully uploaded ${uploadedResults.length} image(s) to Cloudinary.`,
      images: uploadedResults,
      urls: uploadedResults.map((img) => img.url),
    });
  } catch (error) {
    console.error("Cloudinary uploadImages error:", error);
    return res.status(500).json({
      message: "An error occurred while uploading images to Cloudinary.",
      error: error.message,
    });
  }
};

/**
 * DELETE /api/upload/image
 * Delete an image asset from Cloudinary using public_id
 */
exports.deleteImage = async (req, res) => {
  try {
    const { public_id, imageUrl } = req.body;

    let targetPublicId = public_id;

    // If only imageUrl was provided, attempt to extract public_id
    if (!targetPublicId && imageUrl && imageUrl.includes("cloudinary.com")) {
      const parts = imageUrl.split("/upload/");
      if (parts.length > 1) {
        // e.g. v1234567890/renthub/listings/abc123.webp
        const pathAfterUpload = parts[1];
        const withoutVersion = pathAfterUpload.replace(/^v\d+\//, "");
        targetPublicId = withoutVersion.substring(0, withoutVersion.lastIndexOf("."));
      }
    }

    if (!targetPublicId) {
      return res.status(400).json({ message: "A valid public_id or Cloudinary image URL is required." });
    }

    const result = await cloudinary.uploader.destroy(targetPublicId);

    return res.status(200).json({
      message: "Image successfully deleted from Cloudinary.",
      result,
    });
  } catch (error) {
    console.error("Cloudinary deleteImage error:", error);
    return res.status(500).json({
      message: "An error occurred while deleting image from Cloudinary.",
      error: error.message,
    });
  }
};
