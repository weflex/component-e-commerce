
module.exports = (commerceModels, options) => {
  const debug = require('debug')('component:commerce:discount:model');
  const {userModel, venueModel} = options;
  const discountModel = commerceModels.Discount;

  // update relationships
  discountModel.belongsTo(userModel,
    {as: 'userCreated', foreignKey: 'createdBy'});
  discountModel.belongsTo(userModel,
    {as: 'userModified', foreignKey: 'modifiedBy'});
  discountModel.belongsTo(userModel,
    {as: 'userDeleted', foreignKey: 'deletedBy'});
  discountModel.belongsTo(venueModel,
    {as: 'venue', foreignKey: 'venueId'});

  let discount = {};
  return discount;
};
