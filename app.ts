import express, { Request, Response, NextFunction } from "express";
import bodyParser from "body-parser";
import cors from "cors";
import helmet from "helmet";
import hpp from "hpp";
import rateLimit from "express-rate-limit";
import mongoose from "mongoose";
import dotenv from "dotenv";
import session from "express-session";

dotenv.config();

import globalErrorController from "./controllers/error.controller";
import authRoute from "./routers/auth.router";
import userRoute from "./routers/user.router";
import passport from "passport";
import "./utils/passport";
import AppError from "./utils/app-error";

const app = express();

console.log("🔥 APP FILE IS RUNNING");

const allowedOrigins: string[] = [
  "http://localhost:5173",
  "https://geofly-frontend-dun.vercel.app",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(helmet());
app.use(hpp());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests, please try again later.",
});

app.use("/api", limiter);

app.disable("x-powered-by");

app.use(
  session({
    secret: process.env.SESSION_SECRET || "default_secret",
    resave: false,
    saveUninitialized: false,
  }),
);

app.use(passport.initialize());
app.use(passport.session());

app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ limit: "10mb", extended: true }));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get("/", (req: Request, res: Response) => {
  res.send("<h1>WELCOME TO ABBEY MORTGAGE</h1>");
});

app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization",
  );
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE");

  next();
});

app.use("/api/v1/auth", authRoute);
app.use("/api/v1/user", userRoute);

app.all(/.*/, (req: Request, res: Response, next: NextFunction) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

app.use(globalErrorController);

const db: string | undefined = process.env.DATABASE;

async function startServer(): Promise<void> {
  const port = process.env.PORT || 8080;

  console.log("🚀 Starting server...");

  try {
    if (!db) {
      console.error("❌ DATABASE env is not defined");
      process.exit(1);
    }

    console.log("🔌 Connecting to DB...");

    await mongoose.connect(db);

    console.log("✅ database connection successful");

    app.listen(port, () => {
      console.log(`🔥 app running on port ${port}`);
    });
  } catch (error) {
    console.error("❌ Server error:", error);
    process.exit(1);
  }
}

startServer();
