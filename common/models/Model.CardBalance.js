
module.exports = function(Model) {
  const debug = require('debug')('component:commerce:cardbalance');
  let app;

  Model.disableRemoteMethodByName('destroyById');
  Model.disableRemoteMethodByName('deleteById');
  Model.disableRemoteMethodByName('removeById');

  Model.once('attached', (a) => {
    app = a;
  });
};
