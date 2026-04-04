// middlewares/validateRequest.ts
import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

export const validateRequest = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    // Return a 400 with the array of validation errors
    return res.status(400).json({ errors: errors.array() });
  }
  
  // If no errors, proceed to the actual route handler
  next();
};