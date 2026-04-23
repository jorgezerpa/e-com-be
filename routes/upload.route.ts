import { Router, Request, Response } from 'express';
import * as SharedScreenController from '../controllers/SharedScreen.controller';
import { JWTAuthRequest } from '../types/request';
import multer from 'multer';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import path from 'path';
import { prisma } from "../lib/prisma";
import { allowedRoles, authenticateJWT } from '../middleware/authJWT.middleware';

// Initialize S3 Client
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

// Configure multer middleware
const storage = multer.memoryStorage();
export const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});


// routes
const uploadRoute = Router();

// GET /api/datavis/get_agents_positions
uploadRoute.post('/product-images', authenticateJWT, allowedRoles(['ADMIN']), upload.single("profile"), async (req: Request, res: Response) => {
  try {
    // @todo add middleware to check inputs 
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const productId = req.body.productId

    const product = await prisma.product.findUnique({ where: { id: productId } })    
    if(!product) return res.status(400).json({ message: 'Product not exists' });

    const file = req.file;
    const fileName = `product-${product.id}-${product.name}-${Date.now()}-${Math.round(Math.random() * 1e9)}`;

    // 4. Upload to S3
    const uploadParams = {
      Bucket: process.env.AWS_S_BUCKET_NAME,
      Key: fileName,
      Body: file.buffer, // The file data from Multer
      ContentType: file.mimetype,
    };

    await s3Client.send(new PutObjectCommand(uploadParams));

    // 5. Construct the S3 URL
    // Standard format: https://bucket-name.s3.region.amazonaws.com/key
    const s3Url = `https://${process.env.AWS_S_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;

    /* DATABASE LOGIC */
    await prisma.product.update({ where: { id: productId }, data: { images: { create: { url:s3Url } } } })

    return res.status(200).json({
      message: 'Uploaded to AWS S3 successfully',
      url: s3Url,
    });
  } catch (error) {
    console.error('S3 Upload Error:', error);
    return res.status(500).json({ message: 'Upload failed' });
  }
});



export default uploadRoute