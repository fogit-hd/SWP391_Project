const EVModel = require('../models/evModel');

class EVController {
  // Get all EVs
  static getAllEVs(req, res) {
    try {
      const evs = EVModel.getAll();
      res.json({ success: true, data: evs });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Get single EV by ID
  static getEVById(req, res) {
    try {
      const ev = EVModel.getById(req.params.id);
      if (!ev) {
        return res.status(404).json({ success: false, message: 'EV not found' });
      }
      res.json({ success: true, data: ev });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Create new EV
  static createEV(req, res) {
    try {
      const newEV = EVModel.create(req.body);
      res.status(201).json({ success: true, data: newEV });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Update EV
  static updateEV(req, res) {
    try {
      const updatedEV = EVModel.update(req.params.id, req.body);
      if (!updatedEV) {
        return res.status(404).json({ success: false, message: 'EV not found' });
      }
      res.json({ success: true, data: updatedEV });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Delete EV
  static deleteEV(req, res) {
    try {
      const deletedEV = EVModel.delete(req.params.id);
      if (!deletedEV) {
        return res.status(404).json({ success: false, message: 'EV not found' });
      }
      res.json({ success: true, message: 'EV deleted successfully' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = EVController;
