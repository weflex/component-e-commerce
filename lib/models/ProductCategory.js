
module.exports = (commerceModels, options) => {
  const debug = require('debug')('component:commerce:product:category:model');
  const {userModel, venueModel} = options;
  const productCategoryModel = commerceModels.ProductCategory;
  const productCategoryDetailModel = commerceModels.ProductCategoryDetail;

  // update relationships
  productCategoryModel.belongsTo(userModel,
    {as: 'userCreated', foreignKey: 'createdBy'});
  productCategoryModel.belongsTo(userModel,
    {as: 'userModified', foreignKey: 'modifiedBy'});
  productCategoryModel.belongsTo(venueModel,
    {as: 'venue', foreignKey: 'venueId'});

  let productCategory = {};
  return productCategory;
};
