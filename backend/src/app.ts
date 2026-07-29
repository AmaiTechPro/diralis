import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

const app = express();

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());

// Routes
app.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "Welcome to the Diralis API 🚀",
    version: "1.0.0",
  });
});

app.get("/health", (_req, res) => {
  res.json({
    status: "OK",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

export default app;

