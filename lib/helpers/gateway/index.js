/**
 * Gateway module
 * @module gateway
 * @author Prashant Balan <prash.balan@theweflex.com>
 */

const fs = require('fs');
const path = require('path');
const paymentTypes = require('../PaymentTypes');

module.exports = function gateway(app) {
  const settings = app.settings;
  let pingpp;
  const gateways = [
    'pingpp',
    'cash',
    'membership',
  ];

  if (undefined === settings['component-commerce']) {
    throw new Error('component configuration not found');
  }

  if (undefined === settings['component-commerce'].gateway) {
    throw new Error('gateway configuration not found');
  }
  // gateway
  const gateway = settings['component-commerce'].gateway;

  gateway.forEach((gw) => {
    if (undefined === gw.name || gateways.indexOf(gw.name) === -1) {
      throw new Error(`Unsupported gateway: '${gw.name}'`);
    }

    if ('pingpp' === gw.name) {
      if (undefined === gw.appId) {
        throw new Error('AppId must not be undefined');
      }
      if (undefined === gw.appKey) {
        throw new Error('AppId must not be undefined');
      }

      if (undefined === gw.privateKeyPath) {
        throw new Error('PrivateKeyPath must not be undefined');
      }
    }
    pingpp = pingplusplus(gw.appId, gw.appKey, gw.privateKeyPath);
  });

  /**
   * @access private
   * @description Invokes ping++ gateway
   * @param {String} appId App ID
   * @param {String} appKey App Key
   * @param {String} privateKeyPath Private Key Path
   * @return {Object} ping++ object
   */
  function pingplusplus(appId, appKey, privateKeyPath) {
    return require('./pingpp')(
      appId,
      appKey,
      privateKeyPath
    );
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
    console.log(paymentType);
    let txnStatus = undefined;
    // process online payment through ping++
    if (paymentType.paymentTypeId === paymentTypes.PAYMENT_TYPE_CASH) {
      let cash = require('./cash')(app);
      txnStatus = cash.processPayment(request, transaction);
    } else
    if (paymentType.paymentTypeId === paymentTypes.PAYMENT_TYPE_MEMBERSHIP_CARD) { // eslint-disable-line
      let membership = require('./membership')(app);
      txnStatus = membership.processPayment(request, transaction);
    } else {
      console.log(pingpp);
      txnStatus = pingpp.processPayment(request, paymentType, transaction);
    }
    return txnStatus;
  };

  return {
    processPayment: processPayment,
    pingpp: pingpp,
  };
};
