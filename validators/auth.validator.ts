import { checkSchema } from 'express-validator';


// use in POST /auth/register route
export const registerValidator = () => checkSchema({
  email: {
    in: ['body'],
    isEmail: { errorMessage: 'Must be a valid email address' },
    normalizeEmail: true,
  },
  password: {
    in: ['body'],
    isLength: {
      options: { min: 8 },
      errorMessage: 'Password should be at least 8 chars long',
    },
  },
  name: {
    in: ['body'],
    notEmpty: { errorMessage: 'Name is required' },
    isString: true,
    trim: true,
  },
});

// use in POST /auth/login route
export const loginValidator = () => checkSchema({
  email: {
    in: ['body'],
    isEmail: { errorMessage: 'Must be a valid email address' },
    normalizeEmail: true,
  },
  password: {
    in: ['body'],
    notEmpty: { errorMessage: 'Password is required' },
  },
});

