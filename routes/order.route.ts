import { Request, Response, Router } from 'express';
import {prisma} from "../lib/prisma"
import { allowedRoles, authenticateJWT } from '../middleware/authJWT.middleware';
import { checkSchema } from 'express-validator';
import { validateRequest } from '../validators/validatorRequest';
import { createOrderValidator, deleteOrderValidator, getOrderValidator, updateOrderValidator } from '../validators/order.validator';

const router = Router();

// Create Order (with items and initial event)
// @todo secure this to be called (almost) only from my frontend (it's impossible to make this impossible, but I can make it very very hard)
router.post('/', createOrderValidator(), validateRequest, async (req: Request, res: Response) => {
  try {
    const { 
      companyId, totalAmount, state, items,
      customer_firstName, customer_lastName, customer_whatsapp_number,
      customer_identification_number, customer_email, customer_address,
      shipping_country, shipping_city, shipping_zipCode,
      shipping_name_at_purchase, shipping_provider_at_purchase,
      shipping_fields_at_purchase, shipping_fields_response,
      payment_name_at_purchase, payment_provider_at_purchase,
      payment_fields_at_purchase, payment_fields_response,
      originFields
    } = req.body;

    const order = await prisma.order.create({
      data: {
        companyId: Number(companyId),
        totalAmount,
        state: state || 'PENDING',
        customer_firstName,
        customer_lastName,
        customer_whatsapp_number,
        customer_identification_number,
        customer_email,
        customer_address,
        shipping_country,
        shipping_city,
        shipping_zipCode,
        shipping_name_at_purchase,
        shipping_provider_at_purchase,
        shipping_fields_at_purchase,
        shipping_fields_response,
        payment_name_at_purchase,
        payment_provider_at_purchase,
        payment_fields_at_purchase,
        payment_fields_response,
        originFields,
        items: {
          create: items // Array of order items mapped to the OrderItem schema
        },
        orderEvents: {
          create: {
            state: state || 'PENDING',
            notes: [`Order created on ${new Date().toISOString()}`]
          }
        }
      },
      include: { items: true, orderEvents: true }
    });

    const uuidIdentifier = order.trackingToken

    // @todo send email with the magic link


    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create order' });
  }
});

router.get('/', authenticateJWT, allowedRoles(['ADMIN']), getOrderValidator(), validateRequest, async (req: Request, res: Response) => {
  try {
    const id = req.query.id ? Number(req.query.id) : undefined;
    const companyId = req.query.companyId ? Number(req.query.companyId) : undefined;

    if (id) {
      return res.json(await prisma.order.findUnique({
        where: { id },
        include: { items: true, orderEvents: true }
      }));
    }

    const orders = await prisma.order.findMany({
      where: companyId ? { companyId } : undefined,
      include: { items: true }
    });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Update Order (and push a new event to the trace)
router.put('/', authenticateJWT, allowedRoles(['ADMIN']), updateOrderValidator(), validateRequest, async (req: Request, res: Response) => {
  try {
    const id = Number(req.query.id);
    const { state, notes } = req.body; // Pass notes for the event log
    
    const updateData: any = { ...req.body };
    delete updateData.notes; // Remove notes from order body payload

    const order = await prisma.order.update({
      where: { id },
      data: {
        ...updateData,
        // If state changed or notes provided, create a new history event
        ...(state ? {
          orderEvents: {
            create: {
              state,
              notes: notes ? [notes] : []
            }
          }
        } : {})
      },
      include: { orderEvents: true }
    });
    
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update order' });
  }
});

// Delete Order
router.delete('/', authenticateJWT, allowedRoles(['ADMIN']), deleteOrderValidator(), validateRequest, async (req: Request, res: Response) => {
  try {
    const id = Number(req.query.id);
    await prisma.order.delete({ where: { id } });
    res.json({ message: 'Order deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete order' });
  }
});


/////// 
// CLIENT FACING ENDPOINTS 
/////// 

// GET SINGLE ORDER (Via Magic Link UUID ONLY)
router.get('/tracking/:uuid', async (req, res) => {
  try {
    const { uuid } = req.params;

    // Use findUnique if your trackingToken is marked @unique in Prisma (recommended)
    const order = await prisma.order.findUnique({
      where: { trackingToken: uuid },
      include: { 
        items: true, 
        orderEvents: { orderBy: { createdAt: 'desc' } } 
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order link is invalid or has expired.' });
    }

    // Optional: Only return necessary fields to guests for privacy
    const { customer_identification_number, ...safeOrderData } = order;

    res.status(200).json(safeOrderData);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tracking details' });
  }
});


// Useful in future when implements client profiles creation and SSO
// // GET USER ORDER HISTORY OR SPECIFIC ORDER
// router.get('/my-orders', authenticateJWT, async (req, res) => {
//   try {
//     const userId = (req as any).user.id;
//     const orderId = req.query.id ? Number(req.query.id) : undefined;

//     // If an ID is provided, find that specific order for THIS user
//     if (orderId) {
//       const order = await prisma.order.findFirst({
//         where: {
//           id: orderId,
//           userId: userId // Strict ownership check
//         },
//         include: { items: true, orderEvents: true }
//       });

//       if (!order) {
//         return res.status(404).json({ error: 'Order not found or access denied.' });
//       }
//       return res.json(order);
//     }

//     // Otherwise, return the full list of orders owned by the user
//     const orders = await prisma.order.findMany({
//       where: { userId: userId },
//       orderBy: { createdAt: 'desc' },
//       include: { items: true }
//     });

//     res.json(orders);
//   } catch (error) {
//     res.status(500).json({ error: 'Failed to fetch order history' });
//   }
// });

export default router;