import { checkSchema } from 'express-validator';


// =================== CATEGORIES ===================

// use in POST /catalog/categories route
export const createCategoryValidator = () => checkSchema({
  companyId: {
    in: ['body'],
    isInt: true,
    toInt: true,
  },
  name: {
    in: ['body'],
    notEmpty: { errorMessage: 'Category name is required' },
    isString: true,
    trim: true,
  },
  description: {
    in: ['body'],
    optional: true,
    isString: true,
  },
});

// use in GET /catalog/categories route
export const getCategoryValidator = () => checkSchema({
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

// use in PUT /catalog/categories route
export const updateCategoryValidator = () => checkSchema({
  id: {
    in: ['query'],
    notEmpty: { errorMessage: 'id is required in query params' },
    isInt: true,
    toInt: true,
  },
  name: {
    in: ['body'],
    optional: true,
    isString: true,
    trim: true,
  },
  description: {
    in: ['body'],
    optional: true,
    isString: true,
  },
});

// use in DELETE /catalog/categories route
export const deleteCategoryValidator = () => checkSchema({
  id: {
    in: ['query'],
    notEmpty: { errorMessage: 'id is required in query params' },
    isInt: true,
    toInt: true,
  },
});


// =================== PRODUCTS ===================

// use in POST /catalog/products route
export const createProductValidator = () => checkSchema({
  companyId: {
    in: ['body'],
    isInt: true,
    toInt: true,
  },
  name: {
    in: ['body'],
    notEmpty: true,
    isString: true,
  },
  description: {
    in: ['body'],
    optional: true,
    isString: true,
  },
  price: {
    in: ['body'],
    isFloat: { errorMessage: 'Price must be a valid number/decimal' },
    toFloat: true,
  },
  sku: {
    in: ['body'],
    optional: true,
    isString: true,
  },
  stock: {
    in: ['body'],
    isInt: { errorMessage: 'Stock must be an integer' },
    toInt: true,
  },
  categoryIds: {
    in: ['body'],
    optional: true,
    isArray: true,
  },
});

// use in GET /catalog/products route
export const getProductValidator = () => checkSchema({
  id: {
    in: ['query'],
    optional: true,
    isInt: true,
    toInt: true,
  },
  companyId: {
    in: ['query'],
    optional: false,
    isInt: true,
    toInt: true,
  },
  searchString: {
    in: ['query'],
    optional: true,
    isString: true
  },
  categories: {
    in: ["query"],
    optional: true,
    toArray: true, 
    isArray: true
  },
  'categories.*': {
    in: ["query"],
    isInt: true,
    toInt: true, // Converts strings like "1" to number 1
  }
});

// use in PUT /catalog/products route
export const updateProductValidator = () => checkSchema({
  id: {
    in: ['query'],
    notEmpty: { errorMessage: 'id is required in query params' },
    isInt: true,
    toInt: true,
  },
  name: {
    in: ['body'],
    optional: true,
    isString: true,
  },
  description: {
    in: ['body'],
    optional: true,
    isString: true,
  },
  price: {
    in: ['body'],
    optional: true,
    isFloat: true,
    toFloat: true,
  },
  sku: {
    in: ['body'],
    optional: true,
    isString: true,
  },
  stock: {
    in: ['body'],
    optional: true,
    isInt: true,
    toInt: true,
  },
});

// use in DELETE /catalog/products route
export const deleteProductValidator = () => checkSchema({
  id: {
    in: ['query'],
    notEmpty: { errorMessage: 'id is required in query params' },
    isInt: true,
    toInt: true,
  },
});








