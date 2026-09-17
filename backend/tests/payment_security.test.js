'use strict';

require('dotenv').config();
const crypto = require('crypto');
const pool = require('../src/db/pool');
const payhere = require('../src/modules/payhere');

const BASE_URL = `http://localhost:${process.env.PORT || 3000}`;
const MERCHANT_ID = process.env.PAYHERE_MERCHANT_ID || '1238094';
const MERCHANT_SECRET = process.env.PAYHERE_MERCHANT_SECRET || 'secret';

let testVehicleId = null;
let testVisitId1 = null;
let testVisitId2 = null;
let orderId1 = `VSC-TEST-${Date.now()}`;
let orderId2 = `VSC-TEST-${Date.now() + 1}`;

const results = [];

function recordResult(name, passed, detail = '') {
  results.push({ name, passed, detail });
  const icon = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${icon}: ${name}${detail ? ` (${detail})` : ''}`);
}

async function setup() {
  console.log('--- Setting up test data ---');
  testVehicleId = crypto.randomUUID();
  testVisitId1 = crypto.randomUUID();
  testVisitId2 = crypto.randomUUID();

  // 1. Create a test vehicle
  await pool.query(
    `INSERT INTO vehicles (id, number_plate, vehicle_type, make, model, owner_name, owner_phone)
     VALUES (?, ?, 'Car', 'Toyota', 'Prius', 'Test Security Customer', '0771234567')`,
    [testVehicleId, `TEST-${Date.now().toString().slice(-4)}`]
  );

  // 2. Create test visit 1 (for notify testing)
  await pool.query(
    `INSERT INTO service_visits (id, vehicle_id, visit_date, total_cost, payment_status, receipt_number)
     VALUES (?, ?, NOW(), 2500.00, 'pending', ?)`,
    [testVisitId1, testVehicleId, orderId1]
  );

  // 3. Create test visit 2 (for rate-limit testing)
  await pool.query(
    `INSERT INTO service_visits (id, vehicle_id, visit_date, total_cost, payment_status)
     VALUES (?, ?, NOW(), 1800.00, 'pending')`,
    [testVisitId2, testVehicleId]
  );

  console.log(`Test Vehicle ID: ${testVehicleId}, Visit 1: ${testVisitId1} (Order: ${orderId1}), Visit 2: ${testVisitId2}`);
}

async function cleanup() {
  console.log('\n--- Cleaning up test data ---');
  try {
    if (testVisitId1) await pool.query('DELETE FROM service_visits WHERE id = ?', [testVisitId1]);
    if (testVisitId2) await pool.query('DELETE FROM service_visits WHERE id = ?', [testVisitId2]);
    if (testVehicleId) await pool.query('DELETE FROM vehicles WHERE id = ?', [testVehicleId]);
    console.log('Cleaned up test records.');
  } catch (err) {
    console.warn('Cleanup error:', err.message);
  }
}

async function runTests() {
  try {
    await setup();
    console.log('\n--- Running Payment Security & Flow Tests ---\n');

    // Test 1: Tampered/Forged signature rejected
    {
      const body = {
        merchant_id: MERCHANT_ID,
        order_id: orderId1,
        payhere_amount: '2500.00',
        payhere_currency: 'LKR',
        status_code: '2',
        md5sig: 'FORGED_INVALID_HASH_12345',
        payment_id: 'PYH-FORGED-001',
      };

      const res = await fetch(`${BASE_URL}/api/payments/payhere/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(body).toString(),
      });
      const text = await res.text();
      const passed = res.status === 400 && text === 'INVALID_SIGNATURE';
      recordResult('Test 1: Tampered / Forged IPN Signature is Rejected', passed, `HTTP ${res.status}: ${text}`);
    }

    // Test 2: Tampered amount rejected (expected 2500.00, sender sends 500.00)
    {
      const tamperedAmount = '500.00';
      const validSigForTampered = payhere.generateIPNHash(
        MERCHANT_ID,
        orderId1,
        tamperedAmount,
        'LKR',
        '2',
        MERCHANT_SECRET
      );

      const body = {
        merchant_id: MERCHANT_ID,
        order_id: orderId1,
        payhere_amount: tamperedAmount,
        payhere_currency: 'LKR',
        status_code: '2',
        md5sig: validSigForTampered,
        payment_id: 'PYH-TAMPERED-002',
      };

      const res = await fetch(`${BASE_URL}/api/payments/payhere/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(body).toString(),
      });
      const text = await res.text();
      const passed = res.status === 400 && text === 'AMOUNT_MISMATCH';
      recordResult('Test 2: Tampered Payment Amount is Blocked', passed, `HTTP ${res.status}: ${text}`);
    }

    // Test 3: Payment cancellation/failure (status_code = -1) -> Not marked as Paid
    {
      const validSigFailed = payhere.generateIPNHash(
        MERCHANT_ID,
        orderId1,
        '2500.00',
        'LKR',
        '-1',
        MERCHANT_SECRET
      );

      const body = {
        merchant_id: MERCHANT_ID,
        order_id: orderId1,
        payhere_amount: '2500.00',
        payhere_currency: 'LKR',
        status_code: '-1',
        md5sig: validSigFailed,
        payment_id: 'PYH-CANCELLED-003',
      };

      const res = await fetch(`${BASE_URL}/api/payments/payhere/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(body).toString(),
      });

      const [rows] = await pool.query('SELECT payment_status FROM service_visits WHERE id = ?', [testVisitId1]);
      const statusInDb = rows[0]?.payment_status;
      const passed = res.status === 200 && statusInDb === 'failed';
      recordResult('Test 3: Failed/Cancelled Payment does NOT mark visit as Paid', passed, `DB Status: ${statusInDb}`);
    }

    // Test 4: Successful Payment (status_code = 2) -> Marks Paid & Sets 'Online (Card)'
    {
      const validSigSuccess = payhere.generateIPNHash(
        MERCHANT_ID,
        orderId1,
        '2500.00',
        'LKR',
        '2',
        MERCHANT_SECRET
      );

      const body = {
        merchant_id: MERCHANT_ID,
        order_id: orderId1,
        payhere_amount: '2500.00',
        payhere_currency: 'LKR',
        status_code: '2',
        md5sig: validSigSuccess,
        payment_id: 'PYH-TRANS-998877',
      };

      const res = await fetch(`${BASE_URL}/api/payments/payhere/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(body).toString(),
      });

      const [rows] = await pool.query('SELECT payment_status, payment_method, payment_reference FROM service_visits WHERE id = ?', [testVisitId1]);
      const v = rows[0];
      const passed = res.status === 200 &&
                     v?.payment_status === 'paid' &&
                     v?.payment_method === 'Online (Card)' &&
                     v?.payment_reference === 'PYH-TRANS-998877';
      recordResult('Test 4: Successful Payment marks visit Paid with method "Online (Card)"', passed, `Method: ${v?.payment_method}, Ref: ${v?.payment_reference}`);
    }

    // Test 5: Idempotency / Duplicate notify call protection
    {
      const validSigSuccess = payhere.generateIPNHash(
        MERCHANT_ID,
        orderId1,
        '2500.00',
        'LKR',
        '2',
        MERCHANT_SECRET
      );

      const body = {
        merchant_id: MERCHANT_ID,
        order_id: orderId1,
        payhere_amount: '2500.00',
        payhere_currency: 'LKR',
        status_code: '2',
        md5sig: validSigSuccess,
        payment_id: 'PYH-TRANS-998877',
      };

      const res = await fetch(`${BASE_URL}/api/payments/payhere/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(body).toString(),
      });
      const text = await res.text();
      const passed = res.status === 200 && text === 'OK';
      recordResult('Test 5: Duplicate IPN callback is Idempotent', passed, `HTTP ${res.status}: ${text}`);
    }

    // Test 6: Double-init protection / Cannot pay already-paid visit
    {
      const res = await fetch(`${BASE_URL}/api/payments/payhere/init`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visit_id: String(testVisitId1) }),
      });
      const json = await res.json();
      const passed = res.status === 409 && json.code === 'ALREADY_PAID';
      recordResult('Test 6: Init on Already-Paid Visit returns 409 ALREADY_PAID', passed, `Code: ${json.code}`);
    }

    // Test 7: Rate-limiting on rapid double-clicks for payment init
    {
      const call1 = fetch(`${BASE_URL}/api/payments/payhere/init`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visit_id: String(testVisitId2) }),
      });
      const call2 = fetch(`${BASE_URL}/api/payments/payhere/init`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visit_id: String(testVisitId2) }),
      });

      const [res1, res2] = await Promise.all([call1, call2]);
      const json1 = await res1.json();
      const json2 = await res2.json();

      const passed = (res1.status === 200 && res2.status === 429) || (res2.status === 200 && res1.status === 429);
      recordResult('Test 7: Rapid double-init requests trigger 429 RATE_LIMITED', passed, `Status1: ${res1.status}, Status2: ${res2.status}`);
    }

  } catch (err) {
    console.error('Fatal test error:', err);
  } finally {
    await cleanup();
    await pool.end();

    console.log('\n=========================================');
    console.log('         TEST EXECUTION SUMMARY          ');
    console.log('=========================================');
    let allPassed = true;
    for (const r of results) {
      if (!r.passed) allPassed = false;
      console.log(`[${r.passed ? 'PASS' : 'FAIL'}] ${r.name}`);
    }
    console.log('=========================================');
    console.log(`Result: ${allPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}\n`);
    process.exitCode = allPassed ? 0 : 1;
  }
}

runTests();
