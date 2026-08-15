import mongoose from 'mongoose';

const claimSchema = new mongoose.Schema(
  {
    item: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
    claimant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    proofDescription: { type: String, required: true },
    proofPhotos: [{ type: String }],
    quizAnswers: [
      {
        question: String,
        answer: String,
      },
    ],
    quizScore: { type: Number, default: 0 },
    quizPassed: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'cancelled'],
      default: 'pending',
    },
    adminNotes: { type: String, default: '' },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: Date,
  },
  { timestamps: true }
);

claimSchema.index({ item: 1, claimant: 1 });

export default mongoose.model('Claim', claimSchema);
