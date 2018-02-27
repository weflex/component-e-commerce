
module.exports = (commerceModels, options) => {
  const debug = require('debug')('component:commerce:venuepaymentconfig:model');
  const {userModel, venueModel} = options;
  const venuePaymentConfigModel = commerceModels.VenuePaymentConfig;

  // update relationships
  venuePaymentConfigModel.belongsTo(userModel,
    {as: 'userCreated', foreignKey: 'createdBy'});
  venuePaymentConfigModel.belongsTo(userModel,
    {as: 'userModified', foreignKey: 'modifiedBy'});
  venuePaymentConfigModel.belongsTo(venueModel,
    {as: 'venue', foreignKey: 'venueId'});

  let venuePaymentConfig = {};
  return venuePaymentConfig;
};
