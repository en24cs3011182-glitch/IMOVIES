const crypto = require('crypto');

async function initiate(booking) {
  return { gatewayRef: `mock_${crypto.randomBytes(16).toString('hex')}`, amount: booking.amount };
}

async function verify(payment, result) {
  if (!payment.gatewayRef || !payment.gatewayRef.startsWith('mock_')) {
    return { success: false };
  }
  return { success: result === 'success' };
}

module.exports = { initiate, verify };
