import express from "express";
import {
  createStinkyArea,
  getStinkyAreas,
  getStinkyAreaById,
  updateStinkyArea,
  deleteStinkyArea,
  voteStinkyArea,
  getStinkyAreasByUser,
} from "../controllers/stinkyAreaController.js";
import {
  createComment,
  getComments,
} from "../controllers/commentController.js";
import { protect } from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

// Public routes
router.get("/", getStinkyAreas);
router.get("/:id", getStinkyAreaById);
router.get("/:id/comments", getComments);

// User's stinky areas
router.get("/user/me", protect, getStinkyAreasByUser);
router.get("/user/:userId", getStinkyAreasByUser);

// Protected routes
router.post("/", protect, upload.array("images", 5), createStinkyArea);
router.put("/:id", protect, upload.array("images", 5), updateStinkyArea);
router.delete("/:id", protect, deleteStinkyArea);
router.post("/:id/vote", protect, voteStinkyArea);
router.post("/:id/comments", protect, createComment);

export default router;
