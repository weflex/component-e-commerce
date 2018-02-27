/**
 * Example boot script to configure commerce-component
 * @module boot:commerce
 * @author Prashant Balan <prash.balan@theweflex.com>
 */

const pingppConfig = require('../../../../../config/pingpp/index.js');

module.exports = function commerce(app) {
  var commerce = require('../../../../../lib');

  var options = {
    // custom user model
    userModel: 'user', // specify your custom user model
    venueModel: 'Venue', // specify your custom venue model

    // used by modelBuilder, component-issue-handler/lib/models/index.js
    // Data source for metadata persistence
    dataSource: app.dataSources.db, // specify your datasource
    applyToStatic: true,
    gateway: [
      {
        name: 'pingpp',
        appId: pingppConfig.PINGPP_APP_ID,
        appKey: pingppConfig.PINGPP_APP_KEY,
        privateKeyPath: '/Users/pbalan/Sites/weflex/retest/component-commerce/config/pingpp/private_key.pem',
      },
      {
        name: 'cash',
      },
      {
        name: 'membership',
      }],
  };
  app.set('component-commerce', options);
  commerce(app, options);
};
