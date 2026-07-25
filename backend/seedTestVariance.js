import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js'; 
import ProductItem from './models/ProductItem.js'; // Corrected model import
import Consignment from './models/Consignment.js';
import Sale from './models/Sale.js';

dotenv.config();

const seedAndTestMetrics = async () => {
  try {
    console.log("Connecting to database engine...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Database connection successful.\n");

    console.log("Cleaning up target test collections...");
    await User.deleteMany({ email: 'audit-test@goldenorchid.com' });
    await Sale.deleteMany({});
    await ProductItem.deleteMany({ itemCode: 'COT-IND-01' });
    await Consignment.deleteMany({ consignment_ref: 'CONSIGN-2026-001' });

    console.log("\n[1/4] Seeding operational audit user...");
    const mockAdmin = await User.create({
      name: "System Auditor",
      email: "audit-test@goldenorchid.com",
      password: "hashed_dummy_password",
      role: "admin"
    });

    console.log("\n[2/4] Seeding consignment tracking instance...");
    const testConsignment = await Consignment.create({
      consignment_ref: "CONSIGN-2026-001",
      supplier_name: "Global Textiles Import Ltd",
      arrival_date: new Date(),
      status: "Active"
    });

    console.log("\n[3/4] Seeding ProductItem catalog matching actual schema parameters...");
    const testProduct = await ProductItem.create({
      itemCode: "COT-IND-01",
      description: "Premium Cotton Bale Grade A",
      unit: "KGS",
      standardSize: 55,
      basePrice: 12000, // Correct schema property
      stock_variations: [
        {
          production_ref: "CONSIGN-2026-001",
          consignment_id: testConsignment._id, // Enforce required validator
          actual_size: 2750, 
          size_type: "standard",
          quantity_produced: 50,
          quantity_sold: 0,
          base_price: 11000,
          adj_price: 11000
        }
      ]
    });
    console.log(`ProductItem registered: ${testProduct.itemCode}`);

    console.log("\n[4/4] Executing wholesale transaction payload...");
    const testInvoice = new Sale({
      customer_name: "Chidi & Sons Enterprises",
      date: new Date(),
      payment_type: "Part Payment",
      amount_paid: 15000,
      recorded_by: mockAdmin._id,
      items: [
        {
          product_id: testProduct._id,
          production_ref: "CONSIGN-2026-001",
          consignment_id: testConsignment._id,
          is_adjusted_bale: true,
          actual_size: 115, 
          quantity_sold: 2,
          set_price: 12000,
          selling_price: 12500
        }
      ]
    });

    await testInvoice.save();
    console.log("Transaction successfully recorded down database pipeline!");

    console.log("\n==================================================");
    console.log("📊 LIVE PRE-SAVE ACCOUNTING METRICS RESULTS");
    console.log("==================================================");
    console.log(`Invoice reference key:   ${testInvoice._id}`);
    console.log(`Gross calculated revenue: ₦${testInvoice.gross_revenue}`);
    console.log(`Amount collected:         ₦${testInvoice.amount_paid}`);
    console.log(`Outstanding Balance:      ₦${testInvoice.balance}`);
    console.log(`Automated Debt Status:   [${testInvoice.debt_status}]`);
    console.log("==================================================\n");

    await mongoose.disconnect();
    process.exit(0);

  } catch (error) {
    console.error("❌ CRITICAL INITIALIZATION SCRIPTER FAULT:", error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

seedAndTestMetrics();