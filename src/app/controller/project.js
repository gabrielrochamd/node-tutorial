const express = require('express');

const authMiddleware = require('../middleware/auth');

const Project = require('../model/Project');
const Task = require('../model/Task');

const router = express.Router();

router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const projects = await Project.find().populate(['tasks', 'user']);
    return res.send(projects);
  } catch (e) {
    return res.status(400).send({ message: 'Error fetching projects.' });
  }
});

router.get('/:projectId', async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId).populate(['tasks', 'user']);
    return res.send(project);
  } catch (e) {
    return res.status(400).send({ message: 'Error fetching project.' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { description, tasks, title } = req.body;
    const project = await Project.create({ description, title, user: req.userId });

    await Promise.all(tasks.map(async task => {
      const projectTask = new Task({ ...task, project: project.id });
      await projectTask.save();
      project.tasks.push(projectTask);
    }));

    await project.save();
    
    return res.send(project);
  } catch (e) {
    return res.status(400).send({ message: 'Error creating project.' });
  }
});

router.put('/:projectId', async (req, res) => {
  try {
    const { description, tasks, title } = req.body;
    const project = await Project.findByIdAndUpdate(req.params.projectId, {
      description,
      title
    }, { new: true });

    project.tasks = [];
    await Task.remove({ project: project._id });

    await Promise.all(tasks.map(async task => {
      const projectTask = new Task({ ...task, project: project.id });
      await projectTask.save();
      project.tasks.push(projectTask);
    }));

    await project.save();
    
    return res.send(project);
  } catch (e) {
    return res.status(400).send({ message: 'Error updating project.' });
  }
});

router.delete('/:projectId', async (req, res) => {
  try {
    await Project.findByIdAndRemove(req.params.projectId);
    return res.send();
  } catch (e) {
    return res.status(400).send({ message: 'Error deleting project.' });
  }
});

module.exports = app => app.use('/projects', router);