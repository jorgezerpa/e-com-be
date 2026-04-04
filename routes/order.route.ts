import { Request, Response, Router } from 'express';
import {prisma} from "../lib/prisma"
import { allowedRoles, authenticateJWT } from '../middleware/authJWT.middleware';
import { checkSchema } from 'express-validator';
import { validateRequest } from '../validators/validatorRequest';
import { createOrderValidator, deleteOrderValidator, getOrderValidator, updateOrderValidator } from '../validators/order.validator';
import { Decimal } from '@prisma/client/runtime/client';
import { Currency } from '../generated/prisma/enums';

const router = Router();

// Create Order (with items and initial event)
// @todo secure this to be called (almost) only from my frontend (it's impossible to make this impossible, but I can make it very very hard)
router.post('/', createOrderValidator(), validateRequest, async (req: Request, res: Response) => {
  try {
    const { 
      companyId, 
      requestedItems, // Array of: { productId: number, quantity: number }
      paymentMethodId, shippingMethodId,
      customer_firstName, customer_lastName, customer_whatsapp_number,
      customer_identification_number, customer_email, customer_address,
      shipping_country, shipping_city, shipping_zipCode,
      shipping_fields_response, payment_fields_response,
      originFields
    } = req.body;

    const parsedCompanyId = Number(companyId);

    // 1. Validate Payment and Shipping Methods against the DB
    const [paymentMethod, shippingMethod] = await Promise.all([
      prisma.orderPaymentMethod.findUnique({ where: { id: Number(paymentMethodId) } }),
      prisma.orderShippingMethod.findUnique({ where: { id: Number(shippingMethodId) } })
    ]);

    if (!paymentMethod || paymentMethod.companyId !== parsedCompanyId) {
      return res.status(400).json({ error: 'Invalid or missing payment method' });
    }
    if (!shippingMethod || shippingMethod.companyId !== parsedCompanyId) {
      return res.status(400).json({ error: 'Invalid or missing shipping method' });
    }

    // 2. Fetch Products and Company Currency
    // @todo check for no repeated ids, and check for products list to have the same length
    const productIds = requestedItems.map((item: { productId: number }) => item.productId);
    
    const [products, companyConfig] = await Promise.all([
      prisma.product.findMany({ where: { id: { in: productIds }, companyId: parsedCompanyId } }),
      prisma.companyConfig.findUnique({ where: { companyId: parsedCompanyId } })
    ]);

    const currency = companyConfig?.currency;

    if(!currency) {
      return res.status(400).json({ error: 'Invalid/unexistant company currency' });
    }

    // 3. Verify Stock and Calculate Totals
    let totalAmount = 0;
    const orderItemsData:{
        productId: number,
        quantity: number,
        priceAtPurchase: Decimal,
        currencyAtPurchase: Currency,
        nameAtPurchase: string,
      }[] = [];

    for (const reqItem of requestedItems) {
      const product = products.find(p => p.id === reqItem.productId);

      // Does the product exist?
      if (!product) {
        return res.status(400).json({ error: `Product with ID ${reqItem.productId} not found` });
      }

      // Is there enough stock?
      if (product.stock < reqItem.quantity) {
        return res.status(400).json({ error: `Not enough stock for product: ${product.name}` });
      }

      // Calculate total securely on the backend
      totalAmount += Number(product.price) * reqItem.quantity;

      // Build the snapshot for the OrderItem table
      orderItemsData.push({
        productId: product.id,
        quantity: reqItem.quantity,
        priceAtPurchase: product.price,
        currencyAtPurchase: currency,
        nameAtPurchase: product.name,
      });
    }

    // 4. Execute DB Operations safely in a Transaction
    const order = await prisma.$transaction(async (tx) => {
      
      // A. Decrement stock for all purchased items
      for (const item of requestedItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } }
        });
      }

      // B. Create the actual order using the DB snapshots
      return await tx.order.create({
        data: {
          companyId: parsedCompanyId,
          totalAmount,
          state: 'PENDING',
          customer_firstName,
          customer_lastName,
          customer_whatsapp_number,
          customer_identification_number,
          customer_email,
          customer_address,
          shipping_country,
          shipping_city,
          shipping_zipCode,
          
          // Snapshot from Shipping Method DB
          shipping_name_at_purchase: shippingMethod.name,
          shipping_provider_at_purchase: shippingMethod.provider,
          shipping_fields_at_purchase: shippingMethod.fields || {},
          shipping_fields_response: shipping_fields_response || {},
          
          // Snapshot from Payment Method DB
          payment_name_at_purchase: paymentMethod.name,
          payment_provider_at_purchase: paymentMethod.provider,
          payment_fields_at_purchase: paymentMethod.fields || {},
          payment_fields_response: payment_fields_response || {},
          
          originFields: originFields || {},
          
          items: {
            create: orderItemsData
          },
          orderEvents: {
            create: {
              state: 'PENDING',
              notes: [`Order created on ${new Date().toISOString()}`]
            }
          }
        },
        include: { items: true, orderEvents: true }
      });
    });

    const uuidIdentifier = order.trackingToken;

    // @todo send email with the magic link

    res.status(201).json(order);
  } catch (error) {
    console.error("Order Creation Error:", error);
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
// @todo handle collaterals in order updates, for example, if an order is Cancelled, you must increase the stock of the product again 
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