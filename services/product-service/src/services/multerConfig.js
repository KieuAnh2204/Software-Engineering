const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadsRoot = path.resolve(process.cwd(), 'uploads', 'dishes');

// Ensure upload directory exists before saving files
if (!fs.existsSync(uploadsRoot)) {
  fs.mkdirSync(uploadsRoot, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsRoot);
  },
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  }
});

const uploadDishImage = multer({ storage });

module.exports = {
  uploadDishImage,
  uploadsRoot
};
