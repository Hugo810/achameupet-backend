const { getStorage } = require('firebase-admin/storage');

const bucket = getStorage().bucket();

module.exports = {
  async uploadImage(file) {
    if (!file || !file.buffer) {
      throw new Error('Arquivo inválido');
    }

    const destination = `animais/${Date.now()}-${file.originalname}`;
    const fileUpload = bucket.file(destination);

    const stream = fileUpload.createWriteStream({
      metadata: {
        contentType: file.mimetype,
      },
    });

    return new Promise((resolve, reject) => {
      stream.on('error', (err) => reject(err));

      stream.on('finish', async () => {
        try {
          await fileUpload.makePublic();
          // O método publicUrl() não existe. Use a URL pública padrão:
          const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileUpload.name}`;
          resolve(publicUrl);
        } catch (err) {
          reject(err);
        }
      });

      stream.end(file.buffer);
    });
  }
};
