// BackEnd/modules/analytics/services/componentReportService.js

const ComponentReport = require("../models/ComponentReport");

class ComponentReportService {
  /**
   * Update component reports après chaque analytics event
   * Appeler après avoir sauvé un analytics_event
   */
  static async updateComponentReports(analyticsEvent) {
    if (!analyticsEvent) return;

    const { sessionId, signals, ui_bug_detected, ui_bug_details } =
      analyticsEvent;

    // === Collecter tous les components de cette session ===
    const componentsToUpdate = new Set();

    // Components avec rage clicks
    if (signals.rage_clicks_by_component) {
      Object.keys(signals.rage_clicks_by_component).forEach((comp) => {
        if (comp !== "unknown" && comp !== "unknown_details") {
          componentsToUpdate.add(comp);
        }
      });
    }

    // Component avec ui_bug (si c'est un button/component nommé)
    if (ui_bug_details && ui_bug_details.component) {
      componentsToUpdate.add(ui_bug_details.component);
    }

    // === Update chaque component ===
    for (const component of componentsToUpdate) {
      await this._updateComponentReport(component, {
        sessionId,
        signals,
        ui_bug_detected,
        ui_bug_details,
      });
    }
  }

  /**
   * Update un component spécifique
   */
  static async _updateComponentReport(component, data) {
    const { sessionId, signals, ui_bug_detected, ui_bug_details } = data;

    // === Construire les issues pour ce component ===
    const issuesToAdd = [];

    // === 1. Check if this component had a DIRECT UI bug ===
    // (unresponsive_button, etc. - bug affecting THIS component directly)
    if (
      ui_bug_detected &&
      ui_bug_details &&
      ui_bug_details.component === component
    ) {
      issuesToAdd.push({
        type: ui_bug_details.type,
        severity: ui_bug_details.severity || "MEDIUM",
        lastSession: sessionId,
        lastOccurred: new Date(),
      });
    }

    // === 2. Check if this component TRIGGERED rage clicks ===
    // (user got frustrated AFTER clicking this component)
    // Only add this if it's NOT the component itself that had the bug
    if (
      signals.rage_clicks?.detected &&
      signals.rage_clicks_by_component?.[component] > 0
    ) {
      // Add triggers_rage_clicks only if:
      // - No bug detected for this component, OR
      // - Bug detected but NOT for this specific component
      const componentIsNotPrimaryBug =
        !ui_bug_details || ui_bug_details.component !== component;

      if (componentIsNotPrimaryBug) {
        issuesToAdd.push({
          type: "triggers_rage_clicks",
          severity: "MEDIUM",
          lastSession: sessionId,
          lastOccurred: new Date(),
        });
      }
    }

    // === Merger/Update les issues ===
    const updateOps = {
      $inc: {
        totalEvents: 1,
      },
      $addToSet: {
        affectedSessionIds: sessionId,
      },
      $set: {
        lastUpdated: new Date(),
      },
    };

    // Add issues
    if (issuesToAdd.length > 0) {
      updateOps.$inc.affectedSessions = 1;

      for (const issue of issuesToAdd) {
        // Try to find and increment existing issue, else push new
        const existingIssueIndex = await this._findExistingIssueIndex(
          component,
          issue.type
        );

        if (existingIssueIndex !== -1) {
          // Increment existing issue
          updateOps.$inc[`issues.${existingIssueIndex}.occurrences`] = 1;
          updateOps.$set[`issues.${existingIssueIndex}.lastOccurred`] =
            new Date();
          updateOps.$set[`issues.${existingIssueIndex}.lastSession`] =
            sessionId;
        } else {
          // Push new issue
          if (!updateOps.$push) updateOps.$push = {};
          if (!Array.isArray(updateOps.$push.issues)) {
            updateOps.$push.issues = [];
          }
          updateOps.$push.issues.push(issue);
        }
      }
    }

    // === Calculate health score ===
    const report = await ComponentReport.findOneAndUpdate(
      { component },
      updateOps,
      { upsert: true, new: true }
    );

    // Recalculate health
    await this._calculateHealthScore(report);
  }

  /**
   * Find existing issue in report
   */
  static async _findExistingIssueIndex(component, issueType) {
    const report = await ComponentReport.findOne(
      { component },
      { issues: 1 }
    ).lean();

    if (!report || !report.issues) return -1;

    return report.issues.findIndex((issue) => issue.type === issueType);
  }

  /**
   * Calculer le health score basé sur les issues
   * Score = 1 (parfait) → 0 (complètement cassé)
   * 
   * Formule:
   * - HIGH severity bug (unresponsive_button) = -0.6 par occurrence
   * - MEDIUM severity bug (triggers_rage_clicks) = -0.3 par occurrence
   * - LOW severity = -0.1 per occurrence
   */
  static async _calculateHealthScore(report) {
    let healthScore = 1;

    if (!report.issues || report.issues.length === 0) {
      healthScore = 1; // Perfect
    } else {
      // Penaliser selon severity - MORE AGGRESSIVE
      const severityPenalty = {
        HIGH: 0.6,      // HIGH bugs = very bad (-60%)
        MEDIUM: 0.3,    // MEDIUM bugs = bad (-30%)
        LOW: 0.1,       // LOW bugs = minor (-10%)
      };

      for (const issue of report.issues) {
        const penalty = severityPenalty[issue.severity] || 0.1;
        const count = issue.occurrences || 1;

        // Linear penalty: each occurrence adds full penalty
        // No cap - multiple issues stack up
        healthScore -= penalty * count;
      }

      // Clamp to 0-1
      healthScore = Math.max(0, Math.min(1, healthScore));
    }

    // Update
    await ComponentReport.updateOne(
      { _id: report._id },
      { healthScore }
    );
  }

  /**
   * Get components with health < 0.7 (problématiques)
   */
  static async getProblematicComponents() {
    return ComponentReport.find({ healthScore: { $lt: 0.7 } })
      .sort({ healthScore: 1 })
      .lean();
  }

  /**
   * Get component health
   */
  static async getComponentHealth(component) {
    return ComponentReport.findOne({ component }).lean();
  }
}

module.exports = ComponentReportService;
