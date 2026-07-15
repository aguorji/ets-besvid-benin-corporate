import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js'; // Ensure this path is correct relative to seedAdmin.js

dotenv.config();

async function seed() {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) {
      console.error("🚨 Error: MONGO_URI is missing from your .env file!");
      process.exit(1);
    }

    console.log("⏳ Establishing clean connection to MongoDB Atlas...");
    await mongoose.connect(uri);
    console.log("🔗 Connected successfully!");

    // Search for existing admin
    const adminUser = await User.findOne({ email: 'admin@etsbesvid.com' });

    if (adminUser) {
      console.log('🔄 Administrator exists. Updating password to ensure sync...');
      // Pass PLAIN TEXT. The model's pre-save middleware will automatically hash it!
      adminUser.password = 'SecureAdmin2026!'; 
      await adminUser.save();
      console.log('✔️ Password updated successfully to SecureAdmin2026!');
      process.exit(0);
    }

    console.log('🆕 Administrator not found. Creating a fresh root account...');
    // Pass PLAIN TEXT. The model's pre-save middleware will automatically hash it!
    await User.create({
      name: "Managing Director",
      email: "admin@etsbesvid.com",
      password: "SecureAdmin2026!", 
      role: "admin"
    });

    console.log("🎉 Success! Root system administrator account provisioned flawlessly.");
    process.exit(0);
  } catch (error) {
    console.error("🚨 Seeding failed:", error.message);
    process.exit(1);
  }
}

seed();