// backend/migrateToConsignment.js
const mongoose = require('mongoose');
const Consignment = require('./models/Consignment'); // Check your exact path
const Product = require('./models/Product');         // Check your exact path
// If you have a Sale model, require it here:
// const Sale = require('./models/Sale'); 

// Connect to your local MongoDB setup
mongoose.connect('mongodb://localhost:27017/your_database_name')
  .then(() => console.log("💾 MongoDB Connected for Migration..."))
  .catch(err => console.error("Database connection error:", err));

async function runMigration() {
  try {
    console.log("🚀 Starting Consignment System Integration...");

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

    // 2. Map existing product variations to this Consignment ID
    const products = await Product.find({});
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
    console.log(`✅ Structural changes applied across ${updatedProductsCount} product documents.`);

    // 3. Link past sales commits to this baseline consignment
    // If your Sale/Invoice model matches, uncomment this section to update past sales:
    /*
    const salesUpdateResult = await Sale.updateMany(
      { "items.consignmentId": { $exists: false } }, 
      { $set: { "items.$[].consignmentId": legacyConsignment._id } }
    );
    console.log(`✅ Updated historical sales records: ${salesUpdateResult.modifiedCount} line items linked.`);
    */

    console.log("🎉 Integration completed successfully! Ready for the new chapter.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration encountered a critical error:", error);
    process.exit(1);
  }
}

runMigration();