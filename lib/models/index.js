
const debug = require('debug')('component:commerce');
const accessLogger = require('../middleware/access-logger');
const userContext = require('../middleware/user-context');

module.exports = function componentCommerce(app, options) {
  debug('initializing component');
  const {loopback} = app;
  options = options || {};

  let dataSource = options.dataSource;
  /* istanbul ignore if */
  if (typeof dataSource === 'string') {
    dataSource = app.dataSource[dataSource];
  }
  const commerceModels = require('./commerce-models')(dataSource);
  const userModel = loopback.findModel(options.userModel) ||
      loopback.getModelByType(loopback.User);
  debug('User model: %s', userModel.modelName);

  const venueModel = loopback.findModel(options.venueModel);
  debug('Venue model: %s', venueModel.modelName);

  // Initialize middleware
  app.middleware('auth:after', userContext());
  app.middleware('routes:before', accessLogger());

  let users = {};

  let internalConfig = {
    userModel: userModel,
    venueModel: venueModel,
  };

  // global configs
  const paymentType = require('./PaymentType')(commerceModels);
  const transactionStatus = require('./TransactionStatus')(commerceModels);
  const discountType = require('./DiscountType')(commerceModels);

  // specific to app
  const venuePaymentConfig =
    require('./VenuePaymentConfig')(commerceModels, internalConfig);
  const productCategory =
    require('./ProductCategory')(commerceModels, internalConfig);
  const brand =
    require('./Brand')(commerceModels, internalConfig);
  const productPricing =
    require('./ProductPricing')(commerceModels, internalConfig);
  const product = require('./Product')(commerceModels, internalConfig);
  const transaction = require('./Transaction')(commerceModels, internalConfig);
  const cardDepositHistory =
    require('./CardDepositHistory')(commerceModels, internalConfig);
  const cardBalance =
    require('./CardBalance')(commerceModels, internalConfig);
  const discount = require('./Discount')(commerceModels, internalConfig);
  const productDiscount =
    require('./ProductDiscount')(commerceModels, internalConfig);
  const bonusProduct =
    require('./BonusProduct')(commerceModels, internalConfig);
  const transactionDiscount =
    require('./TransactionDiscount')(commerceModels, internalConfig);

  let customModels = options.models || {};
  let models = {
    user: customModels.users || users,
    paymentType: customModels.paymentType || paymentType,
    product: customModels.product || product,
    productCategory: customModels.productCategory || productCategory,
    brand: customModels.brand || brand,
    productPricing: customModels.productPricing || productPricing,
    transaction: customModels.transaction || transaction,
    transactionStatus: customModels.transactionStatus || transactionStatus,
    venuePaymentConfig: customModels.venuePaymentConfig || venuePaymentConfig,
    cardDepositHistory: customModels.cardDepositHistory || cardDepositHistory,
    cardBalance: customModels.cardBalance || cardBalance,
    discount: customModels.discount || discount,
    discountType: customModels.discountType || discountType,
    productDiscount: customModels.productDiscount || productDiscount,
    bonusProduct: customModels.bonusProduct || bonusProduct,
    transactionDiscount: customModels.transactionDiscount || transactionDiscount, // eslint-disable-line
  };

  return models;
};
