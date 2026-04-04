import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../app';
import { prisma } from "../lib/prisma";
import { registerAdmin } from './helpers/user';
import { getJWT } from './helpers/getJWT';
import { createCompany } from './helpers/company';
import { createCategory } from './helpers/category';

interface TableNameRow { tablename: string; }

describe('Catalog Endpoints', () => {
    let admin;
    let jwt: string;
    let companyId: number;
    let categoryId: number;

  beforeEach(async () => {
    const tablenames = await prisma.$queryRawUnsafe<TableNameRow[]>(
      `SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname='public'`
    );
    const tables = tablenames.map(t => t.tablename).filter(n => n !== '_prisma_migrations').map(n => `"public"."${n}"`).join(', ');
    if (tables.length > 0) await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} RESTART IDENTITY CASCADE;`);

    // Setup admin, get token, set up base company and category
    admin = await registerAdmin(app)
    jwt = await getJWT(app, admin.email, admin.password)
    const company = await createCompany(app, jwt)
    companyId = company.id;
    const category = await createCategory(app, jwt, companyId)
    categoryId = category.id;
  });

  describe('POST /catalog/products', () => {
    it('Success: Should create a product linked to categories', async () => {
      const res = await request(app)
        .post('/api/catalog/products')
        .set('Authorization', `Bearer ${jwt}`)
        .send({
          companyId,
          name: "Laptop",
          price: 999.99,
          stock: 15,
          categoryIds: [categoryId]
        });

      expect(res.status).toBe(201);
      
      const product = await prisma.product.findUnique({
        where: { id: res.body.id },
        include: { categories: true }
      });
      
      expect(product?.price.toString()).toBe("999.99");
      expect(product?.categories.length).toBe(1);
      expect(product?.categories[0].id).toBe(categoryId);
    });

    it('Validation: Should fail if price is not a valid number', async () => {
      const res = await request(app)
        .post('/api/catalog/products')
        .set('Authorization', `Bearer ${jwt}`)
        .send({ companyId, name: "Laptop", price: "Free", stock: 15 });

      expect(res.status).toBe(400);
      expect(res.body.errors.some((e: any) => e.path === 'price')).toBe(true);
    });
  });

  describe('GET /catalog/products', () => {
    it('Success: Should fetch products filtered by companyId', async () => {
      await request(app).post('/api/catalog/products').set('Authorization', `Bearer ${jwt}`).send({ companyId, name: "Phone", price: 500, stock: 10 });

      const res = await request(app).get('/api/catalog/products').query({ companyId });
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].name).toBe("Phone");
    });
  });
});