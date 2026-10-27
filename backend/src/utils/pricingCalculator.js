/**
 * Unified Rental Pricing & Duration Calculation Engine
 */

function normalizeDateToMidnight(dateInput) {
  const d = new Date(dateInput);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Calculates rental pricing breakdown incorporating weekend rates and duration discounts.
 *
 * @param {Object} listing - The listing mongoose document or object
 * @param {Date|string} startDate - Rental start date
 * @param {Date|string} endDate - Rental end date
 * @returns {Object} itemized pricing breakdown and duration validation
 */
function calculateRentalPricing(listing, startDate, endDate) {
  const start = normalizeDateToMidnight(startDate);
  const end = normalizeDateToMidnight(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new Error("Invalid date format provided.");
  }

  if (end <= start) {
    throw new Error("Rental end date must be after start date.");
  }

  const diffTime = end.getTime() - start.getTime();
  const days = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  // Validate duration against listing limits
  const minDays = listing.minRentalDays || 1;
  const maxDays = listing.maxRentalDays || 60;

  if (days < minDays) {
    const err = new Error(`Minimum rental duration for this item is ${minDays} ${minDays === 1 ? "day" : "days"}.`);
    err.status = 400;
    throw err;
  }

  if (days > maxDays) {
    const err = new Error(`Maximum rental duration for this item is ${maxDays} days.`);
    err.status = 400;
    throw err;
  }

  const weekdayRate = Number(listing.rentalPricePerDay || 0);
  const weekendRate =
    listing.weekendPricePerDay !== null && listing.weekendPricePerDay !== undefined
      ? Number(listing.weekendPricePerDay)
      : weekdayRate;

  let weekdayDays = 0;
  let weekendDays = 0;
  let undiscountedBase = 0;

  const current = new Date(start);
  for (let i = 0; i < days; i++) {
    const dayOfWeek = current.getDay(); // 0 is Sunday, 5 is Friday, 6 is Saturday
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6;

    if (isWeekend) {
      weekendDays++;
      undiscountedBase += weekendRate;
    } else {
      weekdayDays++;
      undiscountedBase += weekdayRate;
    }
    current.setDate(current.getDate() + 1);
  }

  // Tiered Duration Discounts
  let appliedDiscountType = "none";
  let discountPercentage = 0;

  const monthlyPct = Number(listing.monthlyDiscountPercentage || 0);
  const weeklyPct = Number(listing.weeklyDiscountPercentage || 0);

  if (days >= 30 && monthlyPct > 0) {
    appliedDiscountType = "monthly";
    discountPercentage = monthlyPct;
  } else if (days >= 7 && weeklyPct > 0) {
    appliedDiscountType = "weekly";
    discountPercentage = weeklyPct;
  }

  const discountAmount = Math.round(undiscountedBase * (discountPercentage / 100));
  const basePrice = Math.max(0, undiscountedBase - discountAmount);
  const deposit = Number(listing.deposit || 0);
  const serviceFee = Math.round(basePrice * 0.05); // Standard 5% platform fee
  const totalPrice = basePrice + deposit + serviceFee;

  return {
    days,
    rentalDays: days,
    minDays,
    maxDays,
    weekdayDays,
    weekendDays,
    dailyRate: weekdayRate,
    baseDailyPrice: weekdayRate,
    weekendRate,
    weekendPricePerDay: weekendRate,
    undiscountedBase,
    grossAmount: undiscountedBase,
    discountAmount,
    discountPercentage,
    appliedDiscountPercentage: discountPercentage,
    appliedDiscountType,
    basePrice,
    rentalTotal: basePrice,
    deposit,
    serviceFee,
    totalPrice,
  };
}

module.exports = {
  normalizeDateToMidnight,
  calculateRentalPricing,
};
