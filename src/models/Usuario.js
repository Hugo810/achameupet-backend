const Joi = require('joi');

class Usuario {
  constructor({
    id,
    nome,
    email,
    whatsapp,
    fotoPerfil,
    cidade,
    bairro,
    receberPropaganda,
    tipoUsuario,
    dataCadastro
  }) {
    this.id = id;
    this.nome = nome;
    this.email = email;
    this.whatsapp = whatsapp;
    this.fotoPerfil = fotoPerfil || '';
    this.cidade = cidade;
    this.bairro = bairro;
    this.receberPropaganda = receberPropaganda !== undefined ? receberPropaganda : true;
    this.tipoUsuario = tipoUsuario;
    this.dataCadastro = dataCadastro || new Date();
  }

  static schema = Joi.object({
    nome: Joi.string().min(3).max(100).required(),
    email: Joi.string().email().required(),
    whatsapp: Joi.string().pattern(/^[0-9]{10,11}$/).required(),
    cidade: Joi.string().required(),
    bairro: Joi.string().required(),
    fotoPerfil: Joi.string().uri().allow(''),
    receberPropaganda: Joi.boolean().default(true),
    tipoUsuario: Joi.string().valid('Tutor', 'Encontrador', 'ONG', 'Lojista').required()
  });
}

module.exports = Usuario;