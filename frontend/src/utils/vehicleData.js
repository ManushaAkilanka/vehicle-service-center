'use strict';

/**
 * Sri Lanka Popular Vehicle Makes and Models by Vehicle Type
 */
export const POPULAR_VEHICLES_BY_TYPE = {
  Car: {
    makes: ['Toyota', 'Suzuki', 'Honda', 'Nissan', 'Micro', 'Perodua', 'Mitsubishi'],
    models: {
      Toyota: ['Aqua', 'Vitz', 'Axio', 'Premio', 'Corolla', 'Prius'],
      Suzuki: ['Alto', 'WagonR', 'Swift'],
      Honda:  ['Fit', 'Vezel', 'Civic'],
      Nissan: ['Leaf', 'X-Trail', 'Sunny'],
    },
  },
  Bike: {
    makes: ['Bajaj', 'Honda', 'TVS', 'Yamaha', 'Hero', 'Suzuki'],
    models: {
      Bajaj:  ['Pulsar', 'Discover', 'CT100', 'Platina', 'Avenger'],
      Honda:  ['Dio', 'Wave', 'CB Shine'],
      TVS:    ['Apache', 'XL100', 'Ntorq'],
      Yamaha: ['FZ', 'Ray ZR'],
      Hero:   ['Splendor', 'Passion', 'Glamour'],
    },
  },
  'Three Wheeler': {
    makes: ['Bajaj', 'TVS', 'Piaggio', 'Mahindra'],
    models: {
      Bajaj:   ['RE', 'Maxima'],
      TVS:     ['King', 'King Deluxe'],
      Piaggio: ['Ape'],
    },
  },
};

/**
 * Normalizes vehicle type strings to master catalog types: 'Bike', 'Car', or 'Three Wheeler'.
 */
export function normalizeCategoryVehicleType(type) {
  if (!type) return 'Car';
  const t = type.trim().toLowerCase();
  if (t === 'bike' || t === 'motorcycle') return 'Bike';
  if (t === 'three wheeler' || t === 'auto rickshaw' || t === 'tuk tuk' || t === 'tuktuk') return 'Three Wheeler';
  return 'Car';
}

/**
 * Deduplicates an array of strings case-insensitively and normalizes to Proper Title Case.
 * e.g. ['bajaj', 'Bajaj', 'TOYOTA'] -> ['Bajaj', 'Toyota']
 */
export function deduplicateAndNormalize(items = []) {
  const map = new Map();
  for (const item of items) {
    if (!item) continue;
    const trimmed = String(item).trim();
    if (!trimmed) continue;
    const lower = trimmed.toLowerCase();
    if (!map.has(lower)) {
      // Normalize to Title Case (e.g. 'bajaj' -> 'Bajaj')
      const proper = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
      map.set(lower, proper);
    }
  }
  return Array.from(map.values());
}

/**
 * Returns the popular makes for a given vehicle type (deduplicated & normalized).
 */
export function getMakesForType(vehicleType, extraMakes = []) {
  const normType = normalizeCategoryVehicleType(vehicleType);
  const presets = POPULAR_VEHICLES_BY_TYPE[normType]?.makes || [];
  return deduplicateAndNormalize([...presets, ...extraMakes]);
}

/**
 * Returns the example models for a given make and vehicle type.
 */
export function getModelsForMake(make, vehicleType) {
  if (!make) return [];
  const normType = normalizeCategoryVehicleType(vehicleType);
  const typeModels = POPULAR_VEHICLES_BY_TYPE[normType]?.models || {};

  const makeLower = make.trim().toLowerCase();
  for (const [key, models] of Object.entries(typeModels)) {
    if (key.toLowerCase() === makeLower) {
      return deduplicateAndNormalize(models);
    }
  }
  return [];
}

/**
 * Normalizes a make input to proper case if matched against known makes.
 */
export function normalizeMakeName(make, vehicleType) {
  if (!make) return '';
  const trimmed = make.trim();
  const makes = getMakesForType(vehicleType);
  const found = makes.find(m => m.toLowerCase() === trimmed.toLowerCase());
  return found || (trimmed.charAt(0).toUpperCase() + trimmed.slice(1));
}
