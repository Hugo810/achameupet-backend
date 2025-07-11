const { getStorage } = require('firebase-admin/storage');

const bucket = getStorage().bucket(); // Usa o bucket padrão do Firebase

module.exports = {
  async uploadImage(file) {
    if (!file || !file.buffer) {
      throw new Error('Arquivo inválido');
    }

    const destination = `animais/${Date.now()}-${file.originalname}`;
    const fileUpload = bucket.file(destination);

    // Cria um stream para enviar o buffer ao Firebase Storage
    const stream = fileUpload.createWriteStream({
      metadata: {
        contentType: file.mimetype,
      },
    });

    return new Promise((resolve, reject) => {
      stream.on('error', (err) => reject(err));

      stream.on('finish', async () => {
        try {
          await fileUpload.makePublic(); // Deixa o arquivo acessível publicamente
          resolve(fileUpload.publicUrl()); // Retorna o link público da imagem
        } catch (err) {
          reject(err);
        }
      });

      stream.end(file.buffer); // Envia o conteúdo do arquivo em memória
    });
  }
};
