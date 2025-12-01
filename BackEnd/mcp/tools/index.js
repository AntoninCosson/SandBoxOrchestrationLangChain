import { getAvailableSlots } from './getAvailableSlots.tool.js';
import { reserveSlot } from './reserveSlot.tool.js';
import { sendConfirmationEmail } from './sendConfirmationEmail.tool.js';

export const toolsRegistry = {
  getAvailableSlots,
  reserveSlot,
  sendConfirmationEmail
};