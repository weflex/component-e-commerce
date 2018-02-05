
module.exports = (commerceModels, options) => {
  const debug = require('debug')('component:commerce:transaction:model');
  const {userModel, venueModel} = options;
  const transactionModel = commerceModels.Transaction;

  // update relationships
  transactionModel.belongsTo(userModel,
    {as: 'user', foreignKey: 'boughtBy'});
  transactionModel.belongsTo(venueModel,
    {as: 'venue', foreignKey: 'venueId'});

  let transaction = {};
  return transaction;
};
