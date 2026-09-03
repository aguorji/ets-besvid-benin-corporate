import mongoose from 'mongoose';
import ProductItem from './ProductItem.js';

const SaleItemSchema = new mongoose.Schema({
  // Connected directly to your product inventory variant layout (Optional for Byproducts)
  product_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'ProductItem', 
    required: false 
  },
  production_ref: { 
    type: String, 
    required: false 
  },
  consignment_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Consignment', 
    required: false 
  },
  
  // Added to differentiate standard goods from byproducts
  item_name: { 
    type: String, 
    required: true 
  },
  
  is_adjusted_bale: { 
    type: Boolean, 
    default: false 
  },
  actual_size: { 
    type: Number, 
    required: false 
  },
  quantity_sold: { 
    type: Number, 
    required: true, 
    default: 1 
  },
  set_price: { 
    type: Number, 
    required: false,
    default: 0 
  },
  selling_price: { 
    type: Number, 
    required: true 
  },
  
  revenue: { 
    type: Number, 
    required: true, 
    default: 0 
  },
  variance: { 
    type: Number, 
    required: true, 
    default: 0 
  },
  performance: { 
    type: String, 
    enum: ['Above Target', 'On Target', 'Below Target'],
    default: 'On Target'
  }
});

const SaleSchema = new mongoose.Schema({
  // Category tag to isolate main commercial sales from byproduct salvage
  sale_type: {
    type: String,
    enum: ['Standard', 'Byproduct'],
    default: 'Standard'
  },
  customer_name: { 
    type: String, 
    required: true 
  },
  date: { 
    type: Date, 
    default: Date.now 
  },
  items: [SaleItemSchema], 

  gross_revenue: { 
    type: Number, 
    required: true, 
    default: 0 
  },
  payment_type: { 
    type: String, 
    enum: ['Cash', 'Part Payment', 'Credit'], 
    required: true 
  },
  amount_paid: { 
    type: Number, 
    required: true, 
    default: 0 
  },
  balance: { 
    type: Number, 
    required: true, 
    default: 0 
  },
  debt_status: { 
    type: String, 
    enum: ['N/A', 'Owing', 'Settled'], 
    default: 'N/A' 
  },
  
  // Crucial: Tracks which staff member processed this invoice
  recorded_by: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  }
}, { timestamps: true });


// --- AUTOMATED ACCOUNTING ENGINE ---
SaleSchema.pre('save', async function(next) {
  let computedGross = 0;

  // Previously this hook assumed every item's standard bale weight was
  // exactly 55kg. Real product data has standard sizes of 55, 60, 65, 80,
  // and PCS-based items at 200-400 — any item that wasn't literally 55kg
  // had its revenue and variance computed against the wrong baseline.
  // Look up each item's actual standard size and unit instead.
  const itemCodes = [...new Set(this.items.map(i => (i.item_name || '').toUpperCase().trim()).filter(Boolean))];
  const products = await ProductItem.find({ itemCode: { $in: itemCodes } }).lean();
  const productMap = new Map(products.map(p => [p.itemCode, p]));

  for (const item of this.items) {
    const product = productMap.get((item.item_name || '').toUpperCase().trim());
    const standardWeight = product?.standardSize || 55; // fall back to 55 only if the item genuinely isn't in the catalog
    const isWeightBased = (product?.unit || 'KGS') === 'KGS';

    const expectedStandardMass = item.quantity_sold * standardWeight;

    // The weight-variance math only makes sense for KGS-based bales, where
    // "actual weight differs from standard weight" is a meaningful concept.
    // For PCS-based items (counted pieces, not weighed), it was previously
    // being applied anyway, mixing unrelated units together.
    if (isWeightBased && item.actual_size && Number(item.actual_size) !== expectedStandardMass && item.set_price > 0) {
      const effectivePricePerKg = item.selling_price / standardWeight;
      const effectiveTargetPricePerKg = item.set_price / standardWeight;

      const rawRevenue = Number(item.actual_size) * effectivePricePerKg;
      const rawVariance = (effectivePricePerKg - effectiveTargetPricePerKg) * Number(item.actual_size);

      item.revenue = Math.round(rawRevenue * 100) / 100;
      item.variance = Math.round(rawVariance * 100) / 100;
    } else {
      // Clean processing rules for standard items, PCS-based items, and byproducts
      item.revenue = item.quantity_sold * item.selling_price;
      item.variance = (item.selling_price - (item.set_price || item.selling_price)) * item.quantity_sold;
    }

    // Determine performance health indicators
    if (item.variance > 0) item.performance = 'Above Target';
    else if (item.variance === 0) item.performance = 'On Target';
    else item.performance = 'Below Target';

    computedGross += item.revenue;
  }

  // Consolidate final document summary fields
  this.gross_revenue = Math.round(computedGross * 100) / 100;

  // Manage invoice structural layout balances and debt profiling rules
  if (this.payment_type === 'Cash') {
    this.amount_paid = this.gross_revenue;
    this.balance = 0;
    this.debt_status = 'N/A';
  } else {
    const rawBalance = this.gross_revenue - this.amount_paid;
    this.balance = Math.round(rawBalance * 100) / 100;
    this.debt_status = this.balance > 0 ? 'Owing' : 'Settled';
  }
  next();
});

export default mongoose.model('Sale', SaleSchema);