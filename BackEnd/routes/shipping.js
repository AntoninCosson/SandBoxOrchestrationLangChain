const express = require("express");
const { validateBody } = require("../middlewares/validateZod");
const crypto = require("crypto");
const axios = require("axios");
const AddressCache = require("../modules/shipping/models/AddressCache");
const {
  validateAddressSchema,
} = require("../modules/shipping/schemas/shippingSchemas");

const router = express.Router();

function sha256(str) {
  return crypto.createHash("sha256").update(str, "utf8").digest("hex");
}

function buildAddressHash(addr = {}) {
  const key = JSON.stringify({
    q: (addr.q || "").trim().toLowerCase(),
    line1: (addr.line1 || "").trim().toLowerCase(),
    line2: (addr.line2 || "").trim().toLowerCase(),
    city: (addr.city || "").trim().toLowerCase(),
    postcode: (addr.postcode || "").trim().toLowerCase(),
    country: (addr.country || "fr").trim().toLowerCase(),
  });
  return sha256(key);
}

function mapDetailToNormalized(d = {}) {
  const bloc = Array.isArray(d.blocAdresse) ? d.blocAdresse : [];

  const line1Parts = [];
  if (d.numeroVoie) line1Parts.push(String(d.numeroVoie).trim());
  if (d.libelleVoie) line1Parts.push(String(d.libelleVoie).trim());
  const line1 = line1Parts.join(" ").replace(/\s+/g, " ");

  const extraLine = [d.pointRemise, d.lieuDit].filter(Boolean).join(" ").trim();
  const line2 = extraLine || "";

  const postcode = (d.codePostal || d.codeCedex || "").toString().trim();

  const city = (d.commune || "").toString().trim().toUpperCase();

  const normalized = {
    line1,
    line2,
    city,
    postcode,
    country: "FR",
    cedex: d.codeCedex || "",
    insee: d.codeInsee || d.CodeInsee || "",
    blocAdresse: bloc,
    extras: {
      destinataire: d.destinataire || "",
      pointRemise: d.pointRemise || "",
      lieuDit: d.lieuDit || "",
      libelleVoie: d.libelleVoie || "",
      numeroVoie: d.numeroVoie || "",
    },
  };

  return normalized;
}

/**
 * POST /shipping/validate-address
 *  { "q": "116 avenue du Président Kennedy 75220 Paris Cedex 16" }
 * OU
 *  {
 *    "line1": "116 avenue du Président Kennedy",
 *    "line2": "",
 *    "city": "Paris",
 *    "postcode": "75220",
 *    "country": "FR"
 *  }
 */
router.post(
  "/validate-address",
  validateBody(validateAddressSchema),
  async (req, res) => {
    const baseURL = process.env.OKAPI_CONTROL_BASE;
    const apiKey = process.env.OKAPI_CONTROL_KEY;

    try {
      const input = req.body || {};

      let q = (input.q || "").trim();
      if (!q) {
        q = [input.line1, input.line2, input.postcode, input.city]
          .filter(Boolean)
          .join(" ")
          .replace(/\s+/g, " ")
          .trim();
      }

      if (!q) {
        return res
          .status(400)
          .json({
            success: false,
            error: "Missing address (q or line1/city/postcode)",
          });
      }
      if (!apiKey) {
        return res
          .status(500)
          .json({ success: false, error: "Missing OKAPI_CONTROL_KEY" });
      }

      const addressHash = buildAddressHash({ q, ...input });

      const cached = await AddressCache.findOne({ addressHash }).lean();
      if (cached) {
        return res.json({
          success: true,
          cached: true,
          isValid: !!cached.normalized,
          normalized: cached.normalized || null,
          suggestions: cached.suggestions || [],
          source: cached.source || "cache",
        });
      }

      const searchUrl = `${baseURL}/adresses`;
      const searchResp = await axios.get(searchUrl, {
        params: { q },
        headers: { "X-Okapi-Key": apiKey },
        timeout: 8000,
      });

      const arr = Array.isArray(searchResp.data) ? searchResp.data : [];
      if (arr.length === 0) {
        await AddressCache.create({
          addressHash,
          suggestions: [],
          source: "okapi",
          expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000),
        });
        return res.json({
          success: true,
          cached: false,
          isValid: false,
          normalized: null,
          suggestions: [],
          source: "okapi",
        });
      }

      if (arr.length > 1) {
        const suggestions = arr
          .slice(0, 10)
          .map((x) => ({ adresse: x.adresse, code: x.code }));
        await AddressCache.create({
          addressHash,
          suggestions,
          source: "okapi",
          expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000),
        });
        return res.json({
          success: true,
          cached: false,
          isValid: false,
          normalized: null,
          suggestions,
          source: "okapi",
          needSelection: true,
        });
      }

      const { code } = arr[0];
      const detailUrl = `${baseURL}/adresses/${encodeURIComponent(code)}`;
      const detailResp = await axios.get(detailUrl, {
        headers: { "X-Okapi-Key": apiKey },
        timeout: 8000,
      });

      const normalized = mapDetailToNormalized(detailResp.data);

      await AddressCache.create({
        addressHash,
        okapiCode: String(code),
        normalized,
        rawResponse: {
          searchSample: arr[0],
          detail: detailResp.data,
        },
        source: "okapi",
        expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000),
      });

      return res.json({
        success: true,
        cached: false,
        isValid: true,
        normalized,
        suggestions: [],
        source: "okapi",
        okapiCode: String(code),
      });
    } catch (err) {
      console.error(
        "[ADDR] validate error:",
        err?.response?.data || err.message
      );
      const msg = err?.response?.data?.message || err.message;
      return res.status(500).json({ success: false, error: msg });
    }
  }
);

module.exports = router;
