const admin = require('firebase-admin');

async function criarUsuario({
  nome,
  email,
  senha,
  whatsapp,
  cidade,
  bairro,
  receberPropaganda,
  tipoUsuario,
  fotoPerfil = "" // Valor padrão para foto
}) {
  try {
    // Cria usuário no Firebase Auth
    const userRecord = await admin.auth().createUser({
      email,
      password: senha,
      displayName: nome
    });

    // Prepara dados adicionais para o Firestore
    const usuarioData = {
      id: userRecord.uid, // Usamos o UID do Auth como ID
      nome,
      email,
      whatsapp,
      cidade,
      bairro,
      receberPropaganda,
      tipoUsuario,
      fotoPerfil,
      dataCadastro: admin.firestore.FieldValue.serverTimestamp() // Timestamp do servidor
    };

    // Salva no Firestore
    await admin.firestore().collection('usuarios').doc(userRecord.uid).set(usuarioData);

    return {
      ...usuarioData,
      dataCadastro: new Date().toISOString() // Retorna timestamp formatado
    };

  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    
    if (error.code === 'auth/email-already-in-use') {
      throw { 
        code: 'EMAIL_JA_CADASTRADO', 
        message: 'Este e-mail já está em uso. Tente fazer login ou recuperar a senha.' 
      };
    }
    
    throw { 
      code: 'ERRO_INTERNO', 
      message: 'Não foi possível cadastrar. Tente novamente mais tarde.' 
    };
  }
}

module.exports = { criarUsuario };