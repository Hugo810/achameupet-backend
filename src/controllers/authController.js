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
  // Função de registro
  registrar: async (req, res) => {
    try {
      // 1. Montar dados para criação do usuário
      const userData = {
        email: req.body.email,
        password: req.body.senha,
        displayName: req.body.nome
      };

      // Adicionar photoURL somente se for uma URL válida
      if (req.body.fotoPerfil && isValidUrl(req.body.fotoPerfil)) {
        userData.photoURL = req.body.fotoPerfil;
      }

      // 2. Criar usuário no Firebase Authentication
      const userRecord = await admin.auth().createUser(userData);

      // 3. Preparar dados para o Firestore
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
          : true, // Valor padrão
        tipoUsuario: req.body.tipoUsuario,
        dataCadastro: admin.firestore.FieldValue.serverTimestamp()
      };

      // 4. Salvar no Firestore
      await admin.firestore()
        .collection('usuarios')
        .doc(userRecord.uid)
        .set(usuarioData);

      // 5. Definir claims customizados
      await admin.auth().setCustomUserClaims(userRecord.uid, {
        tipoUsuario: req.body.tipoUsuario
      });

      // 6. Retornar resposta
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

  // Função de login
  login: async (req, res) => {
    try {
      const { idToken } = req.body;

      if (!idToken) {
        return res.status(400).json({
          success: false,
          message: 'Token de autenticação não fornecido.'
        });
      }

      // Verifica o token enviado pelo frontend
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      const uid = decodedToken.uid;

      // Busca dados do Firestore
      const userDoc = await admin.firestore()
        .collection('usuarios')
        .doc(uid)
        .get();

      if (!userDoc.exists) {
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado no Firestore.'
        });
      }

      res.status(200).json({
        success: true,
        uid,
        usuario: userDoc.data()
      });

    } catch (error) {
      console.error('Erro no login:', error);
      res.status(401).json({
        success: false,
        message: 'Token inválido ou expirado.',
        error: error.message
      });
    }
  }
};
