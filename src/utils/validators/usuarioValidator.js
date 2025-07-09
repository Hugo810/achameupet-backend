const Joi = require('joi');

const usuarioSchema = Joi.object({
  nome: Joi.string()
    .min(3)
    .max(100)
    .required()
    .messages({
      'string.empty': 'O nome é obrigatório',
      'string.min': 'O nome deve ter pelo menos 3 caracteres',
      'any.required': 'O campo nome é obrigatório'
    }),

  email: Joi.string()
    .email({ minDomainSegments: 2 })
    .required()
    .messages({
      'string.email': 'Por favor, insira um e-mail válido',
      'string.empty': 'O e-mail é obrigatório'
    }),

  senha: Joi.string()
    .min(6)
    .pattern(new RegExp('^[a-zA-Z0-9]{3,30}$'))
    .required()
    .messages({
      'string.min': 'A senha deve ter no mínimo 6 caracteres',
      'string.pattern.base': 'A senha deve conter apenas letras e números'
    }),

  whatsapp: Joi.string()
    .pattern(new RegExp('^[0-9]{10,11}$'))
    .required()
    .messages({
      'string.pattern.base': 'Insira um número de WhatsApp válido (DDD + número)'
    }),

  cidade: Joi.string()
    .required()
    .messages({
      'string.empty': 'A cidade é obrigatória'
    }),

  bairro: Joi.string()
    .required()
    .messages({
      'string.empty': 'O bairro é obrigatório'
    }),

  fotoPerfil: Joi.string()
    .uri()
    .allow('')
    .optional(),

  receberPropaganda: Joi.boolean()
    .default(true),

  tipoUsuario: Joi.string()
    .valid('Tutor', 'Encontrador', 'ONG', 'Lojista')
    .required()
    .messages({
      'any.only': 'O tipo de usuário deve ser Tutor, Encontrador, ONG ou Lojista'
    })
});

// Validação para atualização de usuário (campos opcionais)
const usuarioUpdateSchema = usuarioSchema.fork(
  ['nome', 'email', 'senha', 'whatsapp', 'tipoUsuario'],
  schema => schema.optional()
);

module.exports = {
  usuarioSchema,
  usuarioUpdateSchema
};