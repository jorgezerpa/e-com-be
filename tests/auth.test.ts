import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../app';
import { prisma } from "../lib/prisma";
import bcrypt from 'bcrypt';

interface TableNameRow { tablename: string; }

describe('Auth & User Endpoints', () => {
  beforeEach(async () => {
    // Database Cleanup
    const tablenames = await prisma.$queryRawUnsafe<TableNameRow[]>(
      `SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname='public'`
    );
    const tables = tablenames
      .map(({ tablename }) => tablename)
      .filter((name) => name !== '_prisma_migrations')
      .map((name) => `"public"."${name}"`)
      .join(', ');

    if (tables.length > 0) {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} RESTART IDENTITY CASCADE;`);
    }
  });

  describe('POST /auth/register', () => {
    const validUser = {
      email: "admin@test.com",
      password: "password123",
      name: "Admin User"
    };

    it('Success: Should create an Auth record and a linked User', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(validUser);

      expect(res.status).toBe(201);
      
      const auth = await prisma.auth.findUnique({
        where: { email: validUser.email },
        include: { user: true }
      });

      expect(auth).not.toBeNull();
      expect(auth?.user?.name).toBe(validUser.name);
      
      const isMatch = await bcrypt.compare(validUser.password, auth!.passwordHash);
      expect(isMatch).toBe(true);
    });

    it('Validation: Should return 400 if email is invalid', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ ...validUser, email: "not-an-email" });

      expect(res.status).toBe(400);
      expect(res.body.errors).toBeDefined();
      expect(res.body.errors[0].path).toBe('email');
    });
  });

  describe('POST /auth/login', () => {
    beforeEach(async () => {
      await request(app).post('/api/auth/register').send({
        email: "login@test.com",
        password: "securePassword!",
        name: "Login User"
      });
    });

    it('Success: Should return a valid JWT and user payload on correct credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: "login@test.com", password: "securePassword!" });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.name).toBe("Login User");
    });

    it('Error: Should return 401 on incorrect password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: "login@test.com", password: "wrongpassword" });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe("Invalid credentials");
    });
  });
});