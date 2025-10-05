const express = require('express');
const router = express.Router();
const EVController = require('../controllers/evController');

// GET all EVs
router.get('/', EVController.getAllEVs);

// GET single EV by ID
router.get('/:id', EVController.getEVById);

// POST create new EV
router.post('/', EVController.createEV);

// PUT update EV
router.put('/:id', EVController.updateEV);

// DELETE EV
router.delete('/:id', EVController.deleteEV);

module.exports = router;
