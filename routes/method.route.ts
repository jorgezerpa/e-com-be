import { Request, Response, Router } from 'express';
import {prisma} from "../lib/prisma"
import { allowedRoles, authenticateJWT } from '../middleware/authJWT.middleware';
import { checkSchema } from 'express-validator';
import { createPaymentMethodValidator, createShippingMethodValidator, deletePaymentMethodValidator, deleteShippingMethodValidator, getPaymentMethodValidator, getShippingMethodValidator, updatePaymentMethodValidator, updateShippingMethodValidator } from '../validators/method.validator';
import { validateRequest } from '../validators/validatorRequest';

const router = Router();

// =================== PAYMENT METHODS ===================

router.post('/payment-methods', authenticateJWT, allowedRoles(['ADMIN']), createPaymentMethodValidator(), validateRequest, async (req: Request, res: Response) => {
  try {
    const { name, description, provider, receiverFields, fields, companyId, askForPaymentProofImage } = req.body;
    const method = await prisma.orderPaymentMethod.create({
      data: { name, description, provider, receiverFields, fields, companyId: Number(companyId), askForPaymentProofImage },
    });
    res.status(201).json(method);
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: 'Failed to create payment method' });
  }
});

router.get('/payment-methods', getPaymentMethodValidator(), validateRequest, async (req: Request, res: Response) => {
  try {
    const id = req.query.id ? Number(req.query.id) : undefined;
    const companyId = req.query.companyId ? Number(req.query.companyId) : undefined;

    if (id) {
      return res.json(await prisma.orderPaymentMethod.findUnique({ where: { id } }));
    }
    const methods = await prisma.orderPaymentMethod.findMany({
      where: companyId ? { companyId } : undefined,
      orderBy: { name: 'asc' }
    });
    res.json(methods);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch payment methods' });
  }
});

router.put('/payment-methods',  authenticateJWT, allowedRoles(['ADMIN']), updatePaymentMethodValidator(), validateRequest, async (req: Request, res: Response) => {
  try {
    const id = Number(req.query.id);
    const { name, description, provider, receiverFields, fields, askForPaymentProofImage } = req.body;
    const method = await prisma.orderPaymentMethod.update({
      where: { id },
      data: { name, description, provider, receiverFields, fields, askForPaymentProofImage },
    });
    res.json(method);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update payment method' });
  }
});

router.delete('/payment-methods', authenticateJWT, allowedRoles(['ADMIN']), deletePaymentMethodValidator(), validateRequest, async (req: Request, res: Response) => {
  try {
    const id = Number(req.query.id);
    await prisma.orderPaymentMethod.delete({ where: { id } });
    res.json({ message: 'Payment method deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete payment method' });
  }
});

// =================== SHIPPING METHODS ===================

router.post('/shipping-methods', authenticateJWT, allowedRoles(['ADMIN']), createShippingMethodValidator(), validateRequest, async (req: Request, res: Response) => {
  try {
    const { name, description, provider, fields, companyId } = req.body;
    const method = await prisma.orderShippingMethod.create({
      data: { name, description, provider, fields, companyId: Number(companyId) },
    });
    res.status(201).json(method);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create shipping method' });
  }
});

router.get('/shipping-methods', getShippingMethodValidator(), validateRequest, async (req: Request, res: Response) => {
  try {
    const id = req.query.id ? Number(req.query.id) : undefined;
    const companyId = req.query.companyId ? Number(req.query.companyId) : undefined;

    if (id) {
      return res.json(await prisma.orderShippingMethod.findUnique({ where: { id } }));
    }
    const methods = await prisma.orderShippingMethod.findMany({
      where: companyId ? { companyId } : undefined,
    });
    res.json(methods);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch shipping methods' });
  }
});

router.put('/shipping-methods', authenticateJWT, allowedRoles(['ADMIN']), updateShippingMethodValidator(), validateRequest, async (req: Request, res: Response) => {
  try {
    const id = Number(req.query.id);
    const { name, description, provider, fields } = req.body;
    const method = await prisma.orderShippingMethod.update({
      where: { id },
      data: { name, description, provider, fields },
    });
    res.json(method);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update shipping method' });
  }
});

router.delete('/shipping-methods', authenticateJWT, allowedRoles(['ADMIN']), deleteShippingMethodValidator(), validateRequest, async (req: Request, res: Response) => {
  try {
    const id = Number(req.query.id);
    await prisma.orderShippingMethod.delete({ where: { id } });
    res.json({ message: 'Shipping method deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete shipping method' });
  }
});




export default router;