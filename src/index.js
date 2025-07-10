require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

// =============================================
// 1. Middlewares ESSENCIAIS
// =============================================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// =============================================
// 2. Configuração de CORS
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

    const shouldAllow = !origin || 
      process.env.NODE_ENV !== 'production' ||
      allowedOrigins.some(pattern => 
        typeof pattern === 'string' 
          ? origin === pattern 
          : pattern.test(origin)
      );

    callback(shouldAllow ? null : new Error('Not allowed by CORS'), shouldAllow);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  credentials: true,
  maxAge: 86400
};

app.use(cors(corsOptions));

// ========================
// 3. Middleware de Logs
// ========================
app.use((req, res, next) => {
  console.log(`\n=== Nova Requisição ===`);
  console.log(`Método: ${req.method}`);
  console.log(`Endpoint: ${req.path}`);
  console.log(`IP: ${req.ip}`);
  console.log(`User-Agent: ${req.headers['user-agent']}`);
  next();
});

// ========================
// 4. Carregamento de Rotas
// ========================
const loadRouters = () => {
  const routers = [
    { path: '/api/animais', router: require('./routes/animais') },
    { path: '/api/usuarios', router: require('./routes/usuarios') },
    { path: '/api/auth', router: require('./routes/auth') }
  ];

  routers.forEach(({ path, router }) => {
    try {
      app.use(path, router);
      console.log(`✓ Rota ${path} carregada`);
    } catch (err) {
      console.error(`✗ Falha ao carregar rota ${path}:`, err);
      process.exit(1);
    }
  });
};

loadRouters();

// ========================
// 5. Health Check
// ========================
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'AchaMeuPet Backend',
    version: process.env.npm_package_version || '1.0.0',
    dbStatus: 'connected'
  });
});

// ========================
// 6. Tratamento de Erros
// ========================
app.use((err, req, res, next) => {
  console.error('⚠️ Erro:', err.stack);
  
  // Erros de autenticação
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }

  // Erros de validação
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Dados inválidos',
      details: err.details?.map(d => d.message) || err.message
    });
  }

  // Erros internos
  res.status(500).json({
    error: 'Erro interno no servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ========================
// 7. Inicialização
// ========================
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`\n🚀 Servidor iniciado na porta ${PORT}`);
  console.log(`🔧 Modo: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🕒 ${new Date().toLocaleString()}`);
  console.log(`📄 Documentação: http://localhost:${PORT}/api/docs`);
});

server.on('error', (error) => {
  console.error('\n💥 Falha na inicialização:');
  if (error.code === 'EADDRINUSE') {
    console.error(`Porta ${PORT} já está em uso!`);
    console.error('Execute: pkill -f node (Linux/Mac) ou taskkill /f /im node.exe (Windows)');
  } else {
    console.error('Erro:', error);
  }
  process.exit(1);
});

process.on('SIGINT', () => {
  console.log('\n🔴 Servidor encerrado');
  process.exit(0);
});