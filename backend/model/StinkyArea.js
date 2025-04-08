import mongoose from "mongoose";

const StinkyAreaSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Area name is required"],
      trim: true,
      maxlength: [100, "Area name cannot exceed 100 characters"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    location: {
      address: {
        type: String,
        required: [true, "Address is required"],
      },
      coordinates: {
        type: {
          type: String,
          enum: ["Point"],
          default: "Point",
        },
        coordinates: {
          type: [Number], // [longitude, latitude]
          required: [true, "Coordinates are required"],
        },
      },
    },
    stinkLevel: {
      type: Number,
      required: [true, "Stink level is required"],
      min: [1, "Stink level must be at least 1"],
      max: [10, "Stink level cannot exceed 10"],
    },
    images: [
      {
        type: String, // URLs to images
      },
    ],
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Reporter is required"],
    },
    upvotes: {
      type: Number,
      default: 0,
    },
    downvotes: {
      type: Number,
      default: 0,
    },
    totalVotes: {
      type: Number,
      default: 0,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  { timestamps: true }
);

const StinkyArea = mongoose.model("StinkyArea", StinkyAreaSchema);

export default StinkyArea;
