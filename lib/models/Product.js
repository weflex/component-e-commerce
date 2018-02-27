
module.exports = (commerceModels, options) => {
  const debug = require('debug')('component:commerce:product:model');
  const {userModel, venueModel} = options;
  const productModel = commerceModels.Product;
  const productDetailModel = commerceModels.ProductDetail;

  // update relationships
  productModel.belongsTo(userModel,
    {as: 'userCreated', foreignKey: 'createdBy'});
  productModel.belongsTo(userModel,
    {as: 'userModified', foreignKey: 'modifiedBy'});
  productModel.belongsTo(venueModel,
    {as: 'venue', foreignKey: 'venueId'});

  let product = {};
  return product;
};
