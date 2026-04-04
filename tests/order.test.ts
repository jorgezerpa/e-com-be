import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../app';
import { prisma } from "../lib/prisma";
import { createCompany } from './helpers/company';
import { registerAdmin } from './helpers/user';
import { getJWT } from './helpers/getJWT';
import { createCategory } from './helpers/category';
import { createProduct } from './helpers/product';
import { createPaymentMethod } from './helpers/paymentMethod';
import { createShippingMethod } from './helpers/shippingMethod';

interface TableNameRow { tablename: string; }

describe('Order Endpoints', () => {
    let admin;
    let jwt: string;
    let companyId: number;
    let productId: number;
    let paymentMethodId: number;
    let shippingMethodId: number;

  beforeEach(async () => {
    const tablenames = await prisma.$queryRawUnsafe<TableNameRow[]>(
      `SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname='public'`
    );
    const tables = tablenames.map(t => t.tablename).filter(n => n !== '_prisma_migrations').map(n => `"public"."${n}"`).join(', ');
    if (tables.length > 0) await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} RESTART IDENTITY CASCADE;`);

    admin = await registerAdmin(app)
    jwt = await getJWT(app, admin.email, admin.password)
    const company = await createCompany(app, jwt)
    companyId = company.id;
    const category = await createCategory(app, jwt, companyId)
    const product = await createProduct(app, jwt, companyId, "product 1", 99.99, 10, [category.id])
    productId = product.id
    const paymentMethod = await createPaymentMethod(app, jwt, "Method 1", "desc1", "provide1", { field1: "value1", field2: "value2" }, { field1: "descF1", field2: "descF2" }, companyId)
    paymentMethodId = paymentMethod.id
    const shippingMethod = await createShippingMethod(app, jwt, "Method 1", "desc1", "provide1", { field1: "descF1", field2: "descF2" }, companyId)
    shippingMethodId = shippingMethod.id
});

    const getBasePayload = () => ({
        companyId,
        paymentMethodId,
        shippingMethodId,
        customer_firstName: "John",
        customer_lastName: "Doe",
        customer_whatsapp_number: "+123456789",
        customer_identification_number: "ID123",
        shipping_country: "US",
        shipping_city: "NY",
        shipping_zipCode: "10001",
        shipping_fields_response: {},
        payment_fields_response: {},
        requestedItems: [
        { productId, quantity: 1 }
        ]
    });

  describe('POST /order', () => {

    it('Success: Should create an order, decrement stock, and log events using DB-authoritative data', async () => {
        const res = await request(app)
        .post('/api/order')
        .set('Authorization', `Bearer ${jwt}`) // Assuming JWT is defined in outer scope
        .send(getBasePayload());

        expect(res.status).toBe(201);
        expect(res.body.state).toBe("PENDING");
        
        expect(Number(res.body.totalAmount)).toBe(99.99);

        // Verify stock was decremented (10 - 1 = 9)
        const product = await prisma.product.findUnique({ where: { id: productId } });
        expect(product?.stock).toBe(9);

        const order = await prisma.order.findUnique({
        where: { id: res.body.id },
        include: { items: true, orderEvents: true }
        });

        // Verify snapshots were taken from the DB, not the client
        expect(order?.items[0].nameAtPurchase).toBe("product 1");
        expect(order?.shipping_name_at_purchase).toBe("Method 1");
        expect(order?.payment_name_at_purchase).toBe("Method 1");
        expect(order?.orderEvents.length).toBe(1);
    });

    it('Error: Should return 400 if stock is insufficient', async () => {
        const payload = getBasePayload();
        payload.requestedItems[0].quantity = 999; // More than the 10 we created

        const res = await request(app)
        .post('/api/order')
        .set('Authorization', `Bearer ${jwt}`)
        .send(payload);

        expect(res.status).toBe(400);
        expect(res.body.error).toContain("Not enough stock");

        // Verify stock was NOT decremented (Transaction rollback check)
        const product = await prisma.product.findUnique({ where: { id: productId } });
        expect(product?.stock).toBe(10);
    });

    it('Security: Should return 400 if product belongs to a different company', async () => {
        // Create a product for a DIFFERENT company
        const otherCompany = await createCompany(app, jwt)
        const maliciousProduct = await createProduct(app, jwt, otherCompany.id, "name2", 1.00, 10, [])
        
        const payload = getBasePayload();
        payload.requestedItems = [{ productId: maliciousProduct.id, quantity: 1 }];

        const res = await request(app)
        .post('/api/order')
        .set('Authorization', `Bearer ${jwt}`)
        .send(payload);

        expect(res.status).toBe(400);
        expect(res.body.error).toContain("not found"); // Found in DB, but not for this companyId
    });
  });

  describe('PUT /order', () => {
    let orderId: number;

    beforeEach(async () => {
      // Mock basic order creation directly via Prisma for speed
      const order = await prisma.order.create({
        data: {
          companyId, totalAmount: 50, state: "PENDING", customer_firstName: "A", customer_lastName: "B", customer_whatsapp_number: "1", customer_identification_number: "1", shipping_country: "X", shipping_city: "X", shipping_zipCode: "X", shipping_name_at_purchase: "X", shipping_provider_at_purchase: "X", shipping_fields_at_purchase: {}, shipping_fields_response: {}, payment_name_at_purchase: "X", payment_provider_at_purchase: "X", payment_fields_at_purchase: {}, payment_fields_response: {}
        }
      });
      orderId = order.id;
    });

    it('Flow: Should update order state and push a new trace to OrderEvents', async () => {
      const res = await request(app)
        .put('/api/order')
        .set('Authorization', `Bearer ${jwt}`)
        .query({ id: orderId })
        .send({ state: "SHIPPED", notes: "Tracking #12345" });

      expect(res.status).toBe(200);
      expect(res.body.state).toBe("SHIPPED");

      const events = await prisma.orderEvent.findMany({ where: { orderId } });
      
      // Look for the newly appended event
      const shippedEvent = events.find(e => e.state === "SHIPPED");
      expect(shippedEvent).toBeDefined();
      expect(shippedEvent?.notes).toContain("Tracking #12345");
    });
  });
});