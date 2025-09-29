const Item = require('../models/Item');

async function listItems(filter = {}) {
  return Item.find(filter).sort({ createdAt: -1 }).lean();
}

async function createItem(data) {
  const item = new Item(data);
  return item.save();
}

async function claimItem(id, userId) {
  const item = await Item.findById(id);
  if (!item) return null;
  // anyone can claim; owner often won't claim their own found item
  item.claimed = true;
  await item.save();
  return item;
}

async function removeItem(id, userId) {
  const item = await Item.findById(id);
  if (!item) return null;
  if (String(item.userId) !== String(userId)) {
    const err = new Error('Not allowed');
    err.status = 403;
    throw err;
  }
  await item.deleteOne();
  return true;
}

async function updateItem(id, userId, updates) {
  const item = await Item.findById(id);
  if (!item) return null;
  if (String(item.userId) !== String(userId)) {
    const err = new Error('Not allowed');
    err.status = 403;
    throw err;
  }
  Object.assign(item, updates);
  await item.save();
  return item;
}

module.exports = { listItems, createItem, claimItem, removeItem, updateItem };
