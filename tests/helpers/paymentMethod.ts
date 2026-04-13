import request from 'supertest';
import { Application } from "express";
import { OrderPaymentMethod, Product } from '../../generated/prisma/client';

export async function createPaymentMethod(
  app: Application, 
  jwt: string, 
  name: string, 
  description: string, 
  provider: string, 
  receiverFields: any, // object i.e {title:value} //// where to pay 
  fields: any, // object i.e {"field name": "description of the field"} //// what should I provide after pay (like a payment cap, etc)
  companyId: number,
  askForPaymentProofImage: boolean
):Promise<OrderPaymentMethod>  {
  const res = await request(app)
    .post('/api/method/payment-methods')
    .set('Authorization', `Bearer ${jwt}`)
    .send({
      companyId,
      name, 
      description,
      provider,
      receiverFields,
      fields,
      askForPaymentProofImage
    })
    .expect(201)

  return res.body
}

