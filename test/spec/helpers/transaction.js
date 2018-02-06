const path = require('path');

const SIMPLE_APP = path.join(__dirname, '..', '..', 'fixtures', 'simple-app');

// global config
const paymentTypeFixtures =
  require(path.join(SIMPLE_APP, 'fixtures/PaymentType'));
const transactionStatusFixtures =
  require(path.join(SIMPLE_APP, 'fixtures/TransactionStatus'));

// app config
const userFixtures = require(path.join(SIMPLE_APP, 'fixtures/user'));
const venueFixtures = require(path.join(SIMPLE_APP, 'fixtures/Venue'));
const brandFixtures = require(path.join(SIMPLE_APP, 'fixtures/Brand'));
const productCategoryFixtures =
  require(path.join(SIMPLE_APP, 'fixtures/ProductCategory'));
const productFixtures = require(path.join(SIMPLE_APP, 'fixtures/Product'));
const productPricingFixtures =
  require(path.join(SIMPLE_APP, 'fixtures/ProductPricing'));
const venuePaymentConfigFixtures =
  require(path.join(SIMPLE_APP, 'fixtures/VenuePaymentConfig'));
const discountFixtures = require(path.join(SIMPLE_APP, 'fixtures/Discount'));
const productDiscountFixtures =
  require(path.join(SIMPLE_APP, 'fixtures/ProductDiscount'));
const fixtures = require(path.join(SIMPLE_APP, 'fixtures/Transaction'));

module.exports = function() {
  function setupFixturesWithoutDiscounts(app) {
    const resetModels = [
      'ProductPricing',
      'Transaction',
      'TransactionDetail',
      'VenuePaymentConfig',
    ];
    app.dataSources.db.automigrate(resetModels);
    venueFixtures.forEach((venue) => {
      app.models.Venue.create(venue);
    });
    productPricingFixtures.forEach((productPricing) => {
      app.models.ProductPricing.create(productPricing);
    });
    venuePaymentConfigFixtures.forEach((venuePaymenConfig) => {
      app.models.VenuePaymentConfig.create(venuePaymenConfig);
    });
  };

  function setupFixturesWithProductDiscount(app) {
    const resetModels = [
      'ProductPricing',
      'Transaction',
      'TransactionDetail',
      'VenuePaymentConfig',
    ];
    app.dataSources.db.automigrate(resetModels);
    productPricingFixtures.forEach((productPricing) => {
      app.models.ProductPricing.create(productPricing);
    });
    venuePaymentConfigFixtures.forEach((venuePaymenConfig) => {
      app.models.VenuePaymentConfig.create(venuePaymenConfig);
    });
    discountFixtures.forEach((discount) => {
      app.models.Discount.create(discount);
    });
    productDiscountFixtures.forEach((productDiscount) => {
      app.models.ProductDiscount.create(productDiscount);
    });
  };

  function teardownFixtures(app) {
    const resetModels = [
      // 'Transaction',
      // 'TransactionDetail',
    ];
    app.dataSources.db.automigrate(resetModels);
  };

  return {
    setupFixturesWithoutDiscounts: setupFixturesWithoutDiscounts,
    setupFixturesWithProductDiscount: setupFixturesWithProductDiscount,
    teardownFixtures: teardownFixtures,
  };
};
