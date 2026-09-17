'use strict';

require('dotenv').config();
const pool = require('../src/db/pool');

async function inspect() {
  const [services] = await pool.query(
    'SELECT s.*, (SELECT COUNT(*) FROM service_visit_items WHERE service_id = s.id) as ref_count FROM services s ORDER BY vehicle_type, category, name'
  );
  console.log(`Total services in DB: ${services.length}`);
  for (const s of services) {
    const status = s.active ? 'ACTIVE' : 'INACTIVE';
    console.log(`[${status}] ID: ${s.id} | ${s.name} | ${s.vehicle_type} | ${s.category} | Rs.${s.current_price} | refs: ${s.ref_count}`);
  }
}

inspect().then(() => pool.end());
