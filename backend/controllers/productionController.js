import ProductItem from '../models/ProductItem.js';
import ProductionLog from '../models/ProductionLog.js'; // Ensure ProductionLog.js uses export default

export const logSortingRun = async (req, res) => {
  const { consignmentRef, inputGiantBales, sortedBalesProduced, byProductsYielded, remnantsRetained } = req.body;

  try {
    // Track unique modified products to save them safely at the end of each block
    let modifiedInputProducts = [];
    let modifiedOutputProducts = [];

    // ---- 1. DEDUCT INPUT GIANT BALES FROM STOCK ----
    for (const input of inputGiantBales) {
      const product = await ProductItem.findById(input.productId);
      if (!product) {
        return res.status(404).json({ message: `Giant Bale Product ${input.itemCode} not found.` });
      }

      // Find the specific batch variation match using 'production_ref'
      const batch = product.stock_variations.find(v => v.production_ref === consignmentRef);
      
      // Fixed property name check to match your actual schema ('quantity_balance')
      if (!batch || batch.quantity_balance < input.bales_deducted) {
        return res.status(400).json({
          message: `Inventory Error: Insufficient stock of Giant Bale ${input.itemCode} under batch ${consignmentRef}.`
        });
      }

      // Deduct the giant bales used from active inventory balance
      batch.quantity_balance -= input.bales_deducted;
      
      if (!modifiedInputProducts.some(p => p._id.toString() === product._id.toString())) {
        modifiedInputProducts.push(product);
      }
    }

    // Save all stock deductions outside the loop loop safely
    for (const doc of modifiedInputProducts) {
      await doc.save();
    }

    // ---- 2. ADD ITEMISED SORTED BALES TO ACTIVE STOCK ----
    for (const output of sortedBalesProduced) {
      const product = await ProductItem.findById(output.productId);
      if (!product) {
        return res.status(404).json({ message: `Target Sorted Product ${output.itemCode} not found in catalog.` });
      }

      // Check if this specific item already has an array entry for this consignment batch
      let batch = product.stock_variations.find(v => v.production_ref === consignmentRef);

      if (batch) {
        // Add to existing batch totals tracking
        batch.quantity_produced += output.bales_added;
        batch.quantity_balance += output.bales_added;
      } else {
        // Create a brand new variation record block matching your actual database schema properties
        product.stock_variations.push({
          production_ref: consignmentRef,
          consignment_id: output.consignmentId || product._id, // Fallback safety linking back to ID layout
          actual_size: product.standardSize || 55,
          size_type: 'standard',
          quantity_produced: output.bales_added,
          quantity_balance: output.bales_added,
          base_price: product.basePrice || 0,
          adj_price: product.basePrice || 0 // Default starting price anchor
        });
      }
      
      if (!modifiedOutputProducts.some(p => p._id.toString() === product._id.toString())) {
        modifiedOutputProducts.push(product);
      }
    }

    // Save all additions safely
    for (const doc of modifiedOutputProducts) {
      await doc.save();
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
      success: true,
      message: "Sorting production run processed and stock records updated successfully!",
      logId: logEntry._id
    });

  } catch (error) {
    console.error("Sorting Log Error:", error);
    return res.status(500).json({ message: "Internal server error during sorting calculation.", error: error.message });
  }
};