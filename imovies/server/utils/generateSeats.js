function generateSeats(screen, priceByType) {
  if (!screen || !Array.isArray(screen.rows)) {
    throw new TypeError('screen.rows must be an array');
  }
  if (!priceByType || typeof priceByType !== 'object') {
    throw new TypeError('priceByType must map seat types to prices');
  }

  return screen.rows.flatMap(({ row, seatCount, type = 'regular' }) => {
    if (!row || !Number.isInteger(seatCount) || seatCount < 1) {
      throw new TypeError('Each screen row needs a row label and positive integer seatCount');
    }
    const price = priceByType[type];
    if (typeof price !== 'number' || !Number.isFinite(price) || price < 0) {
      throw new TypeError(`A valid price is required for seat type "${type}"`);
    }

    return Array.from({ length: seatCount }, (_, index) => {
      const number = index + 1;
      return {
        label: `${row}${number}`,
        row,
        number,
        type,
        price,
        status: 'available',
        heldBy: null,
        heldUntil: null,
      };
    });
  });
}

module.exports = generateSeats;
