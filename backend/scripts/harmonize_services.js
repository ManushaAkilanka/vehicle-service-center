'use strict';

require('dotenv').config();
const pool = require('../src/db/pool');

async function clean() {
  await pool.query("UPDATE services SET category = 'Battery & Electrical' WHERE name = 'Battery Test & Replacement'");
  await pool.query("UPDATE services SET category = 'Tires & Wheels' WHERE name = 'Tire Rotation & Balancing'");
  await pool.query("UPDATE services SET active = 0 WHERE name = 'Clutch Plate & Bearing Replacement' AND id NOT IN (SELECT service_id FROM service_visit_items)");
  console.log('Harmonization complete');
}

clean().then(() => pool.end());
