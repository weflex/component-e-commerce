/**
 * Cash payment module
 * @module gateway/cash
 * @see module:gateway
 * @author Prashant Balan <prash.balan@theweflex.com>
 */

module.exports = function cashPayment(app) {
  /**
   * Process payments
   * @access protected
   * @param {Object} request - Request Object
   * @param {String} paymentTypeId - paymentTypeId from PaymentConfig Model
   * @param {Object} transaction - Transaction Model Object
   * @return {Boolean}
   */
  const processPayment = (request, paymentType, transaction) => {
    // process cash payment
  };
};
