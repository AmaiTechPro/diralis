import dotenv from "dotenv";

dotenv.config();

import app from "./app";

import overallInsightsRoutes from "./routes/overallInsightsRoutes";

app.use(
  "/api/overall-insights",
  overallInsightsRoutes
);

import userProfileRoutes from "./routes/userProfileRoutes";

app.use(
  "/api/profile",
  userProfileRoutes
);

import settingsRoutes from "./routes/settingsRoutes";

app.use(
 "/api/settings",
 settingsRoutes
);

import chatRoutes from "./routes/chatRoutes";

app.use("/api/chat", chatRoutes);

import chatHistoryRoutes from "./routes/chatHistoryRoutes";

app.use(
  "/api/chat-history",
  chatHistoryRoutes
);

import predictionRoutes
from "./routes/predictionRoutes";

app.use(
  "/api/predictions",
  predictionRoutes
);

import aiRoutes from "./routes/aiRoutes";

app.use("/api/ai", aiRoutes);

import passwordResetRoutes from "./routes/passwordReset.routes";

app.use(
  "/api/auth",
  passwordResetRoutes
);

import adminRoutes from "./routes/admin.routes";

app.use(
  "/api/admin",
  adminRoutes
);

import dashboardRoutes from "./routes/dashboardRoutes";

app.use(
  "/api/dashboard",
  dashboardRoutes
);



const PORT = Number(process.env.PORT) || 5000;

app.listen(PORT, () => {
  console.log("==================================");
  console.log("🚀 Diralis Backend Started");
  console.log(`🌐 Server: http://localhost:${PORT}`);
  console.log(`❤️ Health: http://localhost:${PORT}/health`);
  console.log("==================================");
});
