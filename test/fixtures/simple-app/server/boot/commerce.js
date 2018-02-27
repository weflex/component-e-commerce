
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
  };
  commerce(app, options);
};
