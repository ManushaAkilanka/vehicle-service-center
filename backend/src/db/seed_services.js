'use strict';

require('dotenv').config();
const { randomUUID } = require('crypto');
const pool = require('./pool');

const SEED_SERVICES = [
  // ── Bike Services ────────────────────────────────────────────────────────
  {
    name: 'Engine Oil Change (Mineral 1L)',
    vehicle_type: 'Bike',
    category: 'Oil & Lubrication',
    description: 'Mineral oil change incl. drain plug washer',
    price: 1200,
  },
  {
    name: 'Oil Filter Replacement',
    vehicle_type: 'Bike',
    category: 'Oil & Lubrication',
    description: 'OEM oil filter replacement',
    price: 450,
  },
  {
    name: 'Air Filter Replacement',
    vehicle_type: 'Bike',
    category: 'Filters',
    description: 'OEM air filter replacement',
    price: 650,
  },
  {
    name: 'Front Brake Pad Replacement',
    vehicle_type: 'Bike',
    category: 'Brakes',
    description: 'Brake pad replacement + caliper clean & adjustment',
    price: 1800,
  },
  {
    name: 'Chain Clean, Lube & Adjustment',
    vehicle_type: 'Bike',
    category: 'Drivetrain',
    description: 'Degrease, lubricate and tension chain',
    price: 800,
  },
  {
    name: 'Chain & Sprocket Kit Replacement',
    vehicle_type: 'Bike',
    category: 'Drivetrain',
    description: 'Full chain and sprocket set replacement',
    price: 3500,
  },
  {
    name: 'Spark Plug Replacement',
    vehicle_type: 'Bike',
    category: 'Ignition',
    description: 'OEM spark plug replacement + gap check',
    price: 900,
  },
  {
    name: 'Carburetor Cleaning & Tuning',
    vehicle_type: 'Bike',
    category: 'Fuel System',
    description: 'Ultrasonic clean, jet check, idle tuning',
    price: 1500,
  },
  {
    name: 'Bike Full Service / Tune-up',
    vehicle_type: 'Bike',
    category: 'General Service',
    description: 'Oil, filters, brakes, chain, full inspection',
    price: 2500,
  },

  // ── Car Services ─────────────────────────────────────────────────────────
  {
    name: 'Air Filter Replacement',
    vehicle_type: 'Car',
    category: 'Filters',
    description: 'OEM engine air filter replacement',
    price: 1200,
  },
  {
    name: 'Cabin/AC Filter Replacement',
    vehicle_type: 'Car',
    category: 'Filters',
    description: 'Pollen/cabin filter replacement',
    price: 1800,
  },
  {
    name: 'Front Brake Pad Replacement',
    vehicle_type: 'Car',
    category: 'Brakes',
    description: 'Pad replacement + disc clean & caliper service',
    price: 4500,
  },
  {
    name: 'Brake Fluid Flush',
    vehicle_type: 'Car',
    category: 'Brakes',
    description: 'Full brake fluid drain & refill, bleed all lines',
    price: 1800,
  },
  {
    name: 'Battery Test & Replacement',
    vehicle_type: 'Car',
    category: 'Electrical',
    description: 'Battery test, terminal clean, new battery fit',
    price: 3200,
  },
  {
    name: 'Tire Rotation & Balancing',
    vehicle_type: 'Car',
    category: 'Tires',
    description: 'Per wheel balancing + rotation',
    price: 500,
  },
  {
    name: 'Wheel Alignment',
    vehicle_type: 'Car',
    category: 'Tires',
    description: 'Computerized 4-wheel alignment',
    price: 2500,
  },
  {
    name: 'AC Gas Top-up & Leak Check',
    vehicle_type: 'Car',
    category: 'AC',
    description: 'Refrigerant top-up + pressure & leak test',
    price: 3800,
  },
  {
    name: 'Coolant Flush & Replacement',
    vehicle_type: 'Car',
    category: 'Cooling',
    description: 'Radiator flush, new coolant, hose check',
    price: 2800,
  },
  {
    name: 'Full Wash & Interior Cleaning',
    vehicle_type: 'Car',
    category: 'Detailing',
    description: 'Exterior wash, wax, interior vacuum & wipe',
    price: 1500,
  },
  {
    name: 'Transmission Oil Change',
    vehicle_type: 'Car',
    category: 'Oil & Lubrication',
    description: 'ATF/gear oil change incl. filter where fitted',
    price: 4000,
  },

  // ── Three Wheeler Services ────────────────────────────────────────────────
  {
    name: 'Engine Oil Change',
    vehicle_type: 'Three Wheeler',
    category: 'Oil & Lubrication',
    description: 'Engine oil + filter change',
    price: 1400,
  },
  {
    name: 'Air Filter Replacement',
    vehicle_type: 'Three Wheeler',
    category: 'Filters',
    description: 'OEM air filter replacement',
    price: 700,
  },
  {
    name: 'Brake Shoe Replacement',
    vehicle_type: 'Three Wheeler',
    category: 'Brakes',
    description: 'Rear drum brake shoe replacement + adjustment',
    price: 1600,
  },
  {
    name: 'Clutch Plate & Bearing Replacement',
    vehicle_type: 'Three Wheeler',
    category: 'Transmission',
    description: 'Clutch plate, pressure plate & bearing set',
    price: 3800,
  },
  {
    name: 'Carburetor Cleaning & Idle Adjustment',
    vehicle_type: 'Three Wheeler',
    category: 'Fuel System',
    description: 'Carb clean, float check, idle & mix tuning',
    price: 1200,
  },
  {
    name: 'Gear Oil Change',
    vehicle_type: 'Three Wheeler',
    category: 'Oil & Lubrication',
    description: 'Gearbox oil drain & refill',
    price: 1000,
  },
  {
    name: 'Full Tune-up & Inspection',
    vehicle_type: 'Three Wheeler',
    category: 'General Service',
    description: 'Oil, filters, brakes, clutch check, inspection',
    price: 2500,
  },
];

