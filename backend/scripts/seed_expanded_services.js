'use strict';

require('dotenv').config();
const crypto = require('crypto');
const pool = require('../src/db/pool');

// The exact list of 35 services requested by the user
const REQUESTED_SERVICES = [
  // GENERAL SERVICE
  { name: 'Full Service (Oil, Filter & Inspection)', vehicle_type: 'Car', category: 'General Service', price: 8500, description: 'Complete vehicle inspection, engine oil & filter change, fluids top-up' },
  { name: 'Full Service & Tune-up', vehicle_type: 'Bike', category: 'General Service', price: 2200, description: 'Complete bike tune-up, oil change, spark plug & air filter check' },
  { name: 'Full Service', vehicle_type: 'Three Wheeler', category: 'General Service', price: 3500, description: 'Full mechanical & lubrication service for 3-wheeler' },

  // ENGINE & OIL
  { name: 'Engine Oil Change (Synthetic)', vehicle_type: 'Car', category: 'Engine & Oil', price: 8500, description: 'Full synthetic engine oil replacement with premium grade lubricant' },
  { name: 'Engine Oil Change (Mineral)', vehicle_type: 'Car', category: 'Engine & Oil', price: 4500, description: 'Standard mineral engine oil replacement and drain washer' },
  { name: 'Air Filter Replacement', vehicle_type: 'Car', category: 'Engine & Oil', price: 1800, description: 'OEM replacement engine intake air filter' },
  { name: 'Engine Oil Change', vehicle_type: 'Bike', category: 'Engine & Oil', price: 1200, description: 'Motorcycle 4T engine oil drain & fresh refill' },
  { name: 'Carburetor Cleaning & Tuning', vehicle_type: 'Bike', category: 'Engine & Oil', price: 800, description: 'Carburetor ultrasonic cleaning, jet check & idle speed tuning' },
  { name: 'Engine Oil Change', vehicle_type: 'Three Wheeler', category: 'Engine & Oil', price: 1800, description: '4-stroke engine oil change & drain bolt service' },
  { name: 'Engine Tune-up / Diagnostics', vehicle_type: 'Car', category: 'Engine & Oil', price: 3000, description: 'OBD-II computer scan, throttle body cleaning & spark plug inspection' },

  // BRAKES
  { name: 'Rear Brake Pad Replacement', vehicle_type: 'Car', category: 'Brakes', price: 5500, description: 'Rear disc brake pads replacement & caliper service' },
  { name: 'Rear Brake Pad Replacement', vehicle_type: 'Bike', category: 'Brakes', price: 1200, description: 'Rear brake pad replacement & adjustment' },
  { name: 'Brake Shoe Replacement', vehicle_type: 'Three Wheeler', category: 'Brakes', price: 2200, description: 'Rear/front brake shoe replacement & drum clean' },
  { name: 'Brake Cable Replacement', vehicle_type: 'Bike', category: 'Brakes', price: 800, description: 'Front/rear brake inner & outer cable replacement' },

  // BATTERY & ELECTRICAL
  { name: 'Battery Fitting & Terminal Service', vehicle_type: 'Car', category: 'Battery & Electrical', price: 1000, description: 'Battery installation, terminal cleaning & anti-corrosion grease' },
  { name: 'Alternator / Charging System Check', vehicle_type: 'Car', category: 'Battery & Electrical', price: 2500, description: 'Voltage regulator, charging output test & starter health analysis' },
  { name: 'Battery Fitting Service', vehicle_type: 'Bike', category: 'Battery & Electrical', price: 500, description: 'Motorcycle 12V battery fitting & terminal check' },
  { name: 'Headlight / Indicator Bulb Replacement', vehicle_type: 'Bike', category: 'Battery & Electrical', price: 400, description: 'Bulb replacement and beam alignment' },
  { name: 'Battery & Wiring Check', vehicle_type: 'Three Wheeler', category: 'Battery & Electrical', price: 1200, description: 'Battery load test, wiring harness inspection & earthing check' },

  // TIRES & WHEELS
  { name: 'Wheel Alignment', vehicle_type: 'Car', category: 'Tires & Wheels', price: 2500, description: 'Computerized 4-wheel alignment & camber adjustment' },
  { name: 'Wheel Balancing (Set)', vehicle_type: 'Car', category: 'Tires & Wheels', price: 1600, description: 'Precision electronic wheel balancing for all 4 tires' },
  { name: 'Tyre Fitting (per tyre)', vehicle_type: 'Car', category: 'Tires & Wheels', price: 500, description: 'Demount, mount & valve inspection per car tyre' },
  { name: 'Tyre Fitting (per tyre)', vehicle_type: 'Bike', category: 'Tires & Wheels', price: 300, description: 'Motorcycle tyre mounting & bead seating' },
  { name: 'Tyre Fitting (per tyre)', vehicle_type: 'Three Wheeler', category: 'Tires & Wheels', price: 400, description: 'Three wheeler tyre mounting & rim inspection' },

  // SUSPENSION
  { name: 'Shock Absorber Replacement (pair, labor)', vehicle_type: 'Car', category: 'Suspension', price: 4500, description: 'Labor for front/rear pair shock absorber replacement' },
  { name: 'Front Fork Oil Seal Replacement', vehicle_type: 'Bike', category: 'Suspension', price: 1500, description: 'Fork leg dismantling, fresh fork oil & seal replacement' },
  { name: 'Suspension / Shock Repair', vehicle_type: 'Three Wheeler', category: 'Suspension', price: 2000, description: 'Trailing arm bushing check, coil spring & damper service' },

  // TRANSMISSION / CLUTCH
  { name: 'Clutch Plate Replacement (labor)', vehicle_type: 'Car', category: 'Transmission / Clutch', price: 12000, description: 'Labor for gearbox drop, clutch disc & pressure plate replacement' },
  { name: 'Clutch Cable Replacement', vehicle_type: 'Bike', category: 'Transmission / Clutch', price: 500, description: 'Clutch cable replacement & free play adjustment' },
  { name: 'Clutch Plate Replacement (labor)', vehicle_type: 'Three Wheeler', category: 'Transmission / Clutch', price: 3500, description: 'Clutch friction plates and pressure spring replacement labor' },

  // AC
  { name: 'Full AC Service (Clean + Gas Top-up)', vehicle_type: 'Car', category: 'AC', price: 5500, description: 'Evaporator cleaning, blower clean, refrigerant recovery & top-up' },

  // BODY & CLEANING
  { name: 'Denting & Painting (per panel, labor)', vehicle_type: 'Car', category: 'Body & Cleaning', price: 8000, description: 'Panel repair, body filler, primer & 2K paint refinishing' },
  { name: 'Full Body Wash & Wax', vehicle_type: 'Car', category: 'Body & Cleaning', price: 2500, description: 'Foam wash, undercarriage wash, tire shine & hand wax polish' },
  { name: 'Body Wash', vehicle_type: 'Bike', category: 'Body & Cleaning', price: 300, description: 'High pressure foam wash, degreasing & blow dry' },
  { name: 'Body Wash', vehicle_type: 'Three Wheeler', category: 'Body & Cleaning', price: 500, description: 'Complete pressure wash, interior cabin clean & blow dry' },
];

