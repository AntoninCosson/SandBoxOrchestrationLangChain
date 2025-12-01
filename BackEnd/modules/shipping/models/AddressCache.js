const mongoose = require('mongoose');

const addressCacheSchema = new mongoose.Schema(
  {
    addressHash: { type: String, unique: true, index: true },
    okapiCode: { type: String },
    normalized: {
      line1: String,
      line2: String,
      city: String,
      postcode: String,
      country: String,
      cedex: String,
    //   insee: String,
      blocAdresse: [String],
      extras: mongoose.Schema.Types.Mixed,
    },
    suggestions: [
      {
        adresse: String,
        code: String,
      }
    ],
    rawResponse: mongoose.Schema.Types.Mixed,
    source: { type: String, default: 'okapi' },
    expiresAt: { type: Date, index: { expires: '7d' } },
  },
  { timestamps: true }
);

module.exports = mongoose.model('addresscache', addressCacheSchema);
