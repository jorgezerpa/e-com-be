import { Router, Request, Response } from 'express';
import authRouter from './auth.route';
import catalogRouter from "./catalog.route"
import companyRouter from "./company.route"
import methodRouter from "./method.route"
import orderRouter from "./order.route"
import uploadRouter from './upload.route';
//


const router = Router();

/**
 * You can create separate files for 'userRoutes.ts', 'productRoutes.ts', etc.
 * and import them here.
 */

// Placeholder for your controller functions
//
router.use('/auth', authRouter); 
router.use('/catalog', catalogRouter); 
router.use('/company', companyRouter); 
router.use('/method', methodRouter); 
router.use('/order', orderRouter); 
router.use('/upload', uploadRouter); 

export default router;