// services/imageService.js
const admin = require('../config/firebaseAdmin');

class ImageService {
  async uploadImage(file) {
    const bucket = admin.storage().bucket();
    const fileName = `animais/${Date.now()}_${file.originalname}`;
    const fileUpload = bucket.file(fileName);
    
    const stream = fileUpload.createWriteStream({
      metadata: { contentType: file.mimetype }
    });
    
    return new Promise((resolve, reject) => {
      stream.on('error', reject);
      stream.on('finish', () => {
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
        resolve(publicUrl);
      });
      stream.end(file.buffer);
    });
  }
}

module.exports = new ImageService();