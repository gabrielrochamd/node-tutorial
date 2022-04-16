const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const express = require('express');
const jwt = require('jsonwebtoken');

const authConfig = require('../../config/auth.json');
const mailer = require('../../module/mailer');

const User = require('../model/User');

const router = express.Router();

function generateToken(params = {}) {
  return jwt.sign(params, authConfig.secret, {
    expiresIn: 86400
  });
}

router.post('/register', async (req, res) => {
  const { email } = req.body;
  
  try {
    if (await User.findOne({ email }))
      return res.status(400).send({ message: 'User already exists.' });

    const user = await User.create(req.body);

    user.password = undefined;

    return res.send({
      user,
      token: generateToken({ id: user.id })
    });
  } catch (e) {
    return res.status(400).send({ message: 'Registration failed.' });
  }
});

router.post('/authenticate', async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');

  if (!user)
    return res.status(400).send({ message: 'User not found' });
  
  if (!await bcrypt.compare(password, user.password))
    return res.status(400).send({ message: 'Invalid password' });
  
  user.password = undefined;

  const token = jwt.sign({ id: user.id }, authConfig.secret, {
    expiresIn: 86400
  });
  
  return res.send({
    user,
    token: generateToken({ id: user.id })
  });
});

router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user)
      return res.status(400).send({ message: 'User not found' });
    
    const token = crypto.randomBytes(20).toString('hex');
    const now = new Date();

    now.setHours(now.getHours() + 1);

    await User.findByIdAndUpdate(user.id, {
      '$set': {
        passwordResetToken: token,
        passwordResetExpires: now
      }
    });

    mailer.sendMail({
      context: { token },
      from: 'gabriel@example.com',
      template: 'auth/forgot-password',
      to: email
    }, err => {
      if (err)
        return res.status(400).send({ message: 'Cannot send forgot password email' });
      return res.send();
    });
  } catch (e) {
    return res.status(400).send({ message: 'Error in forgot password flow. Try again.' });
  }
});

router.post('/reset-password', async (req, res) => {
  const { email, password, token } = req.body;
  
  try {
    const user = await User.findOne({ email })
      .select('+passwordResetToken passwordResetExpires')
    
    if (!user)
      return res.status(400).send({ message: 'User not found.' });
    
    if (token !== user.passwordResetToken)
      return res.status(400).send({ message: 'Invalid token.' });
    
    const now = new Date();
    
    if (now > user.passwordResetExpires)
      return res.status(400).send({ message: 'Token has expired.' });
    
    user.password = password;
    await user.save();
    return res.send();
  } catch (e) {
    return res.status(400).send({ message: 'Cannot reset password. Try again.' });
  }
});

module.exports = app => app.use('/auth', router);