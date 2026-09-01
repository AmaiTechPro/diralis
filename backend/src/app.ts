import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import routes from "./routes/index.routes";

const app = express();

// Trust proxy for reverse proxies (Render, AWS ALB, Nginx) so rate limiters track real client IPs
app.set("trust proxy", 1);

// Security Headers via Helmet
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "https://api.paystack.co", "https://checkout.paystack.com"],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

// CORS configuration
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "https://diralishq.com",
      "https://www.diralishq.com",
    ],
    credentials: true,
  })
);

app.use(morgan("dev"));

// Body parser with rawBuffer capture for HMAC webhook verification
app.use(
  express.json({
    limit: "10mb",
    verify: (req: express.Request, _res, buf) => {
      if (req.originalUrl === "/api/billing/webhook") {
        (req as express.Request & { rawBody?: Buffer }).rawBody = buf;
      }
    },
  })
);

app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Root routes
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

// Mount main API router
app.use("/api", routes);

export default app;

