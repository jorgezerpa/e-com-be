import { checkSchema } from 'express-validator';

// =================== PAYMENT METHODS ===================

// use in POST /methods/payment-methods route
export const createPaymentMethodValidator = () => checkSchema({
  companyId: { in: ['body'], isInt: true, toInt: true },
  name: { in: ['body'], notEmpty: true, isString: true },
  description: { in: ['body'], optional: true, isString: true },
  provider: { in: ['body'], notEmpty: true, isString: true },
  receiverFields: { in: ['body'], notEmpty: true },
  fields: { in: ['body'], notEmpty: true }, // @todo Add custom JSON validator for all JSON fields
});

// use in GET /methods/payment-methods route
export const getPaymentMethodValidator = () => checkSchema({
  id: { in: ['query'], optional: true, isInt: true, toInt: true },
  companyId: { in: ['query'], optional: true, isInt: true, toInt: true },
});

// use in PUT /methods/payment-methods route
export const updatePaymentMethodValidator = () => checkSchema({
  id: { in: ['query'], notEmpty: true, isInt: true, toInt: true },
  name: { in: ['body'], optional: true, isString: true },
  description: { in: ['body'], optional: true, isString: true },
  provider: { in: ['body'], optional: true, isString: true },
  receiverFields: { in: ['body'], optional: true, isString: true },
  fields: { in: ['body'], optional: true },
});

// use in DELETE /methods/payment-methods route
export const deletePaymentMethodValidator = () => checkSchema({
  id: { in: ['query'], notEmpty: true, isInt: true, toInt: true },
});

// =================== SHIPPING METHODS ===================

// use in POST /methods/shipping-methods route
export const createShippingMethodValidator = () => checkSchema({
  companyId: { in: ['body'], isInt: true, toInt: true },
  name: { in: ['body'], notEmpty: true, isString: true },
  description: { in: ['body'], optional: true, isString: true },
  provider: { in: ['body'], notEmpty: true, isString: true },
  fields: { in: ['body'], notEmpty: true },
});

// use in GET /methods/shipping-methods route
export const getShippingMethodValidator = () => checkSchema({
  id: { in: ['query'], optional: true, isInt: true, toInt: true },
  companyId: { in: ['query'], optional: true, isInt: true, toInt: true },
});

// use in PUT /methods/shipping-methods route
export const updateShippingMethodValidator = () => checkSchema({
  id: { in: ['query'], notEmpty: true, isInt: true, toInt: true },
  name: { in: ['body'], optional: true, isString: true },
  description: { in: ['body'], optional: true, isString: true },
  provider: { in: ['body'], optional: true, isString: true },
  fields: { in: ['body'], optional: true },
});

// use in DELETE /methods/shipping-methods route
export const deleteShippingMethodValidator = () => checkSchema({
  id: { in: ['query'], notEmpty: true, isInt: true, toInt: true },
});

