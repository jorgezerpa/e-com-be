import request from 'supertest';
import { Application } from "express";
import { OrderPaymentMethod, Product } from '../../generated/prisma/client';

export async function createShippingMethod(
  app: Application, 
  jwt: string, 
  name: string, 
  description: string, 
  provider: string, 
  fields: any, // object i.e {"field name": "description of the field"} //// what should I provide after pay (like a payment cap, etc)
  companyId: number  
):Promise<OrderPaymentMethod>  {

  const res = await request(app)
    .post('/api/method/shipping-methods')
    .set('Authorization', `Bearer ${jwt}`)
    .send({
      companyId,
      name, 
      description,
      provider,
      fields
    })
    .expect(201)

  return res.body
}

