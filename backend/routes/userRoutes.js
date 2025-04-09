import express from "express";
import {
  registerUser,
  loginUser,
  getCurrentUser,
  updateProfile,
  uploadProfilePicture,
  getUserById,
} from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

// Protected routes
router.get("/me", protect, getCurrentUser);
router.put("/profile", protect, updateProfile);
router.post(
  "/profile-picture",
  protect,
  upload.single("profilePicture"),
  uploadProfilePicture
);

// Public routes
router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/:id", getUserById);

export default router;
