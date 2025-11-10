const { body, query } = require('express-validator');

const createOrderValidation = [
  body('customer_id').isString().notEmpty(),
  body('restaurant_id').isString().notEmpty(),
  body('items').isArray({ min: 1 }),
  body('items.*.dish_id').isString().notEmpty(),
  body('items.*.quantity').isInt({ min: 1 }),
  body('note').optional().isString()
];

const listOrdersValidation = [
  query('customer_id').optional().isString(),
  query('restaurant_id').optional().isString(),
  query('status').optional().isString(),
  query('start_date').optional().isISO8601(),
  query('end_date').optional().isISO8601(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
];

module.exports = { createOrderValidation, listOrdersValidation };

