import { Request, Response, Router } from 'express';
import {prisma} from "../lib/prisma"
import { authenticateJWT, allowedRoles } from '../middleware/authJWT.middleware';
import { createCategoryValidator, createProductValidator, deleteCategoryValidator, deleteProductValidator, getCategoryValidator, getProductValidator, updateCategoryValidator, updateProductValidator } from '../validators/catalog.validator';
import { validateRequest } from '../validators/validatorRequest';
import { matchedData } from 'express-validator';

const router = Router();


// =================== CATEGORIES ===================

router.post('/categories', authenticateJWT, allowedRoles(['ADMIN']), createCategoryValidator(), validateRequest, async (req: Request, res: Response) => {
  try {
    const { name, description, color, companyId } = req.body;
    const category = await prisma.category.create({
      data: { name, description, color, companyId: Number(companyId) },
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
      orderBy: { id: "desc" }
    });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

router.put('/categories', authenticateJWT, allowedRoles(['ADMIN']), updateCategoryValidator(), validateRequest, async (req: Request, res: Response) => {
  try {
    const id = Number(req.query.id);
    const { name, description, color } = req.body;
    const category = await prisma.category.update({
      where: { id },
      data: { name, description, color },
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
    // 1. Use matchedData to get the validated/casted variables
    const data = matchedData(req, { locations: ["query"] });
    const { id, companyId, searchString, categories } = data;

    if (id) {
      const product = await prisma.product.findUnique({
        where: { id },
        include: { categories: true, images: true }
      });
      return res.json(product);
    }

    const products = await prisma.product.findMany({
      where: { 
        companyId, 
        AND: [
          // Search filter
          searchString ? {
            OR: [
              { name: { contains: searchString, mode: 'insensitive' } },
              { sku: { contains: searchString, mode: 'insensitive' } }
            ]
          } : {},
          
          // 2. Categories filter: Only apply if the array exists and isn't empty
          categories && categories.length > 0 ? {
            categories: {
              some: {
                id: { in: categories }
              }
            }
          } : {}
        ]
      },
      include: { categories: true, images: true },
      orderBy: { createdAt: "desc" }
    });

    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

router.put('/products',  authenticateJWT, allowedRoles(['ADMIN']), updateProductValidator(), validateRequest, async (req: Request, res: Response) => {
  try {
    const id = Number(req.query.id);
    const { name, description, price, sku, stock, disabled } = req.body;
    const product = await prisma.product.update({
      where: { id },
      data: { name, description, price, sku, stock, disabled },
    });
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update product' });
  }
});

router.delete('/products',  authenticateJWT, allowedRoles(['ADMIN']), deleteProductValidator(), validateRequest, async (req: Request, res: Response) => {
  try {
    const id = Number(req.query.id);
    await prisma.product.delete({ where: { id } });
    res.json({ message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete product' });
  }
});



export default router;