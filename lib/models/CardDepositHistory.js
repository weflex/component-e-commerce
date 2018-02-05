
module.exports = (commerceModels, options) => {
  const debug = require('debug')('component:commerce:carddeposithistory:model');
  const {userModel, venueModel} = options;
  const cardDepositHistoryModel = commerceModels.CardDepositHistory;

  // update relationships
  cardDepositHistoryModel.belongsTo(userModel,
    {as: 'userCreated', foreignKey: 'createdBy'});
  cardDepositHistoryModel.belongsTo(userModel,
    {as: 'cardMember', foreignKey: 'cardOwner'});
  cardDepositHistoryModel.belongsTo(venueModel,
    {as: 'venue', foreignKey: 'venueId'});

  let cardDepositHistory = {};
  return cardDepositHistory;
};
