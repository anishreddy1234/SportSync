import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localfilePath) => {
  if (!localfilePath) return null;
  try {
    const response = await cloudinary.uploader.upload(localfilePath, {
      resource_type: "auto",
    });
    fs.unlinkSync(localfilePath);
    return response;
  } catch (err) {
    console.error("Cloudinary upload failed:", err);
    fs.unlinkSync(localfilePath);
    return null;
  }
};
const deleteFromCloudinary = async (publicId) => {
  if (!publicId) return null;
  try {
    const response = await cloudinary.uploader.destroy(publicId);
    return response;
  } catch (error) {
    console.log("Error deleting from cloudinary");
    return null;
  }
};

export { uploadOnCloudinary, deleteFromCloudinary };
