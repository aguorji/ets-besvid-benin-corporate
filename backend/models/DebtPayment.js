import mongoose from 'mongoose';

const DebtPaymentSchema = new mongoose.Schema({
  sale_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sale',
    required: true
  },
  customer_name: {
    type: String,
    required: true
  },
  amount_paid: {
    type: Number,
    required: true,
    min: [0.01, 'Payment amount must be greater than zero']
  },
  payment_date: {
    type: Date,
    default: Date.now
  },
  payment_method: {
    type: String,
    enum: ['Cash', 'Bank Transfer', 'Cheque', 'POS'],
    default: 'Cash'
  },
  notes: {
    type: String,
    default: ''
  },
  recorded_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

export default mongoose.model('DebtPayment', DebtPaymentSchema);