const express = require('express');
const User = require('../models/User');
const router = express.Router();

// POST /api/register - Registro de usuario
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    // Validaciones básicas
    if (!name || !email || !password) {
      return res.status(400).json({
        message: 'Nombre, email y contraseña son obligatorios',
        status: 'error'
      });
    }

    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        message: 'Ya existe un usuario con este email',
        status: 'error'
      });
    }

    // Crear nuevo usuario
    const newUser = new User({
      name,
      email,
      password,
      phone: phone || undefined
    });

    // Guardar usuario en la base de datos
    const savedUser = await newUser.save();

    // Respuesta exitosa (sin incluir la contraseña)
    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      status: 'success',
      user: {
        id: savedUser._id,
        name: savedUser.name,
        email: savedUser.email,
        phone: savedUser.phone,
        role: savedUser.role,
        createdAt: savedUser.createdAt
      }
    });

  } catch (error) {
    console.error('Error en registro:', error);
    
    // Manejo de errores específicos de validación
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        message: 'Datos de entrada inválidos',
        status: 'error',
        errors: errors
      });
    }

    // Error genérico
    res.status(500).json({
      message: 'Error interno del servidor',
      status: 'error'
    });
  }
});

// GET /api/users - Obtener todos los usuarios (para desarrollo)
router.get('/users', async (req, res) => {
  try {
    const users = await User.find({}, '-password');
    res.json({
      message: 'Usuarios obtenidos exitosamente',
      status: 'success',
      users: users
    });
  } catch (error) {
    console.error('Error obteniendo usuarios:', error);
    res.status(500).json({
      message: 'Error obteniendo usuarios',
      status: 'error'
    });
  }
});

// GET /api/user/:id - Obtener usuario por ID
router.get('/user/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id, '-password');
    
    if (!user) {
      return res.status(404).json({
        message: 'Usuario no encontrado',
        status: 'error'
      });
    }

    res.json({
      message: 'Usuario obtenido exitosamente',
      status: 'success',
      user: user
    });
  } catch (error) {
    console.error('Error obteniendo usuario:', error);
    res.status(500).json({
      message: 'Error obteniendo usuario',
      status: 'error'
    });
  }
});

module.exports = router;
