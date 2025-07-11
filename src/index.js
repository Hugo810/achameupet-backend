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
      /^exp:\/\//,  // Para aplicações Expo
      /^http:\/\/192\.168\.\d+\.\d+(:\d+)?$/, // Para IPs locais da rede
      /^http:\/\/10\.\d+\.\d+\.\d+(:\d+)?$/,  // Para IPs locais da rede
      /^http:\/\/localhost(:\d+)?$/,           // Para localhost
      /^https?:\/\/[\w-]+\.localhost(:\d+)?$/, // Para locais com domínio .localhost
      process.env.FRONTEND_URL,                // Frontend URL configurada
      'https://achameupet.com',                // Domínio principal
      'https://*.achameupet.com'               // Subdomínios
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

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }

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
  console.log(`🚀 Servidor iniciado na porta ${PORT}`);
  console.log(`🔧 Modo: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🕒 ${new Date().toLocaleString()}`);
  console.log(`📄 Documentação: http://localhost:${PORT}/api/docs`);
});

server.on('error', (error) => {
  console.error('💥 Falha na inicialização:', error);
  process.exit(1);
});

process.on('SIGINT', () => {
  console.log('🔴 Servidor encerrado');
  process.exit(0);
});
