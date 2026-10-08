import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";
import "dotenv/config";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req: any, file) => ({
    folder: "profile_pics",
    allowed_formats: ["jpeg", "png", "jpg"],
    public_id: `user_${req.user?.id}_${Date.now()}`,
  }),
});

export const upload = multer({ storage });