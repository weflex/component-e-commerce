
module.exports = (commerceModels, options) => {
  const debug = require('debug')('component:commerce:productpricing:model');
  const {userModel, venueModel} = options;
  const productPricingModel = commerceModels.ProductPricing;

  // update relationships
  productPricingModel.belongsTo(userModel,
    {as: 'userCreated', foreignKey: 'createdBy'});
  productPricingModel.belongsTo(venueModel,
    {as: 'venue', foreignKey: 'venueId'});

  let productPricing = {};
  return productPricing;
};
