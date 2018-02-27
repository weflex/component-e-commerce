const path = require('path');

const SIMPLE_APP = path.join(__dirname, '..', '..', 'fixtures', 'simple-app');
const venuePaymentConfigFixtures =
  require(path.join(SIMPLE_APP, 'fixtures/VenuePaymentConfig'));

module.exports = function() {
  function setupFixtures(app) {
    const resetModels = [
      'VenuePaymentConfig',
    ];
    app.dataSources.db.automigrate(resetModels);
  };

  function teardownFixtures(app) {
    const resetModels = [
      'Transaction',
      'TransactionDetail',
    ];
    app.dataSources.db.automigrate(resetModels);
  };

  return {
    setupFixtures: setupFixtures,
    teardownFixtures: teardownFixtures,
  };
};
