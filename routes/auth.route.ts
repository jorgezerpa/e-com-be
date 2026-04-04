import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
// import { PrismaClient, User, Role } from "../generated/prisma/client";
import {prisma} from "../lib/prisma"
import { loginValidator, registerValidator } from '../validators/auth.validator';
import { validateRequest } from '../validators/validatorRequest';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

// Register User & Auth
router.post('/register', registerValidator(), validateRequest, async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;
    const passwordHash = await bcrypt.hash(password, 10);

    const auth = await prisma.auth.create({
      data: {
        email,
        passwordHash,
        role: "ADMIN",
        user: {
          create: { name },
        },
      },
      include: { user: true },
    });

    res.status(201).json(auth);
  } catch (error) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
router.post('/login', loginValidator(), validateRequest, async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const auth = await prisma.auth.findUnique({
      where: { email },
      include: { user: true },
    });

    if (!auth || !(await bcrypt.compare(password, auth.passwordHash))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // sub is userId
    const token = jwt.sign({ sub: auth.user?.id, role: auth.role }, JWT_SECRET, {
      expiresIn: '1d',
    });

    res.json({ token, user: auth.user });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});


export default router;