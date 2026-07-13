import { User } from "../models/user.models.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { generateOTP, sendOTPEmail } from "../utils/otpService.js";

let registerUser = asyncHandler(async (req, res) => {
  let { username, email, password } = req.body;

  if (
    username?.trim() === "" ||
    email?.trim() === "" ||
    password?.trim() === ""
  ) {
    throw new ApiError(400, "All fields are required");
  }
  let existingUser = await User.findOne({ $or: [{ username }, { email }] });
  if (existingUser && existingUser.isVerified) {
    if (existingUser.email === email) {
      throw new ApiError(409, "Email already exists. Please sign in instead.");
    }
    throw new ApiError(409, "This username is already taken. Please choose another.");
  }
  if (existingUser) {
    await User.deleteOne({
      email: existingUser.email,
      username: existingUser.username,
      isVerified: false,
    });
  }
  try {
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await User.create({
      username,
      email,
      password,
      otp,
      otpExpires,
      isVerified: false,
    });
    await sendOTPEmail(email, otp);
  } catch (err) {
    if (err instanceof ApiError) {
      throw err;
    }
    throw new ApiError(500, "We couldn't complete your registration. Please try again.");
  }
  res
    .status(200)
    .send(new ApiResponse(200, {}, "Account created. OTP sent to your email."));
});

let verifyOTP = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  if (email?.trim() == "" || otp?.trim() == "") {
    throw new ApiError(400, "All fields are required");
  }
  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(404, "We couldn't find a pending verification for this email. Please sign up again.");
  }
  if (user.otp !== otp) {
    throw new ApiError(400, "Invalid OTP. Please check the code and try again.");
  }
  if (user.otpExpires < new Date()) {
    throw new ApiError(401, "OTP has expired. Please request a new one.");
  }
  user.isVerified = true;
  user.otp = undefined;
  user.otpExpires = undefined;
  await user.save();
  res.status(200).send(new ApiResponse(200, {}, "Verification successful."));
});

let logoutUser = asyncHandler(async (req, res) => {
  let user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: { refreshToken: undefined },
    },
    { new: true }
  );
  let options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  };
  res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, "", "Logout successful"));
});

const resendOTP = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email?.trim()) {
    throw new ApiError(400, "Email is required");
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(404, "No account found with this email. Please sign up first.");
  }

  if (user.isVerified) {
    throw new ApiError(400, "This account is already verified. Please sign in.");
  }

  const newOTP = generateOTP();
  const newOTPExpires = new Date(Date.now() + 10 * 60 * 1000);

  user.otp = newOTP;
  user.otpExpires = newOTPExpires;
  await user.save();

  await sendOTPEmail(email, newOTP);

  res.status(200).json(new ApiResponse(200, {}, "OTP sent successfully."));
});

let loginUser = asyncHandler(async (req, res) => {
  let { username, password } = req.body;
  if (username.trim() == "" || password.trim() == "") {
    throw new ApiError(400, "All fields are required");
  }

  let user;
  try {
    user = await User.findOne({ username });
    if (!user) {
      throw new ApiError(404, "No account found with this username.");
    }

    let passwordCorrect = await user.isPasswordCorrect(password);

    if (!passwordCorrect) {
      throw new ApiError(400, "Incorrect password.");
    }

    let { accessToken, refreshToken } = await generateAccessAndRefreshToken(
      user._id
    );

    let options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    };
    res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          200,
          { user, accessToken, refreshToken },
          "Signed in successfully."
        )
      );
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, "We couldn't sign you in. Please try again.");
  }
});

let getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Current user details"));
});

let generateAccessAndRefreshToken = async function (userId) {
  let user = await User.findById(userId);

  try {
    let accessToken = await user.generateAccessToken();
    let refreshToken = await user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Error generating tokens");
  }
};

let changePassword = asyncHandler(async (req, res) => {
  try {
    let { currentPassword, newPassword } = req.body;
    let user = await User.findById(req.user._id);
    if (!user) {
      throw new ApiError(400, "We couldn't find your account.");
    }
    let response = await user.isPasswordCorrect(currentPassword);
    if (!response) {
      throw new ApiError(410, "Incorrect current password. Please try again.");
    }
    user.password = newPassword;
    await user.save();
    res
      .status(200)
      .json(new ApiResponse(200, user, "Password changed successfully."));
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, "We couldn't update your password. Please try again.");
  }
});

let updateAccountDetails = asyncHandler(async (req, res) => {
  try {
    let { username, email } = req.body;
    if (username.trim() === "" || email.trim() === "") {
      throw new ApiError(400, "All fields are required");
    }
    const existingUser = await User.findOne({
      $and: [
        {
          $or: [{ username }, { email }],
        },
        { _id: { $ne: req.user._id } },
      ],
    });

    if (existingUser) {
      if (existingUser.email === email) {
        throw new ApiError(410, "Email already exists. Please use a different email.");
      }
      throw new ApiError(410, "This username is already taken. Please choose another.");
    }
    let user = await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          username,
          email,
        },
      },
      { new: true }
    );
    res
      .status(200)
      .json(new ApiResponse(200, user, "Account details updated successfully."));
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, "We couldn't update your account details. Please try again.");
  }
});

let refreshAccessToken = async (req, res) => {
  let refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    throw new ApiError(498, "Your session has expired. Please sign in again.");
  }

  try {
    let decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

    let user = await User.findById(decoded?.id);

    if (!user) {
      throw new ApiError(498, "Your session has expired. Please sign in again.");
    }

    if (refreshToken !== user?.refreshToken) {
      throw new ApiError(498, "Your session has expired. Please sign in again.");
    }

    let { accessToken, refreshToken: newRefreshToken } =
      await generateAccessAndRefreshToken(user._id);

    let options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    };

    req.user = user;
    res
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(400, "Your session has expired. Please sign in again.");
  }
};

export {
  registerUser,
  verifyOTP,
  resendOTP,
  loginUser,
  getCurrentUser,
  refreshAccessToken,
  generateAccessAndRefreshToken,
  logoutUser,
  changePassword,
  updateAccountDetails,
};
