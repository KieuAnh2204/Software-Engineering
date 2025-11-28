const express = require("express");
const router = express.Router();
const { authenticate, authorize } = require("../middleware/auth");

const cart = require("../controllers/cartController");
const order = require("../controllers/orderController");

// Payment callback (service-to-service) - uses shared secret, no JWT
router.post("/payment/callback", order.paymentCallback);
// PIN verification (drone/customer UI) - unauthenticated but PIN-protected
router.post("/drones/:orderId/verify-pin", order.verifyPin);
router.post("/:orderId/verify-pin", order.verifyPin);
router.patch("/drones/:orderId/status", order.droneStatusUpdate);

router.use(authenticate);

// cart
router.get("/cart", cart.getCart);
router.post("/cart/items", cart.addItem);
router.patch("/cart/items/:itemId", cart.updateItem);
router.delete("/cart/items/:itemId", cart.removeItem);
router.delete("/cart", cart.clearCart);
router.post("/cart/checkout", cart.checkout);
router.patch("/cart/address", cart.updateAddress);

// restaurant (owner/admin)
router.get(
  "/restaurant",
  authorize("owner", "admin"),
  order.listRestaurantOrders
);
router.patch(
  "/:orderId/status",
  authorize("owner", "admin"),
  order.updateRestaurantStatus
);

// customer history
router.get("/", order.listOrders);
router.get("/:orderId", order.getOrder);

// payment simulation (customer/admin)
router.post("/:orderId/mock-pay", order.mockMarkPaid);

module.exports = router;
