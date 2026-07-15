import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

async function reset() {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) {
      console.error("🚨 Error: MONGO_URI is missing from .env!");
      process.exit(1);
    }

    console.log("⏳ Connecting to MongoDB Atlas...");
    await mongoose.connect(uri);
    console.log("🔗 Connected!");

    // 1. Manually hash the password exactly once
    const salt = await bcrypt.genSalt(10);
    const exactHash = await bcrypt.hash('SecureAdmin2026!', salt);

    // 2. Use updateOne to bypass Mongoose "pre-save" middleware entirely
    const result = await User.updateOne(
      { email: 'admin@etsbesvid.com' },
      { 
        $set: { 
          name: "Managing Director",
          password: exactHash,
          role: "admin",
          is_active: true
        } 
      },
      { upsert: true } // If the user doesn't exist, create them
    );

    console.log("⚙️ Database update operation complete.");
    
    // 3. Verify immediately in the script if bcrypt can match it
    const verifiedUser = await User.findOne({ email: 'admin@etsbesvid.com' });
    const doesMatch = await bcrypt.compare('SecureAdmin2026!', verifiedUser.password);
    
    if (doesMatch) {
      console.log("✅ SUCCESS! Terminal verification passed. Password matches perfectly.");
    } else {
      console.error("❌ ERROR: Terminal verification failed. Passwords do not match.");
    }

    process.exit(0);
  } catch (error) {
    console.error("🚨 Reset failed:", error.message);
    process.exit(1);
  }
}

reset();