const hbs = require('nodemailer-express-handlebars');
const nodemailer = require('nodemailer');
const path = require('path');

const { host, pass, port, user } = require('../config/mail.json');

const transport = nodemailer.createTransport({
  host,
  port,
  auth: { user, pass }
});

transport.use('compile', hbs({
  extName: '.html',
  viewEngine: { defaultLayout: false },
  viewPath: path.resolve('./src/resources/mail/')
}));

module.exports = transport;