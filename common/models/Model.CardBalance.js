
module.exports = function(Model) {
  const debug = require('debug')('component:commerce:cardbalance');
  let app;

  Model.disableRemoteMethod('destroyById',true);
  Model.disableRemoteMethod('deleteById',true);
  Model.disableRemoteMethod('removeById',true);

  Model.once('attached', (a) => {
    app = a;
  });
};
