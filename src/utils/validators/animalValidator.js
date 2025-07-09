const Joi = require('joi');

const animalSchema = Joi.object({
  nome: Joi.string().required().max(100),
  tipo: Joi.string().valid('Cachorro', 'Gato', 'Outro').required(),
  raca: Joi.string().required().max(50),
  cor: Joi.string().required().max(30),
  porte: Joi.string().valid('Pequeno', 'Medio', 'Grande').required(),
  descricao: Joi.string().max(500),
  cidade: Joi.string().required().max(100),
  bairro: Joi.string().required().max(100),
  latitude: Joi.number().min(-90).max(90).required(),
  longitude: Joi.number().min(-180).max(180).required(),
  // fotos removido aqui pois será tratado no upload
  caracteristicas: Joi.array().items(Joi.string().max(30)),
  telefoneContato: Joi.string().pattern(/^[0-9]{10,11}$/)
}).options({ stripUnknown: true });

module.exports = {
  validate: (data) => animalSchema.validate(data, { abortEarly: false })
};