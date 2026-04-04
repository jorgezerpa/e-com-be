import { Router } from 'express';
import {prisma} from "../lib/prisma"
import { allowedRoles, authenticateJWT } from '../middleware/authJWT.middleware';

const router = Router();

// Create Company (includes Config creation)
router.post('/', authenticateJWT, allowedRoles(['ADMIN']), async (req, res) => {
  try {
    const { adminId, name, colors, currency, showOutOfStockProducts } = req.body;
    const company = await prisma.company.create({
      data: {
        adminId: Number(adminId),
        name,
        companyConfig: {
          create: {
            colors: colors || [],
            currency: currency || 'USD',
            showOutOfStockProducts: showOutOfStockProducts ?? false,
          },
        },
      },
      include: { companyConfig: true },
    });
    res.status(201).json(company);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create company' });
  }
});

// Get Company (or all companies)
router.get('/', authenticateJWT, allowedRoles(['ADMIN']), async (req, res) => {
  try {
    const id = req.query.id ? Number(req.query.id) : undefined;
    if (id) {
      const company = await prisma.company.findUnique({
        where: { id },
        include: { companyConfig: true },
      });
      return res.json(company);
    }
    const companies = await prisma.company.findMany();
    res.json(companies);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch companies' });
  }
});

// Update Company
router.put('/', authenticateJWT, allowedRoles(['ADMIN']), async (req, res) => {
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
router.put('/config', authenticateJWT, allowedRoles(['ADMIN']), async (req, res) => {
  try {
    const companyId = Number(req.query.companyId);
    const { colors, currency, showOutOfStockProducts } = req.body;
    const config = await prisma.companyConfig.update({
      where: { companyId },
      data: { colors, currency, showOutOfStockProducts },
    });
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update company config' });
  }
});

// Delete Company
router.delete('/', authenticateJWT, allowedRoles(['ADMIN']), async (req, res) => {
  try {
    const id = Number(req.query.id);
    await prisma.company.delete({ where: { id } });
    res.json({ message: 'Company deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete company' });
  }
});

export default router;