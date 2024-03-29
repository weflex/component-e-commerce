
module.exports = (commerceModels, options) => {
  const debug =
    require('debug')('component:commerce:transactiondiscount:model');
  const {userModel, venueModel} = options;
  const transactionDiscountModel = commerceModels.TransactionDiscount;

  // update relationships
  transactionDiscountModel.belongsTo(userModel,
    {as: 'userCreated', foreignKey: 'createdBy'});
  transactionDiscountModel.belongsTo(userModel,
    {as: 'userDeleted', foreignKey: 'deletedBy'});
  transactionDiscountModel.belongsTo(venueModel,
    {as: 'venue', foreignKey: 'venueId'});

  let transactionDiscount = {};
  return transactionDiscount;
};
