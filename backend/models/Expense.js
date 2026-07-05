import mongoose from 'mongoose';

const ExpenseSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  category: {
    type: String,
    required: true,
    enum: ['Port logistics', 'Magazine Rent', 'Fuel & Transport', 'Staff Wages', 'Utilities', 'Others']
  },
  description: { type: String, required: true },
  amount: { type: Number, required: true, min: 0 },
  recorded_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

export default mongoose.model('Expense', ExpenseSchema);
