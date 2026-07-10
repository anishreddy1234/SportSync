import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
import { Admin } from "../models/Admin.models.js";
import mongoose from "mongoose";
import {
  refreshAccessToken,
  generateAccessAndRefreshToken,
} from "../controllers/AdminDashboard.controllers.js";
const verifyJWTAdmin = async (req, res, next) => {
  try {
    const accessToken = req.cookies?.accessToken;
    if (!accessToken) {
      await refreshAccessToken(req, res);
      return next();
    }

    const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);

    if (!decoded || !decoded.id) {
      await refreshAccessToken(req, res);
      return next();
    }

    const admin = await Admin.findById(decoded.id).select("-password");

    if (!admin) {
      await refreshAccessToken(req, res);
      return next();
    }

    req.user = admin;
    return next();
  } catch (error) {
    if (error instanceof ApiError) {
      return next(error);
    }
    if (
      error.name === "TokenExpiredError" ||
      error.name === "JsonWebTokenError"
    ) {
      try {
        await refreshAccessToken(req, res);
        return next();
      } catch (refreshError) {
        return next(
          new ApiError(498, "Your session has expired. Please sign in again.")
        );
      }
    }

    console.error("JWT verification error:", error.message);
    next(new ApiError(500, "Something went wrong while verifying your session. Please sign in again."));
  }
};

export { verifyJWTAdmin };
