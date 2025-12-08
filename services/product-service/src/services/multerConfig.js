const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: 'dm0nqs7u8',
  api_key: '354192211775368',
  api_secret: 'IoURz5sPGoXT5wzdfF1Bk7CxVk4'
});

// Configure multer to use Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'foodfast/dishes',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [{ width: 800, height: 800, crop: 'limit' }]
  }
});

const uploadDishImage = multer({ 
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max
  }
});

module.exports = {
  uploadDishImage,
  cloudinary
};
