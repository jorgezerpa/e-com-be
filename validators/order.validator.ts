import { checkSchema } from 'express-validator';



// use in POST /orders route
export const createOrderValidator = () => checkSchema({
  companyId: {
    in: ['body'],
    isInt: true,
    toInt: true,
  },
  state: {
    in: ['body'],
    optional: true,
    isIn: {
      options: [['PENDING', 'PROCESSING', 'SHIPPED', 'FINISHED', 'CANCELLED', 'STUCK', 'REFUNDED']],
    },
  },
  customer_firstName: { in: ['body'], notEmpty: true, isString: true },
  customer_lastName: { in: ['body'], notEmpty: true, isString: true },
  customer_whatsapp_number: { in: ['body'], notEmpty: true, isString: true },
  customer_identification_number: { in: ['body'], notEmpty: true, isString: true },
  customer_email: { in: ['body'], optional: true, isEmail: true },
  customer_address: { in: ['body'], optional: true, isString: true },
  
  paymentMethodId: { in: ['body'], isInt: true, toInt: true },
  shippingMethodId: { in: ['body'], isInt: true, toInt: true },
  requestedItems: {
      in: ['body'],
      isArray: { errorMessage: 'requestedItems must be an array' },
      notEmpty: true,
  },
  'requestedItems.*.productId': { isInt: true, toInt: true },
  'requestedItems.*.quantity': { isInt: { options: { min: 1 } }, toInt: true },
});

// use in GET /orders route
export const getOrderValidator = () => checkSchema({
  id: {
    in: ['query'],
    optional: true,
    isInt: true,
    toInt: true,
  },
  companyId: {
    in: ['query'],
    optional: true,
    isInt: true,
    toInt: true,
  },
  state: {
    in: ['query'],
    optional: true,
    isIn: {
      options: [['PENDING', 'PROCESSING', 'SHIPPED', 'FINISHED', 'CANCELLED', 'STUCK', 'REFUNDED']],
      errorMessage: 'Invalid order state',
    },
  },
  from: {
    in: ['query'],
    optional: true,
    isISO8601: { errorMessage: 'from must be in ISO8601 format' },
    toDate: true, // Automatically converts to Date object
  },
  to: {
    in: ['query'],
    optional: true,
    isISO8601: { errorMessage: 'to must be in ISO8601 format' },
    toDate: true,
  },
});

// use in PUT /orders route
export const updateOrderValidator = () => checkSchema({
  id: {
    in: ['query'],
    notEmpty: { errorMessage: 'id is required in query params' },
    isInt: true,
    toInt: true,
  },
  state: {
    in: ['body'],
    optional: true,
    isIn: {
      options: [['PENDING', 'PROCESSING', 'SHIPPED', 'FINISHED', 'CANCELLED', 'STUCK', 'REFUNDED']],
      errorMessage: 'Invalid order state',
    },
  },
  notes: {
    in: ['body'],
    optional: true,
    isString: true,
  },
});

// use in DELETE /orders route
export const deleteOrderValidator = () => checkSchema({
  id: {
    in: ['query'],
    notEmpty: { errorMessage: 'id is required in query params' },
    isInt: true,
    toInt: true,
  },
});
