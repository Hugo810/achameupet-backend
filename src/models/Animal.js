const Joi = require('joi');

const animalSchema = Joi.object({
  nome: Joi.string().required(),
  tipo: Joi.string().valid('Cachorro', 'Gato', 'Outro').required(),
  raca: Joi.string().required(),
  cor: Joi.string().required(),
  porte: Joi.string().valid('Pequeno', 'Medio', 'Grande').required(),
  descricao: Joi.string().max(500),
  cidade: Joi.string().required(),
  bairro: Joi.string().required(),
  latitude: Joi.number().required(),
  longitude: Joi.number().required(),
  fotos: Joi.array().items(Joi.string()).min(1).required()
});

module.exports = animalSchema;