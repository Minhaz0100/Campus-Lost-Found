import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema(
  {
    item: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reason: {
      type: String,
      enum: ['fake', 'duplicate', 'inappropriate', 'spam', 'other'],
      required: true,
    },
    description: { type: String, default: '' },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'resolved', 'dismissed'],
      default: 'pending',
    },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    adminNotes: { type: String, default: '' },
  },
  { timestamps: true }
);

export default mongoose.model('Report', reportSchema);
