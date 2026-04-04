import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../app';
import { prisma } from "../lib/prisma";
import { getJWT } from './helpers/getJWT';
import { registerAdmin } from './helpers/user';

interface TableNameRow { tablename: string; }

describe('Company Endpoints', () => {
  let admin;
  let jwt: string;

  beforeEach(async () => {
    const tablenames = await prisma.$queryRawUnsafe<TableNameRow[]>(
      `SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname='public'`
    );
    const tables = tablenames.map(t => t.tablename).filter(n => n !== '_prisma_migrations').map(n => `"public"."${n}"`).join(', ');
    if (tables.length > 0) await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} RESTART IDENTITY CASCADE;`);

    // Create a base user to act as admin
    admin = await registerAdmin(app)
    jwt = await getJWT(app, admin.email, admin.password)
  });

  describe('POST /company', () => {
    it('Success: Should create a company and its default CompanyConfig', async () => {
      const res = await request(app)
        .post('/api/company')
        .set('Authorization', `Bearer ${jwt}`)
        .send({ name: "Tech Corp", currency: "USD" });

      expect(res.status).toBe(201);
      
      const config = await prisma.companyConfig.findUnique({
        where: { companyId: res.body.id }
      });
      expect(config).not.toBeNull();
      expect(config?.currency).toBe("USD");
      expect(config?.showOutOfStockProducts).toBe(false);
    });
  });

  describe('PUT /company/config', () => {
    let companyId: number;

    beforeEach(async () => {
      const comp = await request(app).post('/api/company').set('Authorization', `Bearer ${jwt}`).send({ name: "Update Co" });
      companyId = comp.body.id;
    });

    it('Success: Should update the company configuration', async () => {
      const res = await request(app)
        .put('/api/company/config')
        .set('Authorization', `Bearer ${jwt}`)
        .query({ companyId })
        .send({ currency: "VES", showOutOfStockProducts: true, colors: ["#000"] });

      expect(res.status).toBe(200);
      expect(res.body.currency).toBe("VES");
      expect(res.body.showOutOfStockProducts).toBe(true);
    });

    it('Validation: Should return 400 if companyId is missing from query params', async () => {
      const res = await request(app).put('/api/company/config').set('Authorization', `Bearer ${jwt}`).send({ currency: "VES" });
      expect(res.status).toBe(400);
    });
  });
});
