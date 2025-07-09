require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

// =============================================
// 1. Middlewares ESSENCIAIS (DEVEM vir primeiro)
// =============================================
// Configuração para parsear JSON com limite aumentado
app.use(express.json({ limit: '10mb' }));

// Configuração para parsear URL encoded
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// =============================================
// 2. Configuração de CORS para React Native + Web
// =============================================
const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = [
      /^exp:\/\//,
      /^http:\/\/192\.168\.\d+\.\d+(:\d+)?$/,
      /^http:\/\/10\.\d+\.\d+\.\d+(:\d+)?$/,
      /^http:\/\/localhost(:\d+)?$/,
      /^https?:\/\/[\w-]+\.localhost(:\d+)?$/,
      process.env.FRONTEND_URL,
      'https://achameupet.com',
      'https://*.achameupet.com'
    ].filter(Boolean);

    const shouldAllow = 
      !origin || 
      process.env.NODE_ENV !== 'production' ||
      allowedOrigins.some(pattern => 
        typeof pattern === 'string' 
          ? origin === pattern 
          : pattern.test(origin)
      );

    if (shouldAllow) {
      console.log(`✅ Origin permitida: ${origin || 'none'}`);
      callback(null, true);
    } else {
      console.warn(`❌ Origin bloqueada: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'X-Access-Token'
  ],
  exposedHeaders: ['Authorization'],
  credentials: true,
  maxAge: 86400,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));

// ========================
// 3. Middleware de Logs
// ========================
app.use((req, res, next) => {
  console.log(`\n=== Nova Requisição ===`);
  console.log(`Método: ${req.method}`);
  console.log(`Endpoint: ${req.path}`);
  console.log(`Content-Type: ${req.headers['content-type'] || 'none'}`);
  console.log(`Body: ${JSON.stringify(req.body) || 'vazio'}`);
  next();
});

// ========================
// 4. Sistema de Rotas
// ========================
const loadRouter = (path, router) => {
  try {
    if (typeof router === 'function') {
      app.use(path, router);
      console.log(`✓ Rota ${path} carregada`);
    } else {
      throw new Error(`Router ${path} não é uma função`);
    }
  } catch (err) {
    console.error(`✗ Falha ao carregar rota ${path}:`, err);
    process.exit(1);
  }
};

// Carrega rotas
loadRouter('/api/animais', require('./routes/animais'));
loadRouter('/api/usuarios', require('./routes/usuarios'));
loadRouter('/api/auth', require('./routes/auth'));

// ========================
// 5. Health Check
// ========================
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'AchaMeuPet Backend',
    version: process.env.npm_package_version || '1.0.0'
  });
});

// ========================
// 6. Tratamento de Erros
// ========================
app.use((err, req, res, next) => {
  console.error('⚠️ Erro:', err.stack);
  res.status(500).json({
    error: 'Erro interno',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Ocorreu um erro'
  });
});

// ========================
// 7. Inicialização
// ========================
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`\n🚀 Servidor iniciado na porta ${PORT}`);
  console.log(`🔧 Modo: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🕒 Iniciado em: ${new Date().toLocaleString()}`);
});

server.on('error', (error) => {
  console.error('\n💥 Falha na inicialização:');
  if (error.code === 'EADDRINUSE') {
    console.error(`A porta ${PORT} já está em uso!`);
  } else {
    console.error('Erro:', error);
  }
  process.exit(1);
});