import Comment from "../models/Comment.js";
import StinkyArea from "../models/StinkyArea.js";

// @desc    Create a new comment
// @route   POST /api/stinky-areas/:id/comments
// @access  Private
export const createComment = async (req, res) => {
  try {
    const { content } = req.body;
    const stinkyAreaId = req.params.id;

    // Check if stinky area exists
    const stinkyArea = await StinkyArea.findById(stinkyAreaId);
    if (!stinkyArea) {
      return res.status(404).json({ message: "Stinky area not found" });
    }

    // Create comment
    const comment = await Comment.create({
      content,
      author: req.user._id,
      stinkyArea: stinkyAreaId,
    });

    // Populate author info
    await comment.populate("author", "username profilePicture");

    res.status(201).json(comment);
  } catch (error) {
    console.error("Create comment error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get comments for a stinky area
// @route   GET /api/stinky-areas/:id/comments
// @access  Public
export const getComments = async (req, res) => {
  try {
    const stinkyAreaId = req.params.id;
    const page = Number.parseInt(req.query.page) || 1;
    const limit = Number.parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Check if stinky area exists
    const stinkyArea = await StinkyArea.findById(stinkyAreaId);
    if (!stinkyArea) {
      return res.status(404).json({ message: "Stinky area not found" });
    }

    // Get comments
    const comments = await Comment.find({ stinkyArea: stinkyAreaId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("author", "username profilePicture");

    const total = await Comment.countDocuments({ stinkyArea: stinkyAreaId });

    res.json({
      comments,
      page,
      pages: Math.ceil(total / limit),
      total,
    });
  } catch (error) {
    console.error("Get comments error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Delete a comment
// @route   DELETE /api/comments/:id
// @access  Private
export const deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    // Check if user is the author
    if (comment.author.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this comment" });
    }

    await comment.deleteOne();

    res.json({ message: "Comment removed" });
  } catch (error) {
    console.error("Delete comment error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Vote on a comment
// @route   POST /api/comments/:id/vote
// @access  Private
export const voteComment = async (req, res) => {
  try {
    const { vote } = req.body; // 1 for upvote, -1 for downvote

    if (vote !== 1 && vote !== -1) {
      return res.status(400).json({ message: "Invalid vote value" });
    }

    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    // Simple implementation - just increment/decrement
    // In a real app, you'd track who voted to prevent duplicate votes
    if (vote === 1) {
      comment.upvotes += 1;
    } else {
      comment.downvotes += 1;
    }

    await comment.save();

    res.json({
      upvotes: comment.upvotes,
      downvotes: comment.downvotes,
    });
  } catch (error) {
    console.error("Vote comment error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
