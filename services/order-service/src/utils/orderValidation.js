const Joi = require('joi');
const { ORDER_STATUSES } = require('../constants/orderStatus');

const modifierSchema = Joi.object({
  name: Joi.string().max(100).required(),
  value: Joi.string().allow('', null),
  price: Joi.number().min(0).default(0)
});

const orderItemSchema = Joi.object({
  productId: Joi.string().required(),
  clientItemId: Joi.string().allow('', null),
  quantity: Joi.number().integer().min(1).required(),
  notes: Joi.string().max(500).allow('', null),
  modifiers: Joi.array().items(modifierSchema).default([])
});

const deliveryAddressSchema = Joi.object({
  street: Joi.string().trim().required(),
  ward: Joi.string().allow('', null),
  district: Joi.string().allow('', null),
  city: Joi.string().trim().required(),
  country: Joi.string().trim().allow('', null),
  contactName: Joi.string().trim().required(),
  phone: Joi.string().trim().required(),
  instructions: Joi.string().allow('', null)
});

const paymentSchema = Joi.object({
  method: Joi.string().valid('cod', 'card', 'wallet', 'bank_transfer').default('cod'),
  transactionId: Joi.string().allow('', null),
  provider: Joi.string().allow('', null)
});

const createOrderSchema = Joi.object({
  restaurantId: Joi.string().required(),
  cartId: Joi.string().optional(),
  items: Joi.array().items(orderItemSchema).min(1).required(),
  deliveryAddress: deliveryAddressSchema.required(),
  payment: paymentSchema.default({}),
  tipAmount: Joi.number().min(0).default(0),
  discountCode: Joi.string().allow('', null),
  scheduledFor: Joi.date().greater('now').allow(null),
  notes: Joi.string().allow('', null),
  specialInstructions: Joi.string().allow('', null),
  metadata: Joi.object().pattern(Joi.string(), Joi.string()).default({})
});

const statusUpdateSchema = Joi.object({
  status: Joi.string().valid(...ORDER_STATUSES).required(),
  note: Joi.string().allow('', null)
});

const validate = (schema, payload) => schema.validate(payload, {
  abortEarly: false,
  stripUnknown: true
});

const formatValidationErrors = (error) => {
  if (!error) return null;
  return error.details.map((detail) => detail.message.replace(/\"/g, ''));
};

module.exports = {
  validateCreateOrder: (payload) => {
    const { error, value } = validate(createOrderSchema, payload);
    return { error: formatValidationErrors(error), value };
  },
  validateStatusUpdate: (payload) => {
    const { error, value } = validate(statusUpdateSchema, payload);
    return { error: formatValidationErrors(error), value };
  }
};
