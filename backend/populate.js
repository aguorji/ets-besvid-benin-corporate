// backend/populate.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Consignment from './models/Consignment.js';
import ProductItem from './models/ProductItem.js';

dotenv.config();

const runPopulation = async () => {
  try {
    // Connect to your MongoDB database
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ets_besvid_benin');
    console.log('Connected to MongoDB for data population...');

    // Define the items you want to populate into AA-22-26
    // (You can edit or add more item rows here as needed)
    const sampleProductionItems = [
      {
        itemCode: 'LMD',
        description: 'Ladies Mixed Dress',
        unit: 'PCS',
        standardSize: 45,
        actualSize: 45,
        balesQuantity: 10,
        priceStd: 50000,
        adjustedPrice: 50000
      },
      {
        itemCode: 'MCSH',
        description: 'Mens Cotton Shirts',
        unit: 'PCS',
        standardSize: 50,
        actualSize: 50,
        balesQuantity: 15,
        priceStd: 65000,
        adjustedPrice: 65000
      }
    ];

    // 1. Update Consignment AA-22-26 with the production items
    const updatedConsignment = await Consignment.findOneAndUpdate(
      { consignment_ref: 'AA-22-26' },
      { $set: { production_items: sampleProductionItems } },
      { new: true }
    );

    if (!updatedConsignment) {
      console.log('Consignment AA-22-26 not found in database!');
      process.exit(1);
    }

    console.log('Successfully updated consignment AA-22-26 with production items.');

    // 2. Sync these items into the global ProductItem catalog & stock variations
    for (const row of sampleProductionItems) {
      const cleanCode = row.itemCode.toUpperCase().trim();
      
      let product = await ProductItem.findOne({ itemCode: cleanCode });
      if (!product) {
        product = await ProductItem.create({
          itemCode: cleanCode,
          description: row.description,
          unit: row.unit,
          standardSize: row.standardSize,
          basePrice: row.priceStd,
          stock_variations: []
        });
      }

      // Add stock variation linked to AA-22-26
      const batchRef = `AA-22-26-${cleanCode}-${row.actualSize}KG`;
      const existsIndex = product.stock_variations.findIndex(v => v.production_ref === batchRef);

      if (existsIndex > -1) {
        product.stock_variations[existsIndex].quantity_produced = row.balesQuantity;
        product.stock_variations[existsIndex].quantity_balance = row.balesQuantity;
      } else {
        product.stock_variations.push({
          production_ref: batchRef,
          consignment_id: updatedConsignment._id,
          actual_size: row.actualSize,
          size_type: 'standard',
          quantity_produced: row.balesQuantity,
          quantity_balance: row.balesQuantity,
          base_price: row.priceStd,
          adj_price: row.adjustedPrice
        });
      }

      await product.save();
    }

    console.log('Product catalog and stock variations successfully synchronized!');
    process.exit(0);
  } catch (error) {
    console.error('Error populating data:', error);
    process.exit(1);
  }
};

runPopulation();