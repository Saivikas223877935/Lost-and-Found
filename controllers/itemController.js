const { listItems, createItem, claimItem, removeItem, updateItem } = require('../services/itemService');

exports.getItems = async (req, res) => {
  try {
    const { type, mine } = req.query;
    const filter = {};
    if (type) filter.type = type;
    if (mine === '1' && req.user) filter.userId = req.user.id;
    const items = await listItems(filter);
    res.json({ statusCode: 200, data: items, message: 'Success' });
  } catch (e) {
    console.error('[items:get] error:', e);
    res.status(500).json({ statusCode: 500, message: e.message });
  }
};

exports.postItem = async (req, res) => {
  try {
    const io = req.app.get('io');
    const payload = req.body;

    ['title', 'type', 'date', 'location', 'contactEmail'].forEach((f) => {
      if (!payload[f]) throw new Error(`Missing field: ${f}`);
    });

    payload.userId = req.user.id;

    if (req.file) {
      payload.imageUrl = `/uploads/${req.file.filename}`;
      console.log('[items:create] image saved at', payload.imageUrl);
    } else if (payload.imageUrl) {
      console.log('[items:create] using provided imageUrl', payload.imageUrl);
    }

    const created = await createItem(payload);
    io.emit('item:new', { id: created._id, title: created.title, type: created.type });
    res.status(201).json({ statusCode: 201, data: created, message: 'Created' });
  } catch (e) {
    console.error('[items:create] error:', e.message);
    res.status(400).json({ statusCode: 400, message: e.message });
  }
};

exports.claim = async (req, res) => {
  try {
    const io = req.app.get('io');
    const updated = await claimItem(req.params.id, req.user?.id);
    if (!updated) return res.status(404).json({ statusCode: 404, message: 'Not found' });
    io.emit('item:claimed', { id: updated._id });
    res.json({ statusCode: 200, data: updated, message: 'Claimed' });
  } catch (e) {
    console.error('[items:claim] error:', e.message);
    res.status(400).json({ statusCode: 400, message: e.message });
  }
};

exports.remove = async (req, res) => {
  try {
    await removeItem(req.params.id, req.user.id);
    res.json({ statusCode: 200, message: 'Removed' });
  } catch (e) {
    console.error('[items:remove] error:', e.message);
    res.status(e.status || 400).json({ statusCode: e.status || 400, message: e.message });
  }
};

exports.update = async (req, res) => {
  try {
    const updates = {};
    if (req.file) {
      updates.imageUrl = `/uploads/${req.file.filename}`;
      console.log('[items:update] image saved at', updates.imageUrl);
    } else {
      ['title', 'description', 'date', 'location', 'imageUrl', 'contactEmail', 'type', 'claimed'].forEach((f) => {
        if (f in req.body) updates[f] = req.body[f];
      });
    }

    const saved = await updateItem(req.params.id, req.user.id, updates);
    if (!saved) return res.status(404).json({ statusCode: 404, message: 'Not found' });
    res.json({ statusCode: 200, data: saved, message: 'Updated' });
  } catch (e) {
    console.error('[items:update] error:', e.message);
    res.status(e.status || 400).json({ statusCode: e.status || 400, message: e.message });
  }
};
