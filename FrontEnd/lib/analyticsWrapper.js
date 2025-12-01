import { behaviorTracker } from './behaviorTracker';

const ANALYTICS_ENABLED = process.env.REACT_APP_ANALYTICS_ENABLED === 'true';
const ANALYTICS_DEBUG = process.env.REACT_APP_ANALYTICS_DEBUG === 'true';

class AnalyticsWrapper {
  constructor() {
    this.enabled = ANALYTICS_ENABLED;
    this.debug = ANALYTICS_DEBUG;
    if (!this.enabled) {
      console.warn('⚠️ Analytics is DISABLED');
    } else {
      console.log('✅ Analytics is ENABLED');
    }
  }

  enable() {
    this.enabled = true;
    console.log('✅ Analytics ENABLED');
  }

  disable() {
    this.enabled = false;
    console.log('⛔ Analytics DISABLED');
  }

  isEnabled() {
    return this.enabled;
  }

  track(data) {
    if (!this.enabled) {
      if (this.debug) console.log('[ANALYTICS DEBUG] Would have tracked:', data);
      return;
    }
    if (this.debug) console.log('[ANALYTICS DEBUG] Tracking:', data);
    try {
      behaviorTracker.track(data);
    } catch (e) {
      console.error('❌ Analytics tracking error:', e);
    }
  }

  trackPageChange(page) {
    if (!this.enabled) return;
    if (this.debug) console.log(`[ANALYTICS DEBUG] Page changed to: ${page}`);
    try {
      behaviorTracker.trackPageChange(page);
    } catch (e) {
      console.error('❌ Analytics page change error:', e);
    }
  }

  trackFieldFocus(fieldName) {
    if (!this.enabled) return;
    if (this.debug) console.log(`[ANALYTICS DEBUG] Field focused: ${fieldName}`);
    try {
      behaviorTracker.trackFieldFocus(fieldName);
    } catch (e) {
      console.error('❌ Analytics field focus error:', e);
    }
  }

  trackFieldChange(fieldName, value) {
    if (!this.enabled) return;
    if (this.debug) console.log(`[ANALYTICS DEBUG] Field changed: ${fieldName}`);
    try {
      behaviorTracker.trackFieldChange(fieldName, value);
    } catch (e) {
      console.error('❌ Analytics field change error:', e);
    }
  }

  trackFieldBlur(fieldName) {
    if (!this.enabled) return;
    if (this.debug) console.log(`[ANALYTICS DEBUG] Field blurred: ${fieldName}`);
    try {
      behaviorTracker.trackFieldBlur(fieldName);
    } catch (e) {
      console.error('❌ Analytics field blur error:', e);
    }
  }

  trackFormSubmit(formName, data) {
    if (!this.enabled) return;
    if (this.debug) console.log(`[ANALYTICS DEBUG] Form submitted: ${formName}`);
    try {
      behaviorTracker.trackFormSubmit(formName, data);
    } catch (e) {
      console.error('❌ Analytics form submit error:', e);
    }
  }

  getState() {
    if (!behaviorTracker || !behaviorTracker.state) {
      return { error: 'Tracker not initialized' };
    }
    return behaviorTracker.state;
  }

  getSession() {
    const state = this.getState();
    return {
      sessionId: state.sessionId,
      page: state.page,
      duration_ms: state.duration_ms,
      documentCount: state.clicks?.length || 0
    };
  }

  async flushNow() {
    if (!this.enabled) {
      console.log('⚠️ Analytics disabled, nothing to flush');
      return;
    }
    console.log('💾 Flushing analytics data...');
    try {
      const response = await fetch('/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analyticsEvent: this.getState() })
      });
      if (response.ok) {
        console.log('✅ Data flushed successfully');
      } else {
        console.error('❌ Flush failed:', response.statusText);
      }
    } catch (e) {
      console.error('❌ Flush error:', e);
    }
  }

  async healthCheck() {
    if (!this.enabled) {
      return { status: 'DISABLED' };
    }
    try {
      const response = await fetch('/analytics/health', {
        method: 'GET'
      });
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Analytics backend healthy:', data);
        return { status: 'HEALTHY', data };
      } else {
        console.error('❌ Analytics backend unhealthy');
        return { status: 'UNHEALTHY', code: response.status };
      }
    } catch (e) {
      console.error('❌ Health check failed:', e);
      return { status: 'ERROR', error: e.message };
    }
  }
}

export const analytics = new AnalyticsWrapper();

if (typeof window !== 'undefined') {
  window.analytics = analytics;
  console.log('💡 Analytics available at: window.analytics');
}
