import { checkSchema } from 'express-validator';



// use in POST /orders route
export const createOrderValidator = () => checkSchema({
  companyId: {
    in: ['body'],
    isInt: true,
    toInt: true,
  },
  totalAmount: {
    in: ['body'],
    isFloat: true,
    toFloat: true,
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
  
  shipping_country: { in: ['body'], notEmpty: true, isString: true },
  shipping_city: { in: ['body'], notEmpty: true, isString: true },
  shipping_zipCode: { in: ['body'], notEmpty: true, isString: true },
  shipping_name_at_purchase: { in: ['body'], notEmpty: true, isString: true },
  shipping_provider_at_purchase: { in: ['body'], notEmpty: true, isString: true },
  shipping_fields_at_purchase: { in: ['body'], notEmpty: true },
  shipping_fields_response: { in: ['body'], notEmpty: true },
  
  payment_name_at_purchase: { in: ['body'], notEmpty: true, isString: true },
  payment_provider_at_purchase: { in: ['body'], notEmpty: true, isString: true },
  payment_fields_at_purchase: { in: ['body'], notEmpty: true },
  payment_fields_response: { in: ['body'], notEmpty: true },
  
  items: {
    in: ['body'],
    isArray: { errorMessage: 'items must be an array of order items' },
    notEmpty: true,
  },
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
