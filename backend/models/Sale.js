import mongoose from 'mongoose';

const SaleItemSchema = new mongoose.Schema({
  // Connected directly to your product inventory variant layout
  product_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'ProductItem', 
    required: true 
  },
  production_ref: { 
    type: String, 
    required: true 
  },
  consignment_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Consignment', 
    required: true 
  },
  
  is_adjusted_bale: { 
    type: Boolean, 
    default: false 
  },
  actual_size: { 
    type: Number, 
    required: true 
  },
  quantity_sold: { 
    type: Number, 
    required: true, 
    default: 1 
  },
  set_price: { 
    type: Number, 
    required: true 
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
    enum: ['Above Target', 'On Target', 'Below Target'] 
  }
});

const SaleSchema = new mongoose.Schema({
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
  
  recorded_by: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  }
}, { timestamps: true });


// --- AUTOMATED ACCOUNTING ENGINE ---
SaleSchema.pre('save', function(next) {
  let computedGross = 0;
  const STANDARD_WEIGHT = 55; // Default baseline mass per standard bale (in KG)

  this.items.forEach(item => {
    // ⚖️ Weight Variance Engine: Evaluate deviation from target standard weights
    const expectedStandardMass = item.quantity_sold * STANDARD_WEIGHT;

    if (item.actual_size && Number(item.actual_size) !== expectedStandardMass) {
      // Dynamic scaling for exact fractional or variable weight metrics
      const effectivePricePerKg = item.selling_price / STANDARD_WEIGHT;
      const effectiveTargetPricePerKg = item.set_price / STANDARD_WEIGHT;
      
      const rawRevenue = Number(item.actual_size) * effectivePricePerKg;
      const rawVariance = (effectivePricePerKg - effectiveTargetPricePerKg) * Number(item.actual_size);

      // Secure clean two-decimal financial currency boundaries
      item.revenue = Math.round(rawRevenue * 100) / 100;
      item.variance = Math.round(rawVariance * 100) / 100;
    } else {
      // Clean processing rules for standard uniform packaging batches
      item.revenue = item.quantity_sold * item.selling_price;
      item.variance = (item.selling_price - item.set_price) * item.quantity_sold;
    }

    // Determine performance health indicators
    if (item.variance > 0) item.performance = 'Above Target';
    else if (item.variance === 0) item.performance = 'On Target';
    else item.performance = 'Below Target';

    computedGross += item.revenue;
  });

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