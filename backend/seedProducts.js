// backend/seedProducts.js
import mongoose from 'mongoose';
import ProductItem from './models/ProductItem.js';
import dotenv from 'dotenv';

dotenv.config();

// Replace with your actual MongoDB URI if not using environment variables
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/your_database_name';

const initialProducts = [
  {
    itemCode: 'LMD',
    description: 'Ladies Mixed Dress',
    unit: 'PCS', // Dynamic Unit
    standardSize: 100, // 100 pieces per bale
    basePrice: 120000 // Base price for standard bale
  },
  {
    itemCode: 'MCSH',
    description: 'Mens Cotton Shirts',
    unit: 'KGS', // Dynamic Unit
    standardSize: 55, // 55 kg bale
    basePrice: 95000
  },
  {
    itemCode: 'PODR',
    description: 'Polo Dresses',
    unit: 'PCS',
    standardSize: 80,
    basePrice: 110000
  },
  {
    itemCode: 'TROUSERS',
    description: 'Chino & Denim Trousers',
    unit: 'KGS',
    standardSize: 50,
    basePrice: 85000
  }
];

async function seedDatabase() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected successfully!');

    // Optional: Uncomment the next line if you want to wipe the catalog first
    // await ProductItem.deleteMany({});

    for (const prod of initialProducts) {
      // Upsert: updates if already exists, inserts if brand new
      await ProductItem.findOneAndUpdate(
        { itemCode: prod.itemCode.toUpperCase() },
        prod,
        { upsert: true, new: true }
      );
    }

    console.log('🎉 Database catalog successfully seeded!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seedDatabase();