
module.exports = (commerceModels, options) => {
  const debug = require('debug')('component:commerce:bonusproduct:model');
  const bonusProductModel = commerceModels.BonusProduct;
  const {userModel, venueModel} = options;

  // update relationships
  bonusProductModel.belongsTo(venueModel,
    {as: 'venue', foreignKey: 'venueId'});

  let bonusProduct = {};
  return bonusProduct;
};
