// utils/okapi.js
const axios = require('axios');

function okapiBaseUrl() {
  // Test = Prod
  return 'https://api.laposte.fr';
}

function okapiKey() {
  return process.env.NODE_ENV === 'production'
    ? process.env.OKAPI_KEY_PROD
    : process.env.OKAPI_KEY_SANDBOX;
}

function aggregateParcel(items = []) {
  const weight = items.reduce((s, it) => s + (Number(it.weight || 0) * (it.quantity || 1)), 0);
  const length = Math.max(...items.map(it => (it.dimensions?.length || 0)), 0);
  const width  = Math.max(...items.map(it => (it.dimensions?.width  || 0)), 0);
  const height = items.reduce((s, it) => s + (it.dimensions?.height || 0) * (it.quantity || 1), 0);

  return {
    weight: Number(weight.toFixed(3)), // kg
    length: Math.max(1, Math.round(length)), // cm
    width : Math.max(1, Math.round(width)),  // cm
    height: Math.max(1, Math.round(height)), // cm
  };
}

async function getOkapiRate({ dest, items, deliveryType = 'domicile' }) {
  const base = okapiBaseUrl();
  const key  = okapiKey();
  if (!key) throw new Error('Missing Okapi API key (set OKAPI_KEY_SANDBOX or OKAPI_KEY_PROD)');

  const parcel = aggregateParcel(items);

  const body = {
    from_postcode: process.env.OKAPI_SENDER_POSTCODE || '13090',
    from_country : process.env.OKAPI_SENDER_COUNTRY || 'FR',
    to_postcode  : dest?.postcode,
    to_country   : dest?.country || 'FR',
    weight       : parcel.weight, // kg
    length       : parcel.length, // cm
    width        : parcel.width,  // cm
    height       : parcel.height, // cm
    delivery_type: deliveryType,  // 'domicile' | 'relais'
  };

  try {
    const res = await axios.post(`${base}/tarifs/v1/simulation`, body, {
      headers: { 'X-Okapi-Key': key, 'Content-Type': 'application/json' },
      timeout: 10000,
    });

    const data = res.data || {};
    return {
      service: data.service || data.carrier || 'N/A',
      price: Number(data.price ?? data.amount ?? 0),
      currency: (data.currency || 'EUR').toUpperCase(),
      delivery_days: data.delivery_days || data.eta || null,
      raw: data,
      parcel,
      request: body,
    };
  } catch (err) {
    console.error('[OKAPI] rate error:', err.message);
    throw err;
  }
}

module.exports = { getOkapiRate, aggregateParcel };