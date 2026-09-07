import mongoose from 'mongoose';

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
SaleSchema.pre('save', function(next) {
  let computedGross = 0;

  // Previously this reproraded revenue based on how far actual_size
  // differed from a standard bale weight — treating the entered
  // selling_price as a per-standard-bale rate to be scaled down. That's
  // wrong for how this app is actually used: the specific batch/size is
  // already chosen before a price is entered (e.g. "CR (40KG)" picked
  // explicitly from a dropdown of distinct stock batches), so the price
  // typed in is the final agreed amount for that exact item, not a
  // standard rate needing further discounting. A CFA145,000 sale should
  // record CFA145,000, not a recalculated fraction of it.
  //
  // variance/performance still compare the entered price against the
  // catalog's target price — useful for reporting how a sale compares to
  // standard pricing — but this no longer changes revenue itself.
  for (const item of this.items) {
    item.revenue = item.quantity_sold * item.selling_price;
    item.variance = (item.selling_price - (item.set_price || item.selling_price)) * item.quantity_sold;

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