// BackEnd/modules/analytics/models/ComponentReport.js

const mongoose = require("mongoose");

const componentReportSchema = new mongoose.Schema(
  {
    component: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    // Aggregate stats
    totalEvents: {
      type: Number,
      default: 0,
    },
    affectedSessions: {
      type: Number,
      default: 0,
    },
    healthScore: {
      type: Number,
      min: 0,
      max: 1,
      default: 1,
    },

    // Issues tracker
    issues: [
      {
        type: {
          type: String,
          enum: [
            "unresponsive_button",
            "unknown_rage_clicks",
            "unknown_long_hover",
            "triggers_rage_clicks",
          ],
        },
        occurrences: {
          type: Number,
          default: 1,
        },
        severity: {
          type: String,
          enum: ["LOW", "MEDIUM", "HIGH"],
          default: "MEDIUM",
        },
        lastSession: {
          type: String, // sessionId
        },
        lastOccurred: {
          type: Date,
        },
      },
    ],

    // Session references (just IDs for linking)
    affectedSessionIds: [
      {
        type: String, // sessionId
        index: true,
      },
    ],

    // Metadata
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index pour les requêtes rapides
componentReportSchema.index({ healthScore: 1 });
componentReportSchema.index({ "issues.severity": 1 });

module.exports = mongoose.model("ComponentReport", componentReportSchema);
