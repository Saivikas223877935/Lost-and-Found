const bcrypt = require('bcryptjs');
const User = require('../models/user');

async function createUser({ name, email, password }) {
  const exists = await User.findOne({ email });
  if (exists) throw new Error('Email already in use');
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, passwordHash });
  return user.toObject();
}

async function findUserByEmail(email) {
  return User.findOne({ email });
}

async function verifyUser(email, password) {
  const user = await findUserByEmail(email);
  if (!user) return null;
  const ok = await bcrypt.compare(password, user.passwordHash);
  return ok ? user : null;
}

module.exports = { createUser, verifyUser, findUserByEmail };
