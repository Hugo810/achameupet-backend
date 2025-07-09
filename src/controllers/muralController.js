const { firestore } = require('../config/firebaseAdmin');

class MuralController {
  async postarMensagem(req, res) {
    try {
      const mensagemData = {
        titulo: req.body.titulo,
        conteudo: req.body.conteudo,
        usuarioId: req.user.uid,
        dataPostagem: new Date(),
        visibilidade: req.body.visibilidade || 'publico'
      };

      const docRef = await firestore.collection('mural').add(mensagemData);
      res.status(201).json({ id: docRef.id, ...mensagemData });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao postar mensagem' });
    }
  }

  async listarMensagens(req, res) {
    try {
      let query = firestore.collection('mural').orderBy('dataPostagem', 'desc');
      
      if (req.query.usuarioId) {
        query = query.where('usuarioId', '==', req.query.usuarioId);
      }

      const snapshot = await query.get();
      const mensagens = [];
      snapshot.forEach(doc => {
        mensagens.push({ id: doc.id, ...doc.data() });
      });

      res.json(mensagens);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar mensagens' });
    }
  }
}

module.exports = new MuralController();