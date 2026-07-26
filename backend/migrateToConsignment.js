// backend/migrateToConsignment.js

import mongoose from 'mongoose';
import dotenv from 'dotenv'; //  Added to load your secure framework credentials
import Consignment from './models/Consignment.js';
import ProductItem from './models/ProductItem.js';
import Sale from './models/Sale.js';

// Load the environment variables from your configuration file
dotenv.config(); 

// Grab the connection string that your main server uses, falling back to local if blank
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ets-besvid-benin'; 

mongoose.connect(MONGO_URI)
  .then(() => console.log("💾 MongoDB Connected to Secure Framework for Structural Ledger Migration..."))
  .catch(err => console.error("Database connection error:", err));

// ... keep the rest of the file exactly the same as before ...

async function runMigration() {
  try {
    console.log("🚀 Starting Consignment System Integration Pipeline...");

    // 1. Create a Default Baseline Consignment Record
    let legacyConsignment = await Consignment.findOne({ consignment_ref: 'INIT-BATCH-2026' });
    if (!legacyConsignment) {
      legacyConsignment = await Consignment.create({
        consignment_ref: 'INIT-BATCH-2026',
        arrival_date: new Date('2026-01-01'),
        status: 'Active',
        cost_pool: {
          base_purchase_cost: 0,
          sea_freight: 0,
          port_clearing_fees: 0,
          terminal_handling: 0,
          inbound_remnant_value_injected: 0
        },
        operating_expenses: [{ description: 'System Architecture Migration Initial Setup', amount: 0 }]
      });
      console.log(`✅ Created Baseline Consignment Master: ${legacyConsignment.consignment_ref}`);
    }

    // 2. Map existing product variations to this Consignment ID in ProductItem
    const products = await ProductItem.find({});
    let updatedProductsCount = 0;

    for (let product of products) {
      let modified = false;
      if (product.stock_variations && product.stock_variations.length > 0) {
        product.stock_variations = product.stock_variations.map(variation => {
          // If the variation lacks a reference link, anchor it to our baseline record
          if (!variation.consignment_id) {
            variation.consignment_id = legacyConsignment._id;
            modified = true;
          }
          return variation;
        });
      }
      if (modified) {
        await product.save();
        updatedProductsCount++;
      }
    }
    console.log(`✅ Structural changes applied across ${updatedProductsCount} product items.`);

    // 3. Link past sales commits to this baseline consignment
    const salesUpdateResult = await Sale.updateMany(
      { "items.consignment_id": { $exists: false } }, 
      { $set: { "items.$[].consignment_id": legacyConsignment._id } }
    );
    console.log(`✅ Updated historical sales records: ${salesUpdateResult.modifiedCount} line items linked.`);

    console.log("🎉 Integration completed successfully! System is fully aligned.");
    mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration encountered a critical error:", error);
    mongoose.connection.close();
    process.exit(1);
  }
}

runMigration();