async function seed() {
  console.log('=== SEEDING & HARMONIZING SERVICES ===');
  const [existing] = await pool.query('SELECT * FROM services');

  // Map existing active/inactive services by lowercase "name|vehicle_type"
  const existingMap = new Map();
  for (const s of existing) {
    const key = `${s.name.trim().toLowerCase()}|${s.vehicle_type.trim().toLowerCase()}`;
    existingMap.set(key, s);
  }

  let updatedCount = 0;
  let addedCount = 0;

  // 1. Clean up known typo / dummy test records:
  // "chage the battary" (id: 93d5e09a-016c-4af6-a801-cc2614c6b3ca) -> normalize to "Battery Fitting Service" Bike
  const typoService = existing.find(s => s.name.toLowerCase().includes('chage the battary'));
  if (typoService) {
    await pool.query(
      `UPDATE services
       SET name = 'Battery Fitting Service',
           category = 'Battery & Electrical',
           current_price = 500.00,
           active = 1,
           description = 'Motorcycle 12V battery fitting & terminal check'
       WHERE id = ?`,
      [typoService.id]
    );
    console.log(`Normalized typo service "${typoService.name}" -> "Battery Fitting Service" (kept references intact)`);
    existingMap.set(`battery fitting service|bike`, { ...typoService, name: 'Battery Fitting Service', vehicle_type: 'Bike' });
    updatedCount++;
  }

  // 2. Normalize "Wheel Alignment" (Tires -> Tires & Wheels)
  const wheelAlign = existing.find(s => s.name.toLowerCase() === 'wheel alignment' && s.vehicle_type.toLowerCase() === 'car');
  if (wheelAlign) {
    await pool.query(
      `UPDATE services SET category = 'Tires & Wheels', current_price = 2500.00 WHERE id = ?`,
      [wheelAlign.id]
    );
    console.log(`Updated category for Wheel Alignment -> Tires & Wheels`);
  }

  // 3. Process requested services
  for (const target of REQUESTED_SERVICES) {
    const key = `${target.name.trim().toLowerCase()}|${target.vehicle_type.trim().toLowerCase()}`;
    const found = existingMap.get(key);

    if (found) {
      // Update category, price, description if needed, and ensure active=1
      await pool.query(
        `UPDATE services
         SET category = ?, current_price = ?, description = ?, active = 1
         WHERE id = ?`,
        [target.category, target.price, target.description, found.id]
      );
      updatedCount++;
    } else {
      // Check for partial name match (e.g. "Bike Full Service / Tune-up" -> "Full Service & Tune-up")
      let matchedId = null;
      for (const s of existing) {
        if (s.vehicle_type.toLowerCase() === target.vehicle_type.toLowerCase()) {
          if (
            (target.name === 'Full Service & Tune-up' && s.name.toLowerCase().includes('full service / tune-up')) ||
            (target.name === 'Full Service' && target.vehicle_type === 'Three Wheeler' && s.name.toLowerCase().includes('full tune-up & inspection'))
          ) {
            matchedId = s.id;
            break;
          }
        }
      }

      if (matchedId) {
        await pool.query(
          `UPDATE services
           SET name = ?, category = ?, current_price = ?, description = ?, active = 1
           WHERE id = ?`,
          [target.name, target.category, target.price, target.description, matchedId]
        );
        console.log(`Updated legacy service to "${target.name}" (${target.vehicle_type})`);
        updatedCount++;
      } else {
        // Insert new service
        const newId = crypto.randomUUID();
        await pool.query(
          `INSERT INTO services (id, name, vehicle_type, category, description, current_price, active)
           VALUES (?, ?, ?, ?, ?, ?, 1)`,
          [newId, target.name, target.vehicle_type, target.category, target.description, target.price]
        );

        // Price history record
        await pool.query(
          `INSERT INTO service_price_history (id, service_id, price, effective_from)
           VALUES (?, ?, ?, NOW())`,
          [crypto.randomUUID(), newId, target.price]
        );

        console.log(`+ Added new service: "${target.name}" (${target.vehicle_type} - ${target.category}) - Rs. ${target.price}`);
        addedCount++;
      }
    }
  }

  // 4. Ensure existing required services remain intact:
  // "AC Gas Top-up & Leak Check", "Front Brake Pad Replacement", "Brake Fluid Flush", "Engine Oil Change (5W-30)"
  const [activeServices] = await pool.query('SELECT * FROM services WHERE active = 1 ORDER BY vehicle_type, category, name');
  console.log(`\nActive services in master catalog now: ${activeServices.length}`);
  console.log(`Added: ${addedCount}, Updated/Harmonized: ${updatedCount}`);
}

seed().then(() => pool.end()).catch(e => { console.error('Seed error:', e); process.exit(1); });
