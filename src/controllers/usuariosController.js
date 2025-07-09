const { criarUsuario } = require('../services/usuariosService');

async function cadastrarUsuario(req, res) {
  // Verificação inicial do body
  if (!req.body || typeof req.body !== 'object' || Object.keys(req.body).length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Corpo da requisição inválido ou vazio'
    });
  }

  // Validação dos campos obrigatórios
  const camposObrigatorios = [
    'nome', 'email', 'senha', 'whatsapp', 
    'cidade', 'bairro', 'tipoUsuario'
  ];
  
  const camposFaltantes = camposObrigatorios.filter(campo => !req.body[campo]);
  
  if (camposFaltantes.length > 0) {
    return res.status(400).json({
      success: false,
      message: `Campos obrigatórios faltando: ${camposFaltantes.join(', ')}`,
      camposFaltantes
    });
  }

  // Validações específicas
  if (req.body.senha.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'A senha deve ter pelo menos 6 caracteres'
    });
  }

  if (!['Tutor', 'Veterinário'].includes(req.body.tipoUsuario)) {
    return res.status(400).json({
      success: false,
      message: 'Tipo de usuário inválido. Deve ser "Tutor" ou "Veterinário"'
    });
  }

  try {
    const dadosUsuario = {
      nome: req.body.nome.trim(),
      email: req.body.email.toLowerCase().trim(),
      senha: req.body.senha,
      whatsapp: req.body.whatsapp.replace(/\D/g, ''), // Remove não-numéricos
      cidade: req.body.cidade.trim(),
      bairro: req.body.bairro.trim(),
      receberPropaganda: typeof req.body.receberPropaganda === 'boolean' 
        ? req.body.receberPropaganda 
        : true,
      tipoUsuario: req.body.tipoUsuario,
      fotoPerfil: req.body.fotoPerfil || null
    };

    const usuario = await criarUsuario(dadosUsuario);

    // Remove a senha antes de retornar
    delete usuario.senha;

    return res.status(201).json({
      success: true,
      message: 'Usuário cadastrado com sucesso!',
      data: usuario
    });

  } catch (error) {
    console.error('Erro no cadastro:', error);
    
    // Tratamento de erros específicos
    if (error.code === 'EMAIL_JA_CADASTRADO') {
      return res.status(409).json({
        success: false,
        message: error.message,
        code: 'EMAIL_EM_USO'
      });
    }

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Dados de cadastro inválidos',
        errors: error.errors
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Erro interno no servidor. Por favor, tente novamente mais tarde.'
    });
  }
}

module.exports = { cadastrarUsuario };