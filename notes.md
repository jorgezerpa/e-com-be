# TODOS
- handle products img upload 


## Admin flow
- Admins are registered under the User entity. 
- The basic flow:
    - Admin sign up 
    - Admin can now create many companies
    - Categories, products and orders, are related to one company


## User Purchase flow
- User Enter to your store
- pick up products
- clicks "buy" -> fills checkout form -> creates order
- On database -> a New Order row is created -> instead of being related with the products table, this will snapshot the product important data. This is better for ordering history and easiness for products' deletes and updates




## Important 
- Can not delete products due to historical reasons. Can only disable them
- Caps for products, categories and orders
- When orders 


-----------
Order -> product
- An order is associated with a product
- If the product is deleted -> then the order has no product 
- If the product is updated -> No it points to the 

Solution1:
- Store productSKU in order item 
- If want to delete a product:
    - "Hey, you have open orders with this product. Disable it to avoid new purchases and once the orders are done, delete it"
    - "You have orders related with this product, this orders will be removed within the product" -> "Delete and download related orders history"
- So, the rule is: If have open orders related with this product, you can not delete the product. If have related orders but are already closed, you can delete, but the orders will be deleted too (you will have the option to download such orders)

Solution2:
- "Cannot delete this product, you have open orders for it" "Disable to avoid new purchases" "view related orders"
- "If you delete this product, related orders will stay, but will have no reference to this product. We recomend you to downloadd your orders history first".






































<!-- 
generator client {
  provider = "prisma-client"
  output   = "../generated/prisma"
}

datasource db {
  provider = "postgresql"
}

enum OrderState {
  PENDING
  PROCESSING
  SHIPPED
  FINISHED
  CANCELLED
  STUCK
  REFUNDED
}

enum Currency {
  USD
  BS
}

model User {
  id      Int       @id @default(autoincrement())
  name    String
  auth    Auth      @relation(fields: [authId], references: [id])
  authId  Int       @unique
  company Company[]
}

model Auth {
  id           Int    @id @default(autoincrement())
  email        String @unique
  passwordHash String
  user         User?
}

model Company {
  id        Int        @id @default(autoincrement())
  admin     User       @relation(fields: [adminId], references: [id])
  adminId   Int        @unique
  name      String
  createdAt DateTime   @default(now())
  
  // Relations
  categories      Category[]
  products        Product[]
  orders          Order[]
}

model Product {
  id          Int      @id @default(autoincrement())
  name        String
  description String?
  price       Decimal  @db.Decimal(10, 2)
  sku         String?  @unique
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // 1 Company has many products
  company     Company  @relation(fields: [companyId], references: [id])
  companyId   Int

  // many-to-many with Categories
  categories  Category[]
  
  // 1 Product has many images
  images      ProductImage[]

  // Relation with orders that include this product
  orderItems OrderItem[]
}

model Category {
  id          Int      @id @default(autoincrement())
  name        String
  description String?

  // 1 Company has many categories
  company     Company  @relation(fields: [companyId], references: [id])
  companyId   Int

  // many-to-many with Products
  products    Product[]
}

model ProductImage {
  id        Int     @id @default(autoincrement())
  url       String  // Your "image-url" column
  altText   String?
  
  product   Product @relation(fields: [productId], references: [id], onDelete: Cascade)
  productId Int
}


model Order {
  id            Int          @id @default(autoincrement())
  state         OrderState   @default(PENDING)
  
  // Handling the "STUCK" logic
  stuckReason   String?      // Nullable: only filled if state is STUCK
  
  totalAmount   Decimal      @db.Decimal(10, 2)
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt

  // 1 Company has many orders
  company       Company      @relation(fields: [companyId], references: [id])
  companyId     Int

  // Customer Data
  customer_firstName              String
  customer_lastName               String
  customer_whatsapp_number        String
  customer_identification_number  String
  customer_email                  String?  
  customer_address                String?

  // Shipping data 
  shipping_country                String
  shipping_city                   String
  shipping_zipCode                String
  shipping_method                 OrderShippingMethod  @relation(fields: [shipping_method_id], references: [id])
  shipping_method_id              Int     @unique
  // An order consists of many items
  items                           OrderItem[]
}

model OrderShippingMethod { // 1-1 relation with Order table
  id        Int     @id @default(autoincrement())
  order     Order?  
  //j
  fieldsAtPurchase String[]
  values  String[]
  methodNameAtPurchase String
}


model OrderItem {
  id        Int     @id @default(autoincrement())
  quantity  Int
  
  // Snapshot of price at time of purchase
  priceAtPurchase Decimal @db.Decimal(10, 2)
  currencyAtPurchase Currency

  order     Order   @relation(fields: [orderId], references: [id], onDelete: Cascade)
  orderId   Int

  product   Product @relation(fields: [productId], references: [id])
  productId Int
}


///
model ShippingTemplate {
  id          Int     @id @default(autoincrement())
  name        String
  description String
  fields      String[]
}

 -->