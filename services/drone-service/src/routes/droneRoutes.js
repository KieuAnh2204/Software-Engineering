const express = require('express');
const router = express.Router();
const droneController = require('../controllers/droneController');

// Service-to-service routes (must be before parameterized routes)
router.get('/available', droneController.getAvailableDrones);
router.get('/order/:orderId', droneController.getDroneByOrderId);

// Drone action routes
router.post('/pickup', droneController.assignPickup);
router.post('/deliver', droneController.startDelivery);
router.post('/return', droneController.returnToStation);

// Admin routes
router.get('/:id', droneController.getDroneById);
router.get('/', droneController.getAllDrones);

module.exports = router;
