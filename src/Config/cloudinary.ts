import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import logger from '../Utils/logger';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadToCloudinary = async (fileBuffer: Buffer): Promise<string | null> => {
  return new Promise((resolve) => {
    logger.info('Cloudinary: Uploading image...');
    
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: 'fake-news-detection' },
      (error: any, result: any) => {
        if (error) {
          logger.error(`Cloudinary Upload Error: ${error.message}`);
          return resolve(null);
        }
        logger.info(`Cloudinary: Image uploaded successfully`);
        resolve(result?.secure_url || null);
      }
    );

    uploadStream.end(fileBuffer);
  });
};