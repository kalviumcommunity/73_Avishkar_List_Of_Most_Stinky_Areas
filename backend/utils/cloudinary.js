import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import dotenv from "dotenv";
import path from "path";

// Ensure environment variables are loaded
dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Upload file to Cloudinary
export const uploadToCloudinary = async (filePath, folder) => {
  try {
    console.log(`Attempting to upload file: ${filePath} to folder: ${folder}`);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found at path: ${filePath}`);
    }

    // Check file size
    const stats = fs.statSync(filePath);
    console.log(`File size: ${stats.size} bytes`);

    // Check file extension
    const ext = path.extname(filePath).toLowerCase();
    console.log(`File extension: ${ext}`);

    // Check Cloudinary configuration
    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      throw new Error(
        "Cloudinary configuration is incomplete. Check your environment variables."
      );
    }

    // If Cloudinary is not configured properly, return a local path
    if (process.env.CLOUDINARY_CLOUD_NAME === "placeholder") {
      console.log("Using local file path as Cloudinary is not configured");
      const filename = path.basename(filePath);
      return { secure_url: `/uploads/${filename}` };
    }

    const result = await cloudinary.uploader.upload(filePath, {
      folder,
      resource_type: "auto", // Auto-detect resource type
    });

    console.log("Cloudinary upload successful:", result.secure_url);

    // Remove file from local storage
    try {
      fs.unlinkSync(filePath);
    } catch (unlinkError) {
      console.error("Error removing local file:", unlinkError);
      // Continue even if unlink fails
    }

    return result;
  } catch (error) {
    console.error("Cloudinary upload error:", error);

    // Return a fallback local URL
    const filename = path.basename(filePath);
    console.log(`Using fallback local URL: /uploads/${filename}`);

    return { secure_url: `/uploads/${filename}` };
  }
};
