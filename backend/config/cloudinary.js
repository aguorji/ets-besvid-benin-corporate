// backend/config/cloudinary.js
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

// Using three separate plain values instead of CLOUDINARY_URL — a special
// character in the API secret (Cloudinary secrets can contain / or +)
// needs URL-encoding to work correctly inside a single combined URL
// string, and an unencoded one silently breaks the credentials. Same
// category of issue as the admin password '#' character problem earlier —
// plain separate values avoid the whole risk entirely.
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;