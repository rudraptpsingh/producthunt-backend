const bcrypt = require('bcrypt');
const { users } = require('./db');

const SALT_ROUNDS = 10;

// Hash password
async function hashPassword(password) {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

// Compare password
async function comparePassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

// Register new user
async function register(email, password, name) {
  // Validate email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error('Invalid email format');
  }
  
  // Validate password length
  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters');
  }
  
  // Check if user already exists
  const existingUser = await users.findByEmail(email);
  if (existingUser) {
    throw new Error('Email already registered');
  }
  
  // Hash password and create user
  const passwordHash = await hashPassword(password);
  const user = await users.create(email, passwordHash, name);
  
  // Return user without password hash
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    created_at: user.created_at
  };
}

// Login user
async function login(email, password) {
  const user = await users.findByEmail(email);
  
  if (!user) {
    throw new Error('Invalid email or password');
  }
  
  const isValid = await comparePassword(password, user.password_hash);
  
  if (!isValid) {
    throw new Error('Invalid email or password');
  }
  
  // Return user without password hash
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    created_at: user.created_at
  };
}

// Middleware to check if user is authenticated
function requireAuth(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Please log in' });
  }
  next();
}

// Middleware to attach user to request if logged in
async function attachUser(req, res, next) {
  if (req.session && req.session.userId) {
    try {
      const user = await users.findById(req.session.userId);
      req.user = user;
    } catch (error) {
      console.error('Error attaching user:', error);
    }
  }
  next();
}

module.exports = {
  register,
  login,
  requireAuth,
  attachUser
};
