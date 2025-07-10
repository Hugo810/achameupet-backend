const admin = require('../config/firebaseAdmin');
const { v4: uuidv4 } = require('uuid');

class ImageService {
  async uploadImage(file) {
    const bucket = admin.storage().bucket();
    const fileName = `animais/${Date.now()}_${file.originalname}`;
    const fileUpload = bucket.file(fileName);

    const uuid = uuidv4();

    const stream = fileUpload.createWriteStream({
      metadata: {
        contentType: file.mimetype,
        metadata: {
          firebaseStorageDownloadTokens: uuid // ✅ Token para acesso público
        }
      }
    });

    return new Promise((resolve, reject) => {
      stream.on('error', reject);
      stream.on('finish', () => {
        const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(fileName)}?alt=media&token=${uuid}`;
        resolve(publicUrl);
      });
      stream.end(file.buffer); // ✅ Upload do buffer em memória
    });
  }
}

module.exports = new ImageService();
