import request from 'supertest';
import { Application } from "express";
import { Product } from '../../generated/prisma/client';

export async function createProduct(app: Application, jwt: string, companyId: number, name: string, price: number, stock: number, categoryIds: number[]):Promise<Product>  {

  const res = await request(app)
    .post('/api/catalog/products')
    .set('Authorization', `Bearer ${jwt}`)
    .send({
      companyId,
      name,
      price,
      stock,
      categoryIds
    });

  return res.body
}

