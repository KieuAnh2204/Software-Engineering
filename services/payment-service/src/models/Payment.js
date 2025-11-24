const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Order ID is required'],
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'User ID is required'],
      index: true,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
    currency: {
      type: String,
      default: 'VND',
      uppercase: true,
    },
    provider: {
      type: String,
      enum: ['vnpay'],
      default: 'vnpay',
      index: true,
    },
    status: {
      type: String,
      enum: ['created', 'pending', 'paid', 'failed', 'cancelled', 'expired'],
      default: 'created',
      index: true,
    },
    paymentUrl: { type: String },
    returnUrl: { type: String },
    clientIp: { type: String },

    // VNPAY specific fields
    vnp_TxnRef: { type: String, index: true },
    vnp_TransactionNo: { type: String },
    vnp_ResponseCode: { type: String },
    vnp_BankCode: { type: String },
    vnp_CardType: { type: String },
    vnp_PayDate: { type: String }, // yyyyMMddHHmmss

    checksumVerified: { type: Boolean, default: false },
    webhookVerified: { type: Boolean, default: false },

    failureReason: {
      type: String,
      maxlength: [500, 'Failure reason cannot exceed 500 characters'],
    },
    metadata: {
      type: Map,
      of: String,
    },

    expiresAt: { type: Date },
    paidAt: { type: Date },
    webhookReceivedAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

// Indexes
paymentSchema.index({ userId: 1, createdAt: -1 });
paymentSchema.index({ vnp_TxnRef: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Payment', paymentSchema);
