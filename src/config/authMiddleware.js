const admin = require('../config/firebaseAdmin');

const autenticar = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  console.log("Autenticação recebida:", authHeader); // Log para ver se o cabeçalho está sendo enviado

  if (!authHeader?.startsWith('Bearer ')) {
    console.log("Token ausente ou inválido.");
    return res.status(401).json({ error: 'Token ausente ou inválido' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    console.log("Token validado:", decoded); // Log para confirmar se o token foi validado
    req.user = decoded;
    next(); // Passa para o próximo middleware ou controlador
  } catch (err) {
    console.log("Erro ao validar token:", err); // Log de erro caso a validação do token falhe
    res.status(403).json({ error: 'Token inválido ou expirado' });
  }
};

module.exports = autenticar;
