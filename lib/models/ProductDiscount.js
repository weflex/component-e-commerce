
const SG = require('strong-globalize');
const g = SG();

module.exports = (commerceModels, options) => {
  const debug = require('debug')('component:commerce:productdiscount:model');
  const {userModel, venueModel} = options;
  const productDiscountModel = commerceModels.ProductDiscount;

  // update relationships
  productDiscountModel.belongsTo(userModel,
    {as: 'userCreated', foreignKey: 'createdBy'});
  productDiscountModel.belongsTo(userModel,
    {as: 'userDeleted', foreignKey: 'deletedBy'});
  productDiscountModel.belongsTo(venueModel,
    {as: 'venue', foreignKey: 'venueId'});

  let productDiscount = {};
  return productDiscount;
};
