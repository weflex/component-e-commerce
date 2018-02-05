
module.exports = function(Model) {
  const debug = require('debug')('component:commerce:cardbalance');
  let app;

  Model.disableRemoteMethodByName('destroyById', true);
  Model.disableRemoteMethodByName('deleteById',  true);
  Model.disableRemoteMethodByName('removeById',  true);

  Model.once('attached', (a) => {
    app = a;
  });
};
