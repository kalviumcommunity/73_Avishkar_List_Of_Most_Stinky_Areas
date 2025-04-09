import express from "express";
import {
  deleteComment,
  voteComment,
} from "../controllers/commentController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Protected routes
router.delete("/:id", protect, deleteComment);
router.post("/:id/vote", protect, voteComment);

export default router;
