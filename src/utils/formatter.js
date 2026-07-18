/**
 * Formats a raw numerical input into a standardized corporate currency string.
 * @param {number} amount - The raw financial metric integer or float
 * @returns {string} Standardized currency display
 */
export const formatCurrency = (amount) => {
    if (amount === undefined || amount === null || isNaN(amount)) {
      return '₦0.00';
    }
    
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };