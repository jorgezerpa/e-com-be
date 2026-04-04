import request from 'supertest';
import { Application } from "express";
import { Company } from '../../generated/prisma/client';

export async function createCompany(app: Application, jwt: string):Promise<Company>  {

  const res = await request(app)
    .post('/api/company')
    .set('Authorization', `Bearer ${jwt}`)
    .send({ name: "Tech Corp", currency: "USD" })
    .expect(201)

  return res.body

}

