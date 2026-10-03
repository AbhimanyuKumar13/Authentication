import { catchAsyncError } from "./catchAsyncError.js";
import ErrorHandler from "./error.js";
import { User } from "../models/UserModel.js";
import jwt from "jsonwebtoken";

export const isAuthenticated = catchAsyncError(async (req, res, next) => {
  const { token } = req.cookies || {};
  if (!token) {
    return next(
      new ErrorHandler("Please log in to access this resource.", 401),
    );
  }
  const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
  req.user = await User.findById(decoded.id);
  if (!req.user || !req.user.accountVerified) {
    return next(
      new ErrorHandler("Please log in to access this resource.", 401),
    );
  }
  next();
});
