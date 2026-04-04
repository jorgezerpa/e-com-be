import request from 'supertest';
import { Application } from "express";

export async function registerAdmin(app: Application):Promise<{ email: string, password: string, name: string }>  {
  const user = {
    email: "admin@test.com",
    password: "password123456",
    name: "Admin User"
  };

  const res = await request(app)
    .post('/api/auth/register')
    .send(user)
    .expect(201)
  
  return user
}

