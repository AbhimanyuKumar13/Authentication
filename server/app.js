import express from "express";
import { config } from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import { connection } from "./database/dbConnection.js";
import { errorMiddleware } from "./middlewares/error.js";
import userRouter from "./routes/userRouter.js";
import billingRouter from "./routes/billingRouter.js";
import { removeUnverifiedAccounts } from "./automation/removeUnverifiedAccounts.js";

export const app = express();

config({ path: "./config.env" });

const allowedOrigins = (
  process.env.FRONTEND_URLS ||
  process.env.FRONTEND_URL ||
  ""
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      const isLocalDevelopmentOrigin =
        process.env.NODE_ENV !== "production" &&
        /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin || "");

      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        isLocalDevelopmentOrigin
      ) {
        return callback(null, true);
      }

      return callback(new Error("Origin not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
  }),
);

app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use("/api/v1/user", userRouter);
app.use("/api/v1/billing", billingRouter);

connection();
removeUnverifiedAccounts();
app.use(errorMiddleware);