async function runSeed() {
  const conn = await pool.getConnection();
  try {
    console.log('--- Starting Service Catalog Migration & Seeding ---');

    // 1. Ensure vehicle_type column exists
    const [cols] = await conn.query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'services'
        AND COLUMN_NAME = 'vehicle_type'
    `);

    if (cols.length === 0) {
      console.log('Adding column vehicle_type to services table...');
      await conn.query(`
        ALTER TABLE services
        ADD COLUMN vehicle_type VARCHAR(50) NOT NULL DEFAULT 'Car' AFTER name
      `);
      console.log('vehicle_type column added successfully.');
    } else {
      console.log('vehicle_type column already exists.');
    }

    // 2. Ensure existing services have vehicle_type set (e.g. Engine Oil Change (5W-30) -> Car)
    await conn.query(`
      UPDATE services
      SET vehicle_type = 'Car'
      WHERE vehicle_type IS NULL OR vehicle_type = ''
    `);

    // 3. Seed services
    let insertedCount = 0;
    let existingCount = 0;

    for (const item of SEED_SERVICES) {
      const [existing] = await conn.query(
        'SELECT id, name, vehicle_type, current_price FROM services WHERE name = ? AND vehicle_type = ? LIMIT 1',
        [item.name, item.vehicle_type]
      );

      if (existing.length > 0) {
        existingCount++;
        // If deactivated, re-activate it
        await conn.query('UPDATE services SET active = TRUE WHERE id = ?', [existing[0].id]);
        continue;
      }

      const serviceId = randomUUID();
      const historyId = randomUUID();

      await conn.beginTransaction();
      try {
        await conn.query(`
          INSERT INTO services (id, name, vehicle_type, category, description, current_price, extra_details, active)
          VALUES (?, ?, ?, ?, ?, ?, NULL, TRUE)
        `, [serviceId, item.name, item.vehicle_type, item.category, item.description, item.price]);

        await conn.query(`
          INSERT INTO service_price_history (id, service_id, price, effective_from)
          VALUES (?, ?, ?, NOW())
        `, [historyId, serviceId, item.price]);

        await conn.commit();
        insertedCount++;
        console.log(`[+] Seeded: [${item.vehicle_type}] ${item.name} (${item.category}) - Rs. ${item.price}`);
      } catch (err) {
        await conn.rollback();
        throw err;
      }
    }

    // 4. Summarize
    const [allServices] = await conn.query(`
      SELECT id, name, vehicle_type, category, current_price, active
      FROM services
      WHERE active = TRUE
      ORDER BY vehicle_type, category, name
    `);

    console.log('\n--- Seeding Summary ---');
    console.log(`Newly inserted services: ${insertedCount}`);
    console.log(`Already existing services matched: ${existingCount}`);
    console.log(`Total active services in database: ${allServices.length}`);
    console.table(allServices.map(s => ({
      Vehicle: s.vehicle_type,
      Name: s.name,
      Category: s.category,
      Price: `Rs. ${s.current_price}`,
    })));

  } catch (err) {
    console.error('Seeding failed:', err);
    process.exitCode = 1;
  } finally {
    conn.release();
    process.exit();
  }
}

runSeed();
