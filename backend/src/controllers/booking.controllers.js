import { Ground } from "../models/ground.models.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { Booking } from "../models/booking.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const BookGround = asyncHandler(async (req, res) => {
  const { groundId, startTime, endTime, date } = req.body;

  if (!groundId || !startTime || !endTime || !date) {
    throw new ApiError(400, "All fields are required");
  }

  const ground = await Ground.findById(groundId);
  if (!ground) {
    throw new ApiError(404, "This ground no longer exists.");
  }

  const existingBooking = await Booking.findOne({
    groundId: groundId,
    date: date,
    startTime,
    endTime,
    status: { $in: ["pending", "confirmed"] }
  });

  if (existingBooking) {
    throw new ApiError(400, "This slot is no longer available.");
  }

  if (!req.file) {
    throw new ApiError(400, "Payment screenshot is required");
  }

  let image = await uploadOnCloudinary(req.file.path);
  if (!image) throw new ApiError(500, "Failed to upload payment screenshot. Please try again.");

  const booking = await Booking.create({
    groundId,
    userId: req.user._id,
    startTime,
    endTime,
    date,
    screenshot: image.url,
    screenshotPublicId: image.public_id,
    price: ground.basePrice,
    status: "pending",
  });
  res
    .status(200)
    .json(new ApiResponse(200, booking, "Booking request submitted successfully."));
});

const bookedGrounds = asyncHandler(async (req, res) => {
  const { groundId, date } = req.params;

  if (!groundId || !date) {
    throw new ApiError(400, "Ground ID and date are required");
  }

  const bookings = await Booking.find({ 
    groundId, 
    date, 
    status: { $in: ["pending", "confirmed"] }
  });
  
  res
    .status(200)
    .json(new ApiResponse(200, bookings, "Bookings retrieved successfully"));
});

export { BookGround, bookedGrounds };
