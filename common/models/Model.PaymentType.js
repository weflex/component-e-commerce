
module.exports = function(Model) {
  const debug = require('debug')('component:commerce:paymentType');
  let app;

  Model.disableRemoteMethodByName('destroyById', true);
  Model.disableRemoteMethodByName('deleteById',  true);
  Model.disableRemoteMethodByName('removeById',  true);

  Model.once('attached', (a) => {
    app = a;

    /** *************** REMOTE HOOK *************** **/

    Model.afterRemote('find', (ctx, _, next) => {
      let result = ctx.result;
      ctx.result = result.filter((instance) => {
        if (ctx.args.filter && ctx.args.filter.locale) {
          return instance.locale === ctx.args.filter.locale;
        }
        return instance;
      });
      next();
    });
  });
};
