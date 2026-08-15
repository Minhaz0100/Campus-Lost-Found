import mongoose from 'mongoose';

const locationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    lat: { type: Number },
    lng: { type: Number },
  },
  { _id: false }
);

const itemSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['lost', 'found'], required: true },
    name: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: [
        'Electronics',
        'ID Card',
        'Wallet',
        'Keys',
        'Books',
        'Clothing',
        'Accessories',
        'Documents',
        'Sports',
        'Other',
      ],
      required: true,
    },
    description: { type: String, required: true },
    location: { type: locationSchema, required: true },
    dateTime: { type: Date, required: true },
    photos: [{ type: String }],
    imageHash: { type: String },
    imageFeatures: [{ type: Number }],
    reward: { type: Number, default: 0 },
    rewardPaid: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ['lost', 'found', 'claimed', 'returned', 'closed'],
      default: function () {
        return this.type === 'lost' ? 'lost' : 'found';
      },
    },
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    isAnonymous: { type: Boolean, default: false },
    isApproved: { type: Boolean, default: true },
    isEmergency: { type: Boolean, default: false },
    serialNumber: { type: String, trim: true },
    barcode: { type: String, trim: true },
    ocrText: { type: String, default: '' },
    keywords: [{ type: String }],
    qrCode: { type: String },
    qrCodeDataUrl: { type: String },
    matchedItems: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Item' }],
    matchScore: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
    claimCount: { type: Number, default: 0 },
    verificationQuestions: [
      {
        question: String,
        answer: String,
      },
    ],
    duplicateWarning: { type: Boolean, default: false },
    duplicateOf: { type: mongoose.Schema.Types.ObjectId, ref: 'Item' },
  },
  { timestamps: true }
);

itemSchema.index({ name: 'text', description: 'text', keywords: 'text', ocrText: 'text' });
itemSchema.index({ category: 1, status: 1, type: 1 });
itemSchema.index({ 'location.lat': 1, 'location.lng': 1 });
itemSchema.index({ serialNumber: 1 });
itemSchema.index({ barcode: 1 });

export default mongoose.model('Item', itemSchema);
