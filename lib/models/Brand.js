
module.exports = (commerceModels, options) => {
  const debug = require('debug')('component:commerce:brand:model');
  const brandModel = commerceModels.Brand;
  const brandDetailModel = commerceModels.BrandDetail;
  const {userModel, venueModel} = options;

  // update relationships
  brandModel.belongsTo(userModel,
    {as: 'userCreated', foreignKey: 'createdBy'});
  brandModel.belongsTo(userModel,
    {as: 'userModified', foreignKey: 'cardOwner'});
  brandModel.belongsTo(venueModel,
    {as: 'venue', foreignKey: 'venueId'});

  let brand = {};
  return brand;
};
