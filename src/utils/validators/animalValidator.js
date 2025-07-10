const Joi = require('joi');

const animalSchema = Joi.object({
  nome: Joi.string()
    .required()
    .min(2)
    .max(100)
    .messages({
      'string.empty': 'O nome do animal é obrigatório',
      'string.min': 'O nome deve ter pelo menos {#limit} caracteres',
      'string.max': 'O nome não pode exceder {#limit} caracteres'
    }),

  raca: Joi.string()
    .required()
    .max(50)
    .messages({
      'string.empty': 'A raça é obrigatória',
      'string.max': 'A raça não pode exceder {#limit} caracteres'
    }),

  cor: Joi.string()
    .required()
    .max(30)
    .messages({
      'string.empty': 'A cor é obrigatória',
      'string.max': 'A cor não pode exceder {#limit} caracteres'
    }),

  porte: Joi.string()
    .valid('Pequeno', 'Médio', 'Grande')
    .required()
    .messages({
      'any.only': 'O porte deve ser Pequeno, Médio ou Grande',
      'string.empty': 'O porte é obrigatório'
    }),

  sexo: Joi.string()
    .valid('Macho', 'Fêmea')
    .required()
    .messages({
      'any.only': 'O sexo deve ser Macho ou Fêmea',
      'string.empty': 'O sexo é obrigatório'
    }),

  status: Joi.string()
    .valid('Perdido', 'Encontrado')
    .default('Perdido')
    .messages({
      'any.only': 'O status deve ser Perdido ou Encontrado'
    }),

  descricao: Joi.string()
    .max(500)
    .allow('')
    .messages({
      'string.max': 'A descrição não pode exceder {#limit} caracteres'
    }),

  referencia: Joi.string()
    .max(100)
    .allow('')
    .messages({
      'string.max': 'A referência não pode exceder {#limit} caracteres'
    }),

  latitude: Joi.number()
    .min(-90)
    .max(90)
    .required()
    .messages({
      'number.base': 'A latitude deve ser um número',
      'number.min': 'Latitude inválida (mínimo -90)',
      'number.max': 'Latitude inválida (máximo 90)',
      'any.required': 'A localização é obrigatória'
    }),

  longitude: Joi.number()
    .min(-180)
    .max(180)
    .required()
    .messages({
      'number.base': 'A longitude deve ser um número',
      'number.min': 'Longitude inválida (mínimo -180)',
      'number.max': 'Longitude inválida (máximo 180)',
      'any.required': 'A localização é obrigatória'
    }),

  // Campos opcionais que podem ser úteis
  tipo: Joi.string()
    .valid('Cachorro', 'Gato', 'Outro')
    .default('Cachorro')
    .messages({
      'any.only': 'O tipo deve ser Cachorro, Gato ou Outro'
    }),

  caracteristicas: Joi.array()
    .items(Joi.string().max(30))
    .max(5)
    .messages({
      'array.max': 'Máximo de {#limit} características',
      'string.max': 'Cada característica deve ter no máximo {#limit} caracteres'
    }),

  telefoneContato: Joi.string()
    .pattern(/^[0-9]{10,11}$/)
    .messages({
      'string.pattern.base': 'Telefone inválido (10 ou 11 dígitos)'
    })

}).options({
  abortEarly: false,  // Mostra todos os erros de uma vez
  stripUnknown: true  // Remove campos não definidos no schema
});

// Validador customizado para verificar se há fotos
const validateWithPhotos = (data, files) => {
  const { error, value } = animalSchema.validate(data);
  
  if (error) {
    return { error };
  }

  if (!files || files.length === 0) {
    return { 
      error: { 
        details: [{ message: 'Pelo menos uma foto é obrigatória' }] 
      } 
    };
  }

  if (files.length > 5) {
    return { 
      error: { 
        details: [{ message: 'Máximo de 5 fotos permitidas' }] 
      } 
    };
  }

  return { value };
};

module.exports = {
  animalSchema,
  validate: (data) => animalSchema.validate(data),
  validateWithPhotos
};