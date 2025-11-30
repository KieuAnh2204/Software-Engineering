const express = require('express');
const router = express.Router();
const controller = require('../controllers/droneController');

// Discovery + assignment
router.get('/nearest', controller.findNearestDrone);
router.post('/assign', controller.assignDrone);
router.post('/start-delivery', controller.startDelivery);

// Simulation + status
router.post('/update', controller.manualUpdate);
router.get('/position/:orderId', controller.getDronePosition);
router.get('/arrival-status/:orderId', controller.getArrivalStatus);

// PIN verification
router.post('/verify-pin', controller.verifyPin);

// Admin/debug
router.get('/', controller.listDrones);
router.get('/:id', controller.getDroneById);

module.exports = router;
