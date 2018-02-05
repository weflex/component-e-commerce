
module.exports = (commerceModels, options) => {
  const debug = require('debug')('component:commerce:carddeposithistory:model');
  const cardBalanceModel = commerceModels.CardBalance;
  const {userModel, venueModel} = options;

  // update relationships
  cardBalanceModel.belongsTo(userModel,
    {as: 'userCreated', foreignKey: 'createdBy'});
  cardBalanceModel.belongsTo(userModel,
    {as: 'cardMember', foreignKey: 'cardOwner'});
  cardBalanceModel.belongsTo(venueModel,
    {as: 'venue', foreignKey: 'venueId'});

  let cardBalance = {};
  return cardBalance;
};
