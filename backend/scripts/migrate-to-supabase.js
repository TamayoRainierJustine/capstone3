import dotenv from 'dotenv';
import { Sequelize } from 'sequelize';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

// MySQL connection (source)
const mysqlSequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    logging: false
  }
);

// Supabase PostgreSQL connection (destination)
const supabaseSequelize = new Sequelize(
  process.env.SUPABASE_DB_URL || process.env.DATABASE_URL,
  {
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    logging: console.log
  }
);

async function migrateData() {
  try {
    console.log('🔄 Starting data migration from MySQL to Supabase...\n');

    // Test connections
    console.log('📡 Testing MySQL connection...');
    await mysqlSequelize.authenticate();
    console.log('✅ MySQL connection established\n');

    console.log('📡 Testing Supabase connection...');
    await supabaseSequelize.authenticate();
    console.log('✅ Supabase connection established\n');

    // Migrate Users
    console.log('👥 Migrating Users...');
    const mysqlUsers = await mysqlSequelize.query(
      'SELECT * FROM Users',
      { type: mysqlSequelize.QueryTypes.SELECT }
    );

    for (const user of mysqlUsers) {
      await supabaseSequelize.query(
        `INSERT INTO "Users" (id, "firstName", "lastName", email, password, role, "createdAt", "updatedAt")
         VALUES (:id, :firstName, :lastName, :email, :password, :role, :createdAt, :updatedAt)
         ON CONFLICT (id) DO UPDATE SET
           "firstName" = EXCLUDED."firstName",
           "lastName" = EXCLUDED."lastName",
           email = EXCLUDED.email,
           password = EXCLUDED.password,
           role = EXCLUDED.role,
           "updatedAt" = EXCLUDED."updatedAt"`,
        {
          replacements: {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            password: user.password,
            role: user.role || 'user',
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
          }
        }
      );
    }
    console.log(`✅ Migrated ${mysqlUsers.length} users\n`);

    // Migrate Stores
    console.log('🏪 Migrating Stores...');
    const mysqlStores = await mysqlSequelize.query(
      'SELECT * FROM Stores',
      { type: mysqlSequelize.QueryTypes.SELECT }
    );

    for (const store of mysqlStores) {
      // Handle JSON content
      let content = null;
      if (store.content) {
        try {
          content = typeof store.content === 'string' 
            ? JSON.parse(store.content) 
            : store.content;
        } catch (e) {
          console.warn(`⚠️  Could not parse content for store ${store.id}:`, e.message);
        }
      }

      await supabaseSequelize.query(
        `INSERT INTO "Stores" (id, "userId", "templateId", "storeName", description, "domainName", 
         region, province, municipality, barangay, "contactEmail", phone, status, content, 
         "createdAt", "updatedAt")
         VALUES (:id, :userId, :templateId, :storeName, :description, :domainName, 
         :region, :province, :municipality, :barangay, :contactEmail, :phone, :status, :content::jsonb, 
         :createdAt, :updatedAt)
         ON CONFLICT (id) DO UPDATE SET
           "userId" = EXCLUDED."userId",
           "templateId" = EXCLUDED."templateId",
           "storeName" = EXCLUDED."storeName",
           description = EXCLUDED.description,
           "domainName" = EXCLUDED."domainName",
           region = EXCLUDED.region,
           province = EXCLUDED.province,
           municipality = EXCLUDED.municipality,
           barangay = EXCLUDED.barangay,
           "contactEmail" = EXCLUDED."contactEmail",
           phone = EXCLUDED.phone,
           status = EXCLUDED.status,
           content = EXCLUDED.content,
           "updatedAt" = EXCLUDED."updatedAt"`,
        {
          replacements: {
            id: store.id,
            userId: store.userId,
            templateId: store.templateId,
            storeName: store.storeName,
            description: store.description,
            domainName: store.domainName,
            region: store.region,
            province: store.province,
            municipality: store.municipality,
            barangay: store.barangay,
            contactEmail: store.contactEmail,
            phone: store.phone,
            status: store.status || 'draft',
            content: content ? JSON.stringify(content) : null,
            createdAt: store.createdAt,
            updatedAt: store.updatedAt
          }
        }
      );
    }
    console.log(`✅ Migrated ${mysqlStores.length} stores\n`);

    // Migrate Products
    console.log('📦 Migrating Products...');
    const mysqlProducts = await mysqlSequelize.query(
      'SELECT * FROM Products',
      { type: mysqlSequelize.QueryTypes.SELECT }
    );

    for (const product of mysqlProducts) {
      await supabaseSequelize.query(
        `INSERT INTO "Products" (id, "storeId", name, description, price, image, stock, "isActive", 
         "createdAt", "updatedAt")
         VALUES (:id, :storeId, :name, :description, :price, :image, :stock, :isActive, 
         :createdAt, :updatedAt)
         ON CONFLICT (id) DO UPDATE SET
           "storeId" = EXCLUDED."storeId",
           name = EXCLUDED.name,
           description = EXCLUDED.description,
           price = EXCLUDED.price,
           image = EXCLUDED.image,
           stock = EXCLUDED.stock,
           "isActive" = EXCLUDED."isActive",
           "updatedAt" = EXCLUDED."updatedAt"`,
        {
          replacements: {
            id: product.id,
            storeId: product.storeId,
            name: product.name,
            description: product.description,
            price: product.price,
            image: product.image,
            stock: product.stock || 0,
            isActive: product.isActive !== undefined ? product.isActive : true,
            createdAt: product.createdAt,
            updatedAt: product.updatedAt
          }
        }
      );
    }
    console.log(`✅ Migrated ${mysqlProducts.length} products\n`);

    // Migrate Orders
    console.log('🛒 Migrating Orders...');
    const mysqlOrders = await mysqlSequelize.query(
      'SELECT * FROM Orders',
      { type: mysqlSequelize.QueryTypes.SELECT }
    );

    for (const order of mysqlOrders) {
      await supabaseSequelize.query(
        `INSERT INTO "Orders" (id, "storeId", "customerName", "customerEmail", "customerPhone", 
         "shippingAddress", status, "totalAmount", "createdAt", "updatedAt")
         VALUES (:id, :storeId, :customerName, :customerEmail, :customerPhone, 
         :shippingAddress, :status, :totalAmount, :createdAt, :updatedAt)
         ON CONFLICT (id) DO UPDATE SET
           "storeId" = EXCLUDED."storeId",
           "customerName" = EXCLUDED."customerName",
           "customerEmail" = EXCLUDED."customerEmail",
           "customerPhone" = EXCLUDED."customerPhone",
           "shippingAddress" = EXCLUDED."shippingAddress",
           status = EXCLUDED.status,
           "totalAmount" = EXCLUDED."totalAmount",
           "updatedAt" = EXCLUDED."updatedAt"`,
        {
          replacements: {
            id: order.id,
            storeId: order.storeId,
            customerName: order.customerName,
            customerEmail: order.customerEmail,
            customerPhone: order.customerPhone || null,
            shippingAddress: order.shippingAddress,
            status: order.status || 'pending',
            totalAmount: order.totalAmount,
            createdAt: order.createdAt,
            updatedAt: order.updatedAt
          }
        }
      );
    }
    console.log(`✅ Migrated ${mysqlOrders.length} orders\n`);

    // Migrate OrderItems
    console.log('📋 Migrating OrderItems...');
    const mysqlOrderItems = await mysqlSequelize.query(
      'SELECT * FROM OrderItems',
      { type: mysqlSequelize.QueryTypes.SELECT }
    );

    for (const item of mysqlOrderItems) {
      await supabaseSequelize.query(
        `INSERT INTO "OrderItems" (id, "orderId", "productId", quantity, price, "createdAt", "updatedAt")
         VALUES (:id, :orderId, :productId, :quantity, :price, :createdAt, :updatedAt)
         ON CONFLICT (id) DO UPDATE SET
           "orderId" = EXCLUDED."orderId",
           "productId" = EXCLUDED."productId",
           quantity = EXCLUDED.quantity,
           price = EXCLUDED.price,
           "updatedAt" = EXCLUDED."updatedAt"`,
        {
          replacements: {
            id: item.id,
            orderId: item.orderId,
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt
          }
        }
      );
    }
    console.log(`✅ Migrated ${mysqlOrderItems.length} order items\n`);

    // Reset sequences to match migrated IDs
    console.log('🔄 Resetting sequences...');
    const maxUserId = await supabaseSequelize.query(
      'SELECT MAX(id) as max_id FROM "Users"',
      { type: supabaseSequelize.QueryTypes.SELECT }
    );
    if (maxUserId[0]?.max_id) {
      await supabaseSequelize.query(
        `SELECT setval('"Users_id_seq"', ${maxUserId[0].max_id}, true)`
      );
    }

    const maxStoreId = await supabaseSequelize.query(
      'SELECT MAX(id) as max_id FROM "Stores"',
      { type: supabaseSequelize.QueryTypes.SELECT }
    );
    if (maxStoreId[0]?.max_id) {
      await supabaseSequelize.query(
        `SELECT setval('"Stores_id_seq"', ${maxStoreId[0].max_id}, true)`
      );
    }

    const maxProductId = await supabaseSequelize.query(
      'SELECT MAX(id) as max_id FROM "Products"',
      { type: supabaseSequelize.QueryTypes.SELECT }
    );
    if (maxProductId[0]?.max_id) {
      await supabaseSequelize.query(
        `SELECT setval('"Products_id_seq"', ${maxProductId[0].max_id}, true)`
      );
    }

    console.log('✅ Sequences reset\n');

    console.log('✅ Migration completed successfully!');
    console.log('\n📊 Migration Summary:');
    console.log(`   Users: ${mysqlUsers.length}`);
    console.log(`   Stores: ${mysqlStores.length}`);
    console.log(`   Products: ${mysqlProducts.length}`);
    console.log(`   Orders: ${mysqlOrders.length}`);
    console.log(`   OrderItems: ${mysqlOrderItems.length}`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await mysqlSequelize.close();
    await supabaseSequelize.close();
  }
}

// Run migration
migrateData()
  .then(() => {
    console.log('\n✅ Migration script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration script failed:', error);
    process.exit(1);
  });

