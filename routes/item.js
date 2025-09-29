const fs = require('fs');
const path = require('path');
const router = require('express').Router();
const multer = require('multer');
const controller = require('../controllers/itemcontroller');
const auth = require('../middleware/auth');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '..', 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });

// Multer: accept images only, limit 5 MB
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname) || '';
    const base = path.basename(file.originalname, ext).replace(/\s+/g, '_');
    cb(null, `${Date.now()}_${base}${ext}`);
  }
});
const fileFilter = (req, file, cb) => {
  if (!file.mimetype.startsWith('image/')) {
    return cb(new Error('Only image uploads are allowed'));
  }
  cb(null, true);
};
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5 MB
});

// public: list
router.get('/', controller.getItems);

// protected: create/update/delete/claim
router.post('/', auth, (req, res, next) => {
  upload.single('imageFile')(req, res, (err) => {
    if (err) {
      console.error('[upload] create error:', err.message);
      return res.status(400).json({ statusCode: 400, message: err.message });
    }
    next();
  });
}, controller.postItem);

router.put('/:id', auth, (req, res, next) => {
  upload.single('imageFile')(req, res, (err) => {
    if (err) {
      console.error('[upload] update error:', err.message);
      return res.status(400).json({ statusCode: 400, message: err.message });
    }
    next();
  });
}, controller.update);

router.put('/:id/claim', auth, controller.claim);
router.delete('/:id', auth, controller.remove);

module.exports = router;
