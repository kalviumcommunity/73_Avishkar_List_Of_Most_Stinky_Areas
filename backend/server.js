import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
// Route imports
import userRoutes from "./routes/userRoutes.js";
import stinkyAreaRoutes from "./routes/stinkyAreaRoutes.js";
import commentRoutes from "./routes/commentRoutes.js";

dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 8000;
const MONGO_URI = process.env.MONGO_URI;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(express.json()); // Parse JSON requests

// Enable CORS
app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true, // Setting credentials: true in the CORS configuration allows the browser to send cookies, HTTP authentication, and client-side SSL certificates along with cross-origin requests.
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Serve uploaded files statically (for development fallback)
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// API routes
app.use("/api/users", userRoutes);
app.use("/api/stinky-areas", stinkyAreaRoutes);
app.use("/api/comments", commentRoutes);

app.get("/", (req, res) => {
  res.send("Backend is live!");
});

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("MongoDB Connected ✅");
  } catch (error) {
    console.error("MongoDB Connection Error", error);
    process.exit(1);
  }
};

// Start server logic
app.listen(PORT, async () => {
  await connectDB();
  console.log(`Server running on http://localhost:${PORT} `);
});
