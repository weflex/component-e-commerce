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
  function setupFixtures(app) {
    console.log('hello');
    app.dataSources.db.automigrate(['ProductPricing']);
    // userFixtures.forEach((user) => {
    //   app.models.user.create(user);
    // });
    // paymentTypeFixtures.forEach((paymentType) => {
    //   app.models.PaymentType.create(paymentType);
    // });
    // transactionStatusFixtures.forEach((transactionStatus) => {
    //   app.models.TransactionStatus.create(transactionStatus);
    // });
    // venueFixtures.forEach((venue) => {
    //   app.models.Venue.create(venue);
    // });
    // brandFixtures.forEach((brand) => {
    //   console.log(brand);
    //   app.models.Brand.create(brand);
    // });
    // productCategoryFixtures.forEach((productCategory) => {
    //   app.models.ProductCategory.create(productCategory);
    // });
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
    // app.dataSources.db.automigrate();
  };

  return {
    setupFixtures: setupFixtures,
    teardownFixtures: teardownFixtures,
  };
};
