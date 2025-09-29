const jwt = require('jsonwebtoken');
const { createUser, verifyUser, findUserByEmail } = require('../services/userService');

function jwtFor(user) {
  const payload = { id: user._id, email: user.email };
  const secret = process.env.JWT_SECRET || 'dev_secret';
  return jwt.sign(payload, secret, { expiresIn: '7d' });
}

exports.signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    ['name', 'email', 'password'].forEach((f) => {
      if (!req.body[f]) throw new Error(`Missing field: ${f}`);
    });

    // Ensure uniqueness clearly reported
    const existing = await findUserByEmail(email.toLowerCase());
    if (existing) {
      return res.status(400).json({ statusCode: 400, message: 'Email already in use' });
    }

    const user = await createUser({ name, email: email.toLowerCase(), password });
    const token = jwtFor(user);
    // Return minimal safe user info
    res.status(201).json({
      statusCode: 201,
      message: 'Signup successful',
      token,
      user: { id: user._id, name: user.name, email: user.email }
    });
  } catch (e) {
    res.status(400).json({ statusCode: 400, message: e.message || 'Signup failed' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ statusCode: 400, message: 'Email and password are required' });

    const user = await verifyUser(email.toLowerCase(), password);
    if (!user) return res.status(401).json({ statusCode: 401, message: 'Invalid email or password' });

    const token = jwtFor(user);
    res.json({
      statusCode: 200,
      message: 'Login successful',
      token,
      user: { id: user._id, name: user.name, email: user.email }
    });
  } catch (e) {
    res.status(400).json({ statusCode: 400, message: e.message || 'Login failed' });
  }
};

exports.me = async (req, res) => {
  // If your auth middleware set req.user, this verifies the token still works
  res.json({ statusCode: 200, user: { id: req.user.id, email: req.user.email } });
};
