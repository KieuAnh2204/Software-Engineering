const express = require("express");
const ctrl = require("../controllers/droneController");

const router = express.Router();

router.get("/drone", ctrl.list);
router.get("/drone/:orderId/position", ctrl.positionByOrder);
router.get("/drone/:id", ctrl.getById);
router.post("/drone/assign", ctrl.assign);
router.post("/drone/start-delivery", ctrl.startDelivery);
router.post("/drone/return", ctrl.returnHome);

module.exports = router;
