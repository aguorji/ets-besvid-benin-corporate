import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Load environment configurations
dotenv.config();

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'manager', 'staff'], default: 'staff' }
});

// Avoid re-compiling the model if it already exists
const User = mongoose.models.User || mongoose.model('User', userSchema);

async function seed() {
  try {
    // Dynamically pull your working direct connection string from your .env file
    const uri = process.env.MONGO_URI;

    if (!uri) {
      console.error("🚨 Error: MONGO_URI is missing from your .env file!");
      process.exit(1);
    }

    console.log("⏳ Establishing clean connection to MongoDB Atlas...");
    await mongoose.connect(uri);
    console.log("🔗 Connected successfully!");

    // Search for the admin using the correct variable name
    const adminUser = await User.findOne({ email: 'admin@etsbesvid.com' });

    if (adminUser) {
      console.log('🔄 Administrator exists. Updating password to ensure sync...');
      const salt = await bcrypt.genSalt(10);
      adminUser.password = await bcrypt.hash('SecureAdmin2026!', salt);
      await adminUser.save();
      console.log('✔️ Password updated successfully to SecureAdmin2026!');
      process.exit(0);
    }

    // If admin doesn't exist at all, create a new one
    console.log('🆕 Administrator not found. Creating a fresh root account...');
    const hashedPassword = await bcrypt.hash('SecureAdmin2026!', 12);

    await User.create({
      name: "Managing Director",
      email: "admin@etsbesvid.com",
      password: hashedPassword,
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