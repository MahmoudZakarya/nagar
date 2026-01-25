import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { initData } from "./db";
import { translateExistingData } from "./scripts/translate_data";
import path from "path";

import apiRoutes from "./routes";

const app = express();
// Allow specific port configuration or dynamic
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

// Initialize Database & Run Migrations
try {
  initData();
  translateExistingData();
} catch (error) {
  console.error("Failed to initialize database:", error);
}

app.use("/api", apiRoutes);
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.get("/", (req, res) => {
  res.send("Nagar ERP API is running");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
