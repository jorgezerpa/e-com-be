import request from 'supertest';
import { Application } from "express";
import { Category } from '../../generated/prisma/client';

export async function createCategory(app: Application, jwt: string, companyId: number):Promise<Category>  {

  const res = await request(app)
    .post('/api/catalog/categories')
    .set('Authorization', `Bearer ${jwt}`)
    .send({ name: "cat1", description: "desc1", color: "BLUE", companyId })
    .expect(201)

  return res.body

}

