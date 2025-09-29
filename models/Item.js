const mongoose = require('mongoose');
const { Schema } = mongoose;

const ItemSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    type: { type: String, enum: ['lost', 'found'], required: true },
    date: { type: Date, required: true },               // when lost/found
    location: { type: String, required: true },
    imageUrl: { type: String, default: '' },            // e.g., "images/image1.png"
    contactEmail: { type: String, required: true },
    claimed: { type: Boolean, default: false }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Item', ItemSchema);
