// backend/recoverProductionItems.js
// One-off recovery script: rebuilds a consignment's production_items array
// from ProductItem.stock_variations, which still holds the real data even
// though production_items on the Consignment document itself got wiped.
//
// Usage: node recoverProductionItems.js
// (run once from the backend/ folder, after confirming CONSIGNMENT_REF below)

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Consignment from './models/Consignment.js';
import ProductItem from './models/ProductItem.js';

dotenv.config();

const CONSIGNMENT_REF = 'ERIC-BUNDLE-08-2026';

async function recover() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('🚨 MONGO_URI missing from .env — aborting.');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('🔗 Connected to MongoDB.');

  const consignment = await Consignment.findOne({ consignment_ref: CONSIGNMENT_REF });
  if (!consignment) {
    console.error(`🚨 Consignment "${CONSIGNMENT_REF}" not found — check the ref is exact.`);
    process.exit(1);
  }

  console.log(`Current production_items count on this consignment: ${consignment.production_items?.length || 0}`);

  const products = await ProductItem.find({ 'stock_variations.consignment_id': consignment._id });
  console.log(`Found ${products.length} ProductItem documents with stock tied to this consignment.`);

  const rebuiltItems = [];
  products.forEach(product => {
    product.stock_variations
      .filter(v => v.consignment_id?.toString() === consignment._id.toString())
      .forEach(v => {
        rebuiltItems.push({
          itemCode: product.itemCode,
          description: product.description,
          unit: product.unit,
          standardSize: product.standardSize,
          actualSize: v.actual_size,
          priceStd: v.base_price,
          adjustedPrice: v.adj_price,
          balesQuantity: v.quantity_produced
        });
      });
  });

  console.log(`Reconstructed ${rebuiltItems.length} production item rows from surviving stock data.`);

  if (rebuiltItems.length === 0) {
    console.error('🚨 Nothing to restore — no matching stock_variations found. Aborting without changes.');
    process.exit(1);
  }

  consignment.production_items = rebuiltItems;
  await consignment.save();

  console.log(`✅ Restored ${rebuiltItems.length} items to ${CONSIGNMENT_REF}'s production_items.`);
  process.exit(0);
}

recover().catch(err => {
  console.error('❌ Recovery failed:', err);
  process.exit(1);
});
