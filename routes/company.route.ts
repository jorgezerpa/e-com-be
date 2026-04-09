import { Request, Response, Router } from 'express';
import {prisma} from "../lib/prisma"
import { allowedRoles, authenticateJWT } from '../middleware/authJWT.middleware';
import { validateRequest } from '../validators/validatorRequest';
import { createCompanyValidator, deleteCompanyValidator, getCompanyValidator, updateCompanyConfigValidator, updateCompanyValidator } from '../validators/company.validator';

const router = Router();

// Create Company (includes Config creation)
router.post('/', authenticateJWT, allowedRoles(['ADMIN']), createCompanyValidator(), validateRequest, async (req: Request, res: Response) => {
  try {
    const { name, currency, showOutOfStockProducts } = req.body;
    const adminId = (req as any).user.id
    const company = await prisma.company.create({
      data: {
        adminId: Number(adminId),
        name,
        companyConfig: {
          create: {
            currency: currency || 'USD',
            showOutOfStockProducts: showOutOfStockProducts ?? false,
          },
        },
      },
      include: { companyConfig: true },
    });
    res.status(201).json(company);
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: 'Failed to create company' });
  }
});

// Get Company (or all companies)
router.get('/', authenticateJWT, allowedRoles(['ADMIN']), getCompanyValidator(), validateRequest, async (req: Request, res: Response) => {
  try {
    const id = req.query.id ? Number(req.query.id) : undefined;
    if (id) {
      const company = await prisma.company.findUnique({
        where: { id },
        include: { companyConfig: true },
      });
      return res.json(company);
    }
    const companies = await prisma.company.findMany({ 
      include: {
        _count: {
          select: {
            products: true,
            orders: true
          }
        }
      }
     });
    
     const result = companies.map(c => ({ id: c.id, name: c.name, stats: { products: c._count.products, orders: c._count.orders }  }))
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch companies' });
  }
});

// Update Company
router.put('/', authenticateJWT, allowedRoles(['ADMIN']), updateCompanyValidator(), validateRequest, async (req: Request, res: Response) => {
  try {
    const id = Number(req.query.id);
    const { name } = req.body;
    const company = await prisma.company.update({
      where: { id },
      data: { name },
    });
    res.json(company);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update company' });
  }
});

// Update Company Config
router.put('/config', authenticateJWT, allowedRoles(['ADMIN']), updateCompanyConfigValidator(), validateRequest, async (req: Request, res: Response) => {
  try {
    const companyId = Number(req.query.companyId);
    const { currency, showOutOfStockProducts } = req.body;
    const config = await prisma.companyConfig.update({
      where: { companyId },
      data: { currency, showOutOfStockProducts },
    });
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update company config' });
  }
});

// Delete Company
router.delete('/', authenticateJWT, allowedRoles(['ADMIN']), deleteCompanyValidator(), validateRequest, async (req: Request, res: Response) => {
  try {
    const id = Number(req.query.id);
    await prisma.company.delete({ where: { id } });
    res.json({ message: 'Company deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete company' });
  }
});





export default router;