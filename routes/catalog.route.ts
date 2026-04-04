import { Request, Response, Router } from 'express';
import {prisma} from "../lib/prisma"
import { authenticateJWT, allowedRoles } from '../middleware/authJWT.middleware';
import { createCategoryValidator, createProductValidator, deleteCategoryValidator, deleteProductValidator, getCategoryValidator, getProductValidator, updateCategoryValidator, updateProductValidator } from '../validators/catalog.validator';
import { validateRequest } from '../validators/validatorRequest';

const router = Router();


// =================== CATEGORIES ===================

router.post('/categories', authenticateJWT, allowedRoles(['ADMIN']), createCategoryValidator(), validateRequest, async (req: Request, res: Response) => {
  try {
    const { name, description, companyId } = req.body;
    const category = await prisma.category.create({
      data: { name, description, companyId: Number(companyId) },
    });
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create category' });
  }
});

router.get('/categories', getCategoryValidator(), validateRequest, async (req: Request, res: Response) => {
  try {
    const id = req.query.id ? Number(req.query.id) : undefined;
    const companyId = req.query.companyId ? Number(req.query.companyId) : undefined;

    if (id) {
      return res.json(await prisma.category.findUnique({ where: { id } }));
    }
    const categories = await prisma.category.findMany({
      where: companyId ? { companyId } : undefined,
    });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

router.put('/categories', authenticateJWT, allowedRoles(['ADMIN']), updateCategoryValidator(), validateRequest, async (req: Request, res: Response) => {
  try {
    const id = Number(req.query.id);
    const { name, description } = req.body;
    const category = await prisma.category.update({
      where: { id },
      data: { name, description },
    });
    res.json(category);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update category' });
  }
});

router.delete('/categories', authenticateJWT, allowedRoles(['ADMIN']), deleteCategoryValidator(), validateRequest, async (req: Request, res: Response) => {
  try {
    const id = Number(req.query.id);
    await prisma.category.delete({ where: { id } });
    res.json({ message: 'Category deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

// =================== PRODUCTS ===================

router.post('/products', authenticateJWT, allowedRoles(['ADMIN']), createProductValidator(), validateRequest,  async (req: Request, res: Response) => {
  try {
    const { name, description, price, sku, stock, companyId, categoryIds } = req.body;
    
    // categoryIds should be an array of IDs: [1, 2, 3]
    const categoriesConnection = categoryIds?.map((id: number) => ({ id })) || [];

    const product = await prisma.product.create({
      data: {
        name,
        description,
        price,
        sku,
        stock,
        companyId: Number(companyId),
        categories: { connect: categoriesConnection }
      },
    });
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create product' });
  }
});

router.get('/products', getProductValidator(), validateRequest, async (req: Request, res: Response) => {
  try {
    const id = req.query.id ? Number(req.query.id) : undefined;
    const companyId = req.query.companyId ? Number(req.query.companyId) : undefined;

    if (id) {
      return res.json(await prisma.product.findUnique({
        where: { id },
        include: { categories: true, images: true }
      }));
    }
    const products = await prisma.product.findMany({
      where: companyId ? { companyId } : undefined,
      include: { categories: true }
    });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

router.put('/products',  authenticateJWT, allowedRoles(['ADMIN']), updateProductValidator(), validateRequest, async (req: Request, res: Response) => {
  try {
    const id = Number(req.query.id);
    const { name, description, price, sku, stock } = req.body;
    const product = await prisma.product.update({
      where: { id },
      data: { name, description, price, sku, stock },
    });
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update product' });
  }
});

router.delete('/products',  authenticateJWT, allowedRoles(['ADMIN']), deleteProductValidator, validateRequest, async (req, res) => {
  try {
    const id = Number(req.query.id);
    await prisma.product.delete({ where: { id } });
    res.json({ message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete product' });
  }
});



export default router;