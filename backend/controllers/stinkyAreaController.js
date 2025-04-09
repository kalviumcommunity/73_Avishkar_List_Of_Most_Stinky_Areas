import StinkyArea from "../models/StinkyArea.js";
import User from "../models/User.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";
import fs from "fs";

// @desc    Create a new stinky area
// @route   POST /api/stinky-areas
// @access  Private
export const createStinkyArea = async (req, res) => {
  try {
    console.log("Creating stinky area with body:", req.body);

    // Parse coordinates if they're sent as a string
    let coordinates = [0, 0];
    if (req.body.coordinates) {
      try {
        if (typeof req.body.coordinates === "string") {
          coordinates = JSON.parse(req.body.coordinates);
        } else {
          coordinates = req.body.coordinates;
        }
        console.log("Parsed coordinates:", coordinates);
      } catch (err) {
        console.error("Error parsing coordinates:", err);
        return res.status(400).json({ message: "Invalid coordinates format" });
      }
    }

    // Validate required fields
    if (!req.body.name || !req.body.description || !req.body.address) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Create new stinky area
    const stinkyArea = new StinkyArea({
      name: req.body.name,
      description: req.body.description,
      location: {
        address: req.body.address,
        coordinates: {
          type: "Point",
          coordinates: coordinates,
        },
      },
      stinkLevel: Number(req.body.stinkLevel) || 5,
      tags: req.body.tags
        ? req.body.tags.split(",").map((tag) => tag.trim())
        : [],
      reporter: req.user._id,
      upvotes: 0,
      downvotes: 0,
      totalVotes: 0,
      images: [],
    });

    console.log("Created stinky area object:", stinkyArea);

    // Add image URLs if files were uploaded
    if (req.files && req.files.length > 0) {
      console.log(`Processing ${req.files.length} uploaded files`);

      try {
        const imagePromises = req.files.map(async (file) => {
          console.log("Processing file:", file.path);

          // Check if file exists
          if (!fs.existsSync(file.path)) {
            console.error(`File not found at path: ${file.path}`);
            return null;
          }

          try {
            const result = await uploadToCloudinary(file.path, "stinky-areas");
            console.log("Cloudinary upload result:", result);
            return result.secure_url;
          } catch (uploadErr) {
            console.error("Error uploading to Cloudinary:", uploadErr);

            // If Cloudinary fails, use a local fallback path
            const publicPath = `/uploads/${file.filename}`;
            console.log("Using fallback local path:", publicPath);
            return publicPath;
          }
        });

        const imageResults = await Promise.all(imagePromises);
        stinkyArea.images = imageResults.filter((url) => url !== null);
        console.log("Final image URLs:", stinkyArea.images);
      } catch (imageErr) {
        console.error("Error processing images:", imageErr);
        // Continue without images if there's an error
      }
    }

    // Save the stinky area
    await stinkyArea.save();
    console.log("Stinky area saved successfully with ID:", stinkyArea._id);

    // Add to user's reported areas
    await User.findByIdAndUpdate(req.user._id, {
      $push: { reportedAreas: stinkyArea._id },
    });

    res.status(201).json(stinkyArea);
  } catch (error) {
    console.error("Create stinky area error:", error);
    res.status(500).json({ message: "Server error: " + error.message });
  }
};

// @desc    Get all stinky areas
// @route   GET /api/stinky-areas
// @access  Public
export const getStinkyAreas = async (req, res) => {
  try {
    const page = Number.parseInt(req.query.page) || 1;
    const limit = Number.parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const stinkyAreas = await StinkyArea.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("reporter", "username profilePicture");

    const total = await StinkyArea.countDocuments();

    res.json({
      stinkyAreas,
      page,
      pages: Math.ceil(total / limit),
      total,
    });
  } catch (error) {
    console.error("Get stinky areas error:", error);
    res.status(500).json({ message: "Server error: " + error.message });
  }
};

// @desc    Get stinky area by ID
// @route   GET /api/stinky-areas/:id
// @access  Public
export const getStinkyAreaById = async (req, res) => {
  try {
    const stinkyArea = await StinkyArea.findById(req.params.id).populate(
      "reporter",
      "username profilePicture"
    );

    if (!stinkyArea) {
      return res.status(404).json({ message: "Stinky area not found" });
    }

    res.json(stinkyArea);
  } catch (error) {
    console.error("Get stinky area by ID error:", error);
    res.status(500).json({ message: "Server error: " + error.message });
  }
};

// @desc    Get stinky areas by user ID
// @route   GET /api/stinky-areas/user/:userId
// @access  Public
export const getStinkyAreasByUser = async (req, res) => {
  try {
    const userId = req.params.userId || req.user._id;

    const stinkyAreas = await StinkyArea.find({ reporter: userId })
      .sort({ createdAt: -1 })
      .populate("reporter", "username profilePicture");

    res.json(stinkyAreas);
  } catch (error) {
    console.error("Get user stinky areas error:", error);
    res.status(500).json({ message: "Server error: " + error.message });
  }
};

