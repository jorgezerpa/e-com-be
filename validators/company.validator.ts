import { checkSchema } from 'express-validator';


// use in POST /company route
export const createCompanyValidator = () => checkSchema({
  adminId: {
    in: ['body'],
    isInt: { errorMessage: 'adminId must be an integer' },
    toInt: true,
  },
  name: {
    in: ['body'],
    notEmpty: { errorMessage: 'Company name is required' },
    isString: true,
    trim: true,
  },
  colors: {
    in: ['body'],
    optional: true,
    isArray: { errorMessage: 'Colors must be an array of strings' },
  },
  currency: {
    in: ['body'],
    optional: true,
    isIn: {
      options: [['USD', 'VES']],
      errorMessage: 'Currency must be USD or VES',
    },
  },
  showOutOfStockProducts: {
    in: ['body'],
    optional: true,
    isBoolean: true,
    toBoolean: true,
  },
});

// use in GET /company route
export const getCompanyValidator = () => checkSchema({
  id: {
    in: ['query'],
    optional: true,
    isInt: { errorMessage: 'id must be an integer' },
    toInt: true,
  },
});

// use in PUT /company route
export const updateCompanyValidator = () => checkSchema({
  id: {
    in: ['query'],
    notEmpty: { errorMessage: 'id is required in query params' },
    isInt: true,
    toInt: true,
  },
  name: {
    in: ['body'],
    notEmpty: { errorMessage: 'Company name is required' },
    isString: true,
    trim: true,
  },
});

// use in PUT /company/config route
export const updateCompanyConfigValidator = () => checkSchema({
  companyId: {
    in: ['query'],
    notEmpty: { errorMessage: 'companyId is required in query params' },
    isInt: true,
    toInt: true,
  },
  colors: {
    in: ['body'],
    optional: true,
    isArray: { errorMessage: 'Colors must be an array' },
  },
  currency: {
    in: ['body'],
    optional: true,
    isIn: {
      options: [['USD', 'VES']],
      errorMessage: 'Currency must be USD or VES',
    },
  },
  showOutOfStockProducts: {
    in: ['body'],
    optional: true,
    isBoolean: true,
    toBoolean: true,
  },
});

// use in DELETE /company route
export const deleteCompanyValidator = () => checkSchema({
  id: {
    in: ['query'],
    notEmpty: { errorMessage: 'id is required in query params' },
    isInt: true,
    toInt: true,
  },
});


