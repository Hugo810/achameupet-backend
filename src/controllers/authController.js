const admin = require('../config/firebaseAdmin');

// Função utilitária para validar URL
function isValidUrl(str) {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
}

module.exports = {
  // Função de registro (mantida original)
  registrar: async (req, res) => {
    try {
      const userData = {
        email: req.body.email,
        password: req.body.senha,
        displayName: req.body.nome
      };

      if (req.body.fotoPerfil && isValidUrl(req.body.fotoPerfil)) {
        userData.photoURL = req.body.fotoPerfil;
      }

      const userRecord = await admin.auth().createUser(userData);

      const usuarioData = {
        id: userRecord.uid,
        nome: req.body.nome,
        email: req.body.email,
        whatsapp: req.body.whatsapp,
        fotoPerfil: req.body.fotoPerfil || '',
        cidade: req.body.cidade,
        bairro: req.body.bairro,
        receberPropaganda: req.body.receberPropaganda !== undefined 
          ? req.body.receberPropaganda 
          : true,
        tipoUsuario: req.body.tipoUsuario,
        dataCadastro: admin.firestore.FieldValue.serverTimestamp()
      };

      await admin.firestore()
        .collection('usuarios')
        .doc(userRecord.uid)
        .set(usuarioData);

      await admin.auth().setCustomUserClaims(userRecord.uid, {
        tipoUsuario: req.body.tipoUsuario
      });

      res.status(201).json({
        success: true,
        usuario: {
          ...usuarioData,
          dataCadastro: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Erro no registro:', error);
      res.status(400).json({
        success: false,
        error: error.message,
        details: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  },

  // Função de login com Firebase ID Token
  login: async (req, res) => {
    try {
      const { idToken } = req.body;

      if (!idToken) {
        return res.status(400).json({
          success: false,
          message: 'Token de autenticação não fornecido.'
        });
      }

      // Verifica o token no Firebase Auth
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      const uid = decodedToken.uid;

      // Busca dados adicionais no Firestore
      const userDoc = await admin.firestore()
        .collection('usuarios')
        .doc(uid)
        .get();

      if (!userDoc.exists) {
        return res.status(404).json({
          success: false,
          message: 'Dados do usuário não encontrados.'
        });
      }

      res.status(200).json({
        success: true,
        uid,
        usuario: userDoc.data()
      });

    } catch (error) {
      console.error('Erro no login:', error);
      
      // Tratamento específico para token inválido/expirado
      if (error.code === 'auth/id-token-expired' || error.code === 'auth/id-token-revoked') {
        return res.status(401).json({
          success: false,
          message: 'Token expirado ou revogado.'
        });
      }

      res.status(401).json({
        success: false,
        message: 'Token inválido.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
};