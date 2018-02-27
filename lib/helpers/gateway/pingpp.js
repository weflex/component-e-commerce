/**
 * Ping++ module
 * @module gateway/pingpp
 * @see module:gateway
 * @author Prashant Balan <prash.balan@theweflex.com>
 */

const paymentTypes = require('../PaymentTypes');
const utils = require('./utils')();
const path = require('path');

module.exports = function pingppGateway(appId, appKey, privateKeyPath) {
  let pingpp = require('pingpp')(appKey);
  pingpp.setPrivateKeyPath(privateKeyPath);

  let PAYMENT_TYPE_WECHAT,
    PAYMENT_TYPE_ALIPAY,
    PAYMENT_TYPE_UNIONPAY,
    PAYMENT_TYPE_CASH,
    PAYMENT_TYPE_MEMBERSHIP_CARD;

  // destructure constants
  [
    PAYMENT_TYPE_WECHAT,
    PAYMENT_TYPE_ALIPAY,
    PAYMENT_TYPE_UNIONPAY,
    PAYMENT_TYPE_CASH,
    PAYMENT_TYPE_MEMBERSHIP_CARD,
  ] = [
    paymentTypes.PAYMENT_TYPE_WECHAT,
    paymentTypes.PAYMENT_TYPE_ALIPAY,
    paymentTypes.PAYMENT_TYPE_UNIONPAY,
    paymentTypes.PAYMENT_TYPE_CASH,
    paymentTypes.PAYMENT_TYPE_MEMBERSHIP_CARD,
  ];

  const channels = {
    PAYMENT_TYPE_WECHAT: 'wx_pub',
    PAYMENT_TYPE_ALIPAY: 'Alipay',
    PAYMENT_TYPE_UNIONPAY: 'UnionPay',
  };

  /**
   * Process payments
   * @access protected
   * @param {Object} request - Request Object
   * @param {String} paymentTypeId - paymentTypeId from PaymentConfig Model
   * @param {Object} transaction - Transaction Model Object
   * @return {Boolean}
   */
  const processPayment = (request, paymentType, transaction) => {
    // process online payment through ping++
    pingpp.charges.create({
      'order_no': transaction.id,
      app: {id: appId},
      channel: channels[paymentType],
      amount: transaction.grandTotal,
      'client_ip': utils._getClientIp(request),
      currency: transaction.currency || 'cny',
      subject: transaction.venueId,
      body: transaction.boughtBy,
      extra: transaction.transactionDetail,
    }, (err, charge) => {
      // check if transaction was charged
    });
  };

  return {
    processPayment: processPayment,
  };
};
