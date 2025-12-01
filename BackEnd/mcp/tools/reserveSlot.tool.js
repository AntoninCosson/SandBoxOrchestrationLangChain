import { store } from './slotsStore.js';

export const reserveSlot = {
  name: 'reserveSlot',
  description: 'Reserve a slot if available (mock)',
  schema: {
    type: 'object',
    properties: { date: {type:'string'}, time: {type:'string'} },
    required: ['date','time']
  },
  async run({ date, time }) {
    const day = store.slots.find(s => s.date === date);
    if (!day) return { success:false, message: 'Date not found' };
    if (!day.times.includes(time)) return { success:false, message: 'Slot not available' };
    day.times = day.times.filter(t => t !== time);
    const reservationId = `${date}_${time}`;
    store.reservations.push({ reservationId, date, time });
    return { data: { reservationId, date, time }, message: 'Slot reserved' };
  }
};