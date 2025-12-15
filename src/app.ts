import dotenv from "dotenv";

dotenv.config();

import express, { Application, Request, Response, NextFunction } from "express";
import cors from "cors";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import { connectDatabase } from "./config/database";
import { setupMiddleware } from "./middleware";
import { setupRoutes } from "./controller";
import "./config/passport"; // Initialize Passport configuration

// Load environment variables
// 프로젝트 루트의 .env 파일을 읽음

const app: Application = express();
const PORT = process.env.PORT || 3000;

app.use(
  bodyParser.json({
    limit: "20mb",
  })
);
app.use(bodyParser.urlencoded({ extended: true }));

app.use(
  cors({
    origin: "*",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Setup middleware
setupMiddleware(app);

// Setup routes
setupRoutes(app);

// Health check endpoint
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({
    status: "OK",
    message: "Server is running",
    timestamp: new Date().toISOString(),
    database:
      mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    status: "error",
    message: "Route not found",
  });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error("Error:", err);
  res.status(500).json({
    status: "error",
    message:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Internal server error",
  });
});

// Connect to MongoDB and start server
const startServer = async (): Promise<void> => {
  try {
    // 데이터베이스 연결 대기
    await connectDatabase();

    // 서버 시작
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📝 Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(
        `📊 Database: ${mongoose.connection.name || "connecting..."}`
      );
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

export default app;
