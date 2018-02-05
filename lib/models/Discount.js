
module.exports = (commerceModels, options) => {
  const debug = require('debug')('component:commerce:discount:model');
  const {userModel, venueModel} = options;
  const discountModel = commerceModels.Discount;

  // update relationships
  discountModel.belongsTo(userModel,
    {as: 'user', foreignKey: 'boughtBy'});
  discountModel.belongsTo(venueModel,
    {as: 'venue', foreignKey: 'venueId'});

  let discount = {};
  return discount;
};
