const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017/lostfound';

const userSchema = new mongoose.Schema({
  name: String, email: String, passwordHash: String
});
const itemSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  title: String, description: String, type: String,
  date: Date, location: String, imageUrl: String, contactEmail: String, claimed: Boolean
});
const User = mongoose.model('User', userSchema);
const Item = mongoose.model('Item', itemSchema);

async function main() {
  await mongoose.connect(MONGO_URL);
  console.log('[seed] connected');

  await User.deleteMany({});
  await Item.deleteMany({});

  const passwordHash = await bcrypt.hash('password123', 10);
  const u = await User.create({ name: 'Demo User', email: 'demo@example.com', passwordHash });

  const demo = [
    {
      userId: u._id,
      title: 'Black Backpack',
      description: 'Medium size, contains notebooks',
      type: 'lost',
      date: new Date(),
      location: 'Deakin Library',
      imageUrl: 'images/image1.png',
      contactEmail: 'demo@example.com',
      claimed: false
    },
    {
      userId: u._id,
      title: 'Silver Water Bottle',
      description: 'Stainless steel, no stickers',
      type: 'found',
      date: new Date(),
      location: 'Building KA foyer',
      imageUrl: 'images/image2.png',
      contactEmail: 'demo@example.com',
      claimed: false
    }
  ];

  await Item.insertMany(demo);
  console.log('[seed] user: demo@example.com / password123');
  console.log('[seed] items inserted:', await Item.countDocuments());
  await mongoose.disconnect();
  console.log('[seed] done');
}

main().catch(err => { console.error(err); process.exit(1); });
