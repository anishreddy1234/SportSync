import { Message } from "../models/message.models.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const getChatHistory = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50 } = req.query;

  const messages = await Message.find({ isDeleted: false })
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .populate("sender", "username email")
    .lean();

  const total = await Message.countDocuments({ isDeleted: false });

  res.status(200).json(
    new ApiResponse(
      200,
      {
        messages: messages.reverse(), // Reverse to show oldest first
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit),
        },
      },
      "Chat history retrieved successfully"
    )
  );
});

const sendTextMessage = asyncHandler(async (req, res) => {
  const { content } = req.body;
  const userId = req.user._id;

  if (!content || content.trim() === "") {
    throw new ApiError(400, "Message content is required");
  }

  const message = await Message.create({
    sender: userId,
    messageType: "text",
    content: content.trim(),
  });

  await message.populate("sender", "username email");

  const io = req.app.get("io");
  io.to("community-chat").emit("message:new", {
    _id: message._id,
    sender: {
      _id: message.sender._id,
      username: message.sender.username,
      email: message.sender.email,
    },
    messageType: message.messageType,
    content: message.content,
    createdAt: message.createdAt,
    updatedAt: message.updatedAt,
  });

  res.status(201).json(
    new ApiResponse(201, message, "Text message sent successfully")
  );
});

const sendImageMessage = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  if (!req.file) {
    throw new ApiError(400, "Image file is required");
  }

  const uploadedFile = await uploadOnCloudinary(req.file.path);

  if (!uploadedFile) {
    throw new ApiError(500, "Failed to upload image. Please try again.");
  }

  const message = await Message.create({
    sender: userId,
    messageType: "image",
    mediaUrl: uploadedFile.url,
    mediaPublicId: uploadedFile.public_id,
  });

  await message.populate("sender", "username email");

  const io = req.app.get("io");
  io.to("community-chat").emit("message:new", {
    _id: message._id,
    sender: {
      _id: message.sender._id,
      username: message.sender.username,
      email: message.sender.email,
    },
    messageType: message.messageType,
    mediaUrl: message.mediaUrl,
    createdAt: message.createdAt,
    updatedAt: message.updatedAt,
  });

  res.status(201).json(
    new ApiResponse(201, message, "Image message sent successfully")
  );
});

const sendVideoMessage = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  if (!req.file) {
    throw new ApiError(400, "Video file is required");
  }

  const uploadedFile = await uploadOnCloudinary(req.file.path);

  if (!uploadedFile) {
    throw new ApiError(500, "Failed to upload video. Please try again.");
  }

  const message = await Message.create({
    sender: userId,
    messageType: "video",
    mediaUrl: uploadedFile.url,
    mediaPublicId: uploadedFile.public_id,
  });

  await message.populate("sender", "username email");

  const io = req.app.get("io");
  io.to("community-chat").emit("message:new", {
    _id: message._id,
    sender: {
      _id: message.sender._id,
      username: message.sender.username,
      email: message.sender.email,
    },
    messageType: message.messageType,
    mediaUrl: message.mediaUrl,
    createdAt: message.createdAt,
    updatedAt: message.updatedAt,
  });

  res.status(201).json(
    new ApiResponse(201, message, "Video message sent successfully")
  );
});

const deleteMessage = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const userId = req.user._id;

  const message = await Message.findById(messageId);

  if (!message) {
    throw new ApiError(404, "Message not found");
  }

  if (message.sender.toString() !== userId.toString()) {
    throw new ApiError(403, "You can only delete your own messages");
  }

  message.isDeleted = true;
  await message.save();

  const io = req.app.get("io");
  io.to("community-chat").emit("message:deleted", { messageId });

  res
    .status(200)
    .json(new ApiResponse(200, {}, "Message deleted successfully"));
});

const markAsRead = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { messageIds } = req.body;

  if (!Array.isArray(messageIds) || messageIds.length === 0) {
    throw new ApiError(400, "Message IDs array is required");
  }

  await Message.updateMany(
    {
      _id: { $in: messageIds },
      "readBy.user": { $ne: userId },
    },
    {
      $push: {
        readBy: {
          user: userId,
          readAt: new Date(),
        },
      },
    }
  );

  res.status(200).json(new ApiResponse(200, {}, "Messages marked as read"));
});

const getOnlineUsers = asyncHandler(async (req, res) => {
  const io = req.app.get("io");
  const onlineUsers = [];

  const sockets = await io.fetchSockets();

  sockets.forEach((socket) => {
    if (socket.data.user) {
      onlineUsers.push({
        userId: socket.data.user._id,
        username: socket.data.user.username,
      });
    }
  });

  res
    .status(200)
    .json(
      new ApiResponse(200, { count: onlineUsers.length, users: onlineUsers }, "Online users retrieved")
    );
});

export {
  getChatHistory,
  sendTextMessage,
  sendImageMessage,
  sendVideoMessage,
  deleteMessage,
  markAsRead,
  getOnlineUsers,
};
