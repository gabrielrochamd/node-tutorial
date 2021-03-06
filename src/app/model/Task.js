const mongoose = require('mongoose');

const TaskSchema = mongoose.Schema({
  title: {
    type: String,
    require: true
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    require: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  completed: {
    type: Boolean,
    require: true,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Task = mongoose.model('Task', TaskSchema);

module.exports = Task;