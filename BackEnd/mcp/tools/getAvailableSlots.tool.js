import { store } from './slotsStore.js';

export const getAvailableSlots = {
  name: 'getAvailableSlots',
  description: 'List available slots (mock)',
  schema: { type: 'object', properties: {}, required: [] },
  async run(_params) {
    return { data: { slots: store.slots } };
  }
};