const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/node-tutorial');
mongoose.Promise = global.Promise;

module.exports = mongoose;