// @desc    Update stinky area
// @route   PUT /api/stinky-areas/:id
// @access  Private
export const updateStinkyArea = async (req, res) => {
  try {
    const stinkyArea = await StinkyArea.findById(req.params.id);

    if (!stinkyArea) {
      return res.status(404).json({ message: "Stinky area not found" });
    }

    // Check if user is the reporter
    if (stinkyArea.reporter.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this stinky area" });
    }

    // Update fields
    const { name, description, address, stinkLevel, tags } = req.body;

    if (name) stinkyArea.name = name;
    if (description) stinkyArea.description = description;
    if (address) stinkyArea.location.address = address;

    // Parse coordinates if they're sent as a string
    if (req.body.coordinates) {
      try {
        let coordinates;
        if (typeof req.body.coordinates === "string") {
          coordinates = JSON.parse(req.body.coordinates);
        } else {
          coordinates = req.body.coordinates;
        }
        stinkyArea.location.coordinates.coordinates = coordinates;
      } catch (err) {
        console.error("Error parsing coordinates:", err);
        return res.status(400).json({ message: "Invalid coordinates format" });
      }
    }

    if (stinkLevel) stinkyArea.stinkLevel = Number(stinkLevel);
    if (tags) stinkyArea.tags = tags.split(",").map((tag) => tag.trim());

    // Add new images if files were uploaded
    if (req.files && req.files.length > 0) {
      try {
        const imagePromises = req.files.map(async (file) => {
          try {
            const result = await uploadToCloudinary(file.path, "stinky-areas");
            return result.secure_url;
          } catch (uploadErr) {
            console.error("Error uploading to Cloudinary:", uploadErr);

            // If Cloudinary fails, use a local fallback path
            const publicPath = `/uploads/${file.filename}`;
            return publicPath;
          }
        });

        const imageResults = await Promise.all(imagePromises);
        const validImages = imageResults.filter((url) => url !== null);

        // Append new images to existing ones
        stinkyArea.images = [...stinkyArea.images, ...validImages];
      } catch (imageErr) {
        console.error("Error processing images:", imageErr);
        // Continue without adding new images if there's an error
      }
    }

    await stinkyArea.save();

    res.json(stinkyArea);
  } catch (error) {
    console.error("Update stinky area error:", error);
    res.status(500).json({ message: "Server error: " + error.message });
  }
};

// @desc    Delete stinky area
// @route   DELETE /api/stinky-areas/:id
// @access  Private
export const deleteStinkyArea = async (req, res) => {
  try {
    const stinkyArea = await StinkyArea.findById(req.params.id);

    if (!stinkyArea) {
      return res.status(404).json({ message: "Stinky area not found" });
    }

    // Check if user is the reporter
    if (stinkyArea.reporter.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this stinky area" });
    }

    // Remove from user's reported areas
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { reportedAreas: stinkyArea._id },
    });

    await stinkyArea.deleteOne();

    res.json({ message: "Stinky area removed" });
  } catch (error) {
    console.error("Delete stinky area error:", error);
    res.status(500).json({ message: "Server error: " + error.message });
  }
};

// @desc    Vote on a stinky area
// @route   POST /api/stinky-areas/:id/vote
// @access  Private
export const voteStinkyArea = async (req, res) => {
  try {
    const { vote } = req.body; // 1 for upvote, -1 for downvote

    if (vote !== 1 && vote !== -1) {
      return res.status(400).json({ message: "Invalid vote value" });
    }

    const stinkyArea = await StinkyArea.findById(req.params.id);

    if (!stinkyArea) {
      return res.status(404).json({ message: "Stinky area not found" });
    }

    // Check if user has already voted
    const user = await User.findById(req.user._id);
    const existingVoteIndex = user.votedAreas.findIndex(
      (v) => v.area.toString() === req.params.id
    );
    const existingVote =
      existingVoteIndex !== -1 ? user.votedAreas[existingVoteIndex] : null;

    if (existingVote) {
      // User is changing their vote
      if (existingVote.vote !== vote) {
        // Update vote count on stinky area
        if (existingVote.vote === 1) {
          stinkyArea.upvotes -= 1;
        } else {
          stinkyArea.downvotes -= 1;
        }

        if (vote === 1) {
          stinkyArea.upvotes += 1;
        } else {
          stinkyArea.downvotes += 1;
        }

        // Update user's vote
        user.votedAreas[existingVoteIndex].vote = vote;
        await user.save();
      } else {
        // User is removing their vote
        if (vote === 1) {
          stinkyArea.upvotes -= 1;
        } else {
          stinkyArea.downvotes -= 1;
        }

        // Remove vote from user
        user.votedAreas.splice(existingVoteIndex, 1);
        await user.save();
      }
    } else {
      // New vote
      if (vote === 1) {
        stinkyArea.upvotes += 1;
      } else {
        stinkyArea.downvotes += 1;
      }

      // Add vote to user
      user.votedAreas.push({
        area: req.params.id,
        vote,
      });
      await user.save();
    }

    // Update total votes
    stinkyArea.totalVotes = stinkyArea.upvotes - stinkyArea.downvotes;
    await stinkyArea.save();

    res.json({
      upvotes: stinkyArea.upvotes,
      downvotes: stinkyArea.downvotes,
      totalVotes: stinkyArea.totalVotes,
    });
  } catch (error) {
    console.error("Vote stinky area error:", error);
    res.status(500).json({ message: "Server error: " + error.message });
  }
};
