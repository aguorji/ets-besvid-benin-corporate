const Product = require('../models/Product');
const ProductionLog = require('../models/ProductionLog');

exports.logSortingRun = async (req, res) => {
  const { consignmentRef, inputGiantBales, sortedBalesProduced, byProductsYielded, remnantsRetained } = req.body;

  try {
    // ---- 1. DEDUCT INPUT GIANT BALES FROM STOCK ----
    for (const input of inputGiantBales) {
      const product = await Product.findById(input.productId);
      if (!product) {
        return res.status(404).json({ message: `Giant Bale Product ${input.itemCode} not found.` });
      }

      // Find the specific batch variation match
      const batch = product.stock_variations.find(v => v.production_ref === consignmentRef);
      if (!batch || batch.available_bales < input.bales_deducted) {
        return res.status(400).json({
          message: `Inventory Error: Insufficient stock of Giant Bale ${input.itemCode} under batch ${consignmentRef}.`
        });
      }

      // Deduct the giant bales used
      batch.available_bales -= input.bales_deducted;
      await product.save();
    }

    // ---- 2. ADD ITEMISED SORTED BALES TO ACTIVE STOCK ----
    for (const output of sortedBalesProduced) {
      const product = await Product.findById(output.productId);
      if (!product) {
        return res.status(404).json({ message: `Target Sorted Product ${output.itemCode} not found in catalog.` });
      }

      // Check if this specific item already has an array entry for this consignment batch
      let batch = product.stock_variations.find(v => v.production_ref === consignmentRef);

      if (batch) {
        // Add to existing batch totals
        batch.available_bales += output.bales_added;
      } else {
        // Create a brand new variation record block under this consignment run
        product.stock_variations.push({
          production_ref: consignmentRef,
          initial_bales_received: output.bales_added,
          available_bales: output.bales_added,
          adj_price: product.basePrice || 0 // Default starting price anchor
        });
      }
      await product.save();
    }

    // ---- 3. LOG THE ENTIRE SORTING RUN INTO HISTORY ----
    const logEntry = await ProductionLog.create({
      consignment_ref: consignmentRef,
      input_giant_bales: inputGiantBales,
      sorted_bales_produced: sortedBalesProduced,
      by_products_yielded: byProductsYielded,
      remnants_retained: remnantsRetained
    });

    return res.status(201).json({
      message: "Sorting production run processed and stock records updated successfully!",
      logId: logEntry._id
    });

  } catch (error) {
    console.error("Sorting Log Error:", error);
    return res.status(500).json({ message: "Internal server error during sorting calculation.", error: error.message });
  }
};