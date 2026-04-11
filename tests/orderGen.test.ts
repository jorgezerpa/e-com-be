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

describe('Generate Orders', () => {
    let admin;
    let jwt: string;
    let companyId: number;
    let productId: number;
    let paymentMethodId: number;
    let shippingMethodId: number;

  beforeEach(async () => {

    jwt = await getJWT(app, "admin@admin.com", "123456789")
    // const company = await createCompany(app, jwt)
    companyId = 1;
    const category = await createCategory(app, jwt, companyId)
    const product = await createProduct(app, jwt, companyId, "product sss", 99.99, 10, [category.id])
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

    it('Gen', async () => {
        const res = await request(app)
        .post('/api/order')
        .set('Authorization', `Bearer ${jwt}`) // Assuming JWT is defined in outer scope
        .send(getBasePayload());

        expect(res.status).toBe(201);
        expect(res.body.state).toBe("PENDING");
        
        expect(Number(res.body.totalAmount)).toBe(99.99);
    });
  })

});