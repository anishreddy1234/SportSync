import { Review } from "../models/review.models.js";
import { Ground } from "../models/ground.models.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";

const addReview = asyncHandler(async (req, res) => {
  const { groundId, rating, comment } = req.body;

  if (!groundId || !rating || !comment) {
    throw new ApiError(400, "Ground ID, rating, and comment are required");
  }

  if (rating < 1 || rating > 5) {
    throw new ApiError(400, "Rating must be between 1 and 5");
  }

  const ground = await Ground.findById(groundId);
  if (!ground) {
    throw new ApiError(404, "This ground no longer exists.");
  }

  const reviewCount = await Review.countDocuments({
    groundId,
    userId: req.user._id,
  });

  if (reviewCount >= 2) {
    throw new ApiError(400, "You've already submitted the maximum of 2 reviews for this ground.");
  }

  const review = await Review.create({
    groundId,
    userId: req.user._id,
    rating,
    comment,
  });

  const populatedReview = await Review.findById(review._id)
    .populate("userId", "username")
    .populate("groundId", "name");

  res
    .status(201)
    .json(new ApiResponse(201, populatedReview, "Review submitted successfully."));
});

const getGroundReviews = asyncHandler(async (req, res) => {
  const { groundId } = req.params;

  if (!groundId) {
    throw new ApiError(400, "Ground ID is required");
  }

  const reviews = await Review.find({ groundId })
    .populate("userId", "username")
    .sort({ createdAt: -1 });

  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : 0;

  res.status(200).json(
    new ApiResponse(
      200,
      {
        reviews,
        averageRating: avgRating.toFixed(1),
        totalReviews: reviews.length,
      },
      "Reviews retrieved successfully"
    )
  );
});

const getUserReviewCount = asyncHandler(async (req, res) => {
  const { groundId } = req.params;

  if (!groundId) {
    throw new ApiError(400, "Ground ID is required");
  }

  const count = await Review.countDocuments({
    groundId,
    userId: req.user._id,
  });

  res.status(200).json(
    new ApiResponse(
      200,
      { count, canAddReview: count < 2 },
      "User review count retrieved successfully"
    )
  );
});

export { addReview, getGroundReviews, getUserReviewCount };
