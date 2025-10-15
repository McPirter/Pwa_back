const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const webpush = require('web-push');
require('dotenv').config();

// Configurar web-push con las keys
const keys = require('./keys.json');
webpush.setVapidDetails(
  'mailto:tu-email@ejemplo.com', // Email de contacto
  keys.publicKey,
  keys.privateKey
);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Conexión a MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ Conectado a MongoDB');
})
.catch((error) => {
  console.error('❌ Error conectando a MongoDB:', error);
  process.exit(1);
});

// Rutas
app.use('/api', require('./routes/auth'));
app.use('/api/notifications', require('./routes/notifications'));

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({
    message: 'API de PWA Backend funcionando correctamente',
    status: 'success',
    timestamp: new Date().toISOString()
  });
});

// Manejo de rutas no encontradas
app.use((req, res) => {
    res.status(404).json({
      message: 'Ruta no encontrada',
      status: 'error'
    });
  });
  
  // Manejo global de errores
  app.use((error, req, res, next) => {
    console.error('Error:', error);
    res.status(error.status || 500).json({
      message: error.message || 'Error interno del servidor',
      status: 'error'
    });
  });
  

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`📱 API disponible en: http://localhost:${PORT}`);
});
