const { firestore } = require('../config/firebaseAdmin');

class AlertasController {
  async criarAlerta(req, res) {
    try {
      const alertaData = {
        tipo: req.body.tipo, // 'Segurança' ou 'PossivelMatch'
        mensagem: req.body.mensagem,
        animalId: req.body.animalId,
        usuarioId: req.user.uid,
        data: new Date(),
        lido: false
      };

      const docRef = await firestore.collection('alertas').add(alertaData);
      res.status(201).json({ id: docRef.id, ...alertaData });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao criar alerta' });
    }
  }

  async listarAlertas(req, res) {
    try {
      const snapshot = await firestore.collection('alertas')
        .where('usuarioId', '==', req.user.uid)
        .orderBy('data', 'desc')
        .get();

      const alertas = [];
      snapshot.forEach(doc => {
        alertas.push({ id: doc.id, ...doc.data() });
      });

      res.json(alertas);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar alertas' });
    }
  }
}

module.exports = new AlertasController();