import mongoose from 'mongoose';

const ExpenseSchema = new mongoose.Schema({
  // Missing before — consignmentRoutes.js's reconciliation query does
  // Expense.find({ consignment_id: cId }), which always matched zero
  // documents since this field never existed. totalExpenses in every
  // Financial Reconciliation view has been silently reading 0 as a result.
  consignment_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Consignment',
    required: true
  },
  date: { 
    type: Date, 
    default: Date.now 
  },
  category: {
    type: String,
    required: true,
    enum: ['Port logistics', 'Magazine Rent', 'Fuel & Transport', 'Staff Wages', 'Utilities', 'Others']
  },
  description: { 
    type: String, 
    required: true 
  },
  amount: { 
    type: Number, 
    required: true, 
    min: 0 
  },
  recorded_by: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  }
}, { timestamps: true });

export default mongoose.model('Expense', ExpenseSchema);