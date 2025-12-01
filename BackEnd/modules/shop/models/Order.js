// modules/shop/models/Order.js
const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
  stripe: {
    sessionId: String,
    paymentIntentId: String,
    amountTotal: Number,
    currency: { type: String, default: 'eur' },
    shippingCostCents: Number,
  },

  status: { type: String, enum: ['pending','paid','labeled','shipped','delivered','canceled'], default: 'paid' },

  items: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'product', required: true },
    name: { type: String, required: true },
    unitPrice: { type: Number, min: 0 },
    quantity: { type: Number, min: 1, default: 1 },
    shipping: {
      weight_g: { type: Number, min: 0 },
      length_cm: { type: Number, min: 0 },
      width_cm: { type: Number, min: 0 },
      height_cm: { type: Number, min: 0 },
      shipping_class: String,
      simtao_productCode: String,
    },
  }],

  shippingAddress: {
    firstName: String, lastName: String, company: String, phone: String,
    line1: String, line2: String, postalCode: String, city: String, country: String,
  },

  // PAYLOAD SIMTAO
  simtao: {
    request: {
      effectiveDate: String,
      offerCode: String,
      majorFunctionalVersion: Number,
      contractNumber: String,
      customerNumber: String,
      customerMarketingTypeCode: String,
      customerEstablishZoneCode: String,
      criteria: {
        DT_APPLI_TAR: String,
        ZON_DPAR: String,
        ZON_DESTN: String,
        contract_requestedType: String,
        contract_complexTypeManagement: String,
        ZON_INFO: String,
        offerType: String,
        offerSubType: String,
      },
      cases: [{
        productCode: String,
        serviceCode: String,
        criteria: {
          envelope_itemQuantity: String,
          declaredWeight: String,
          weightCategory: String,
        }
      }]
    },
    response: {},
    summary: {
      totalAmountWithoutTaxes: Number,
      totalAmountWithTaxes: Number,
      totalAmountTaxes: Number,
      lines: [{
        productCode: String,
        description: String,
        qty: Number,
        unit: Number,
        total: Number,
      }]
    },
    rawResponse: mongoose.Schema.Types.Mixed,
  },

  logistics: {
    carrier: String,
    labelUrl: String,
    trackingCode: String,
  },
}, { timestamps: true });

module.exports = mongoose.model('orders', OrderSchema);
