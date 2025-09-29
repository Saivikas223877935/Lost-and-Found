const mongoose = require('mongoose');

module.exports = async (mongoUrl) => {
  mongoose.set('strictQuery', true);
  await mongoose.connect(mongoUrl);
  console.log('Connected to MongoDB');
  return mongoose.connection;
};
