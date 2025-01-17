// Importing Express
const express = require("express");

// Initializing the app
const app = express();

// Setting up the /ping route
app.get("/ping", (req, res) => {
  res.json({ message: "Pong!" });
});

// Set up the server to listen on port 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
