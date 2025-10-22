const express = require('express');
const webpush = require('web-push');
const mongoose = require('mongoose');
const User = require('../models/User');
const router = express.Router();

// POST /api/notifications/subscribe - Suscribir usuario a notificaciones
router.post('/subscribe', async (req, res) => {
  try {
    const { userId, subscription } = req.body;

    if (!userId || !subscription) {
      return res.status(400).json({
        message: 'userId y subscription son obligatorios',
        status: 'error'
      });
    }

    // Validar que userId sea un ObjectId válido
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        message: 'userId debe ser un ObjectId válido',
        status: 'error'
      });
    }

    // Buscar el usuario
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: 'Usuario no encontrado',
        status: 'error'
      });
    }

    // Guardar la suscripción en el usuario
    user.pushSubscription = subscription;
    await user.save();

    res.json({
      message: 'Suscripción guardada exitosamente',
      status: 'success'
    });

  } catch (error) {
    console.error('Error suscribiendo usuario:', error);
    res.status(500).json({
      message: 'Error interno del servidor',
      status: 'error'
    });
  }
});

// POST /api/notifications/send - Enviar notificación a un usuario
router.post('/send', async (req, res) => {
  try {
    const { userId, title, body, icon, url } = req.body;

    if (!userId) {
      return res.status(400).json({
        message: 'userId es obligatorio',
        status: 'error'
      });
    }

    // Validar que userId sea un ObjectId válido
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        message: 'userId debe ser un ObjectId válido',
        status: 'error'
      });
    }

    // Buscar el usuario
    const user = await User.findById(userId);
    if (!user || !user.pushSubscription) {
      return res.status(404).json({
        message: 'Usuario no encontrado o sin suscripción',
        status: 'error'
      });
    }

    // Preparar la notificación
    const payload = JSON.stringify({
      title: title || '¡Hola!',
      body: body || 'Esta es una notificación de prueba',
      icon: icon || '/neko.png',
      url: url || '/',
      badge: '/neko-512.png'
    });

    // Enviar la notificación
    await webpush.sendNotification(user.pushSubscription, payload);

    res.json({
      message: 'Notificación enviada exitosamente',
      status: 'success'
    });

  } catch (error) {
    console.error('Error enviando notificación:', error);
    
    // Si la suscripción es inválida, limpiarla
    if (error.statusCode === 410) {
      try {
        const user = await User.findById(req.body.userId);
        if (user) {
          user.pushSubscription = null;
          await user.save();
        }
      } catch (cleanupError) {
        console.error('Error limpiando suscripción inválida:', cleanupError);
      }
    }

    res.status(500).json({
      message: 'Error enviando notificación',
      status: 'error'
    });
  }
});

// GET /api/notifications/public-key - Obtener la clave pública para el frontend
router.get('/public-key', (req, res) => {
  const keys = require('../keys.json');
  res.json({
    publicKey: keys.publicKey,
    status: 'success'
  });
});

// POST /api/notifications/send-to-user - Enviar notificación personalizada a un usuario
router.post('/send-to-user', async (req, res) => {
  try {
    const { userId, title, body, icon, url } = req.body;

    // Validar datos básicos
    if (!userId) {
      return res.status(400).json({
        message: 'El campo userId es obligatorio',
        status: 'error'
      });
    }

    // Validar formato de ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        message: 'El userId no es un ObjectId válido',
        status: 'error'
      });
    }

    // Buscar usuario y su suscripción
    const user = await User.findById(userId);
    if (!user || !user.pushSubscription) {
      return res.status(404).json({
        message: 'Usuario no encontrado o sin suscripción activa',
        status: 'error'
      });
    }

    // Construir notificación personalizada
    const payload = JSON.stringify({
      title: title || `Hola ${user.name || 'usuario'} 👋`,
      body: body || 'Tienes una nueva notificación.',
      icon: icon || '/neko.png',
      url: url || '/',
      badge: '/neko-512.png'
    });

    // Enviar notificación push
    await webpush.sendNotification(user.pushSubscription, payload);

    res.json({
      message: `Notificación enviada al usuario ${user.name || user.email}`,
      status: 'success'
    });

  } catch (error) {
    console.error('Error enviando notificación personalizada:', error);

    // Si la suscripción es inválida, limpiarla
    if (error.statusCode === 410) {
      try {
        const user = await User.findById(req.body.userId);
        if (user) {
          user.pushSubscription = null;
          await user.save();
          console.log(`Suscripción inválida eliminada para ${user.email}`);
        }
      } catch (cleanupError) {
        console.error('Error limpiando suscripción inválida:', cleanupError);
      }
    }

    res.status(500).json({
      message: 'Error enviando la notificación al usuario',
      status: 'error'
    });
  }
});


module.exports = router;
