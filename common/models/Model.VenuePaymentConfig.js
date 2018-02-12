
const jugglerUtils = require('loopback-datasource-juggler/lib/utils');
/**
 * Merge include options of default scope with runtime include option.
 * exhibits the _.extend behaviour. Property value of source overrides
 * property value of destination if property name collision occurs
 * @param {String|Array|Object} destination The default value of `include` option
 * @param {String|Array|Object} source The runtime value of `include` option
 * @returns {Object}
 */

module.exports = function(Model) {
  const debug = require('debug')('component:commerce:venuepaymentconfig');
  let app;

  Model.disableRemoteMethod('destroyById',true);
  Model.disableRemoteMethod('deleteById',true);
  Model.disableRemoteMethod('removeById',true);

  Model.once('attached', (a) => {
    app = a;

    /** *************** REMOTE HOOK *************** **/

    Model.beforeRemote('find', (ctx, _, next) => {
      let currentFilter = ctx.args.filter || {};
      let includeRelations = {};
      Object.keys(Model.relations).forEach((related) => {
        includeRelations[related] = null;
      });
      // override current filter include
      if (currentFilter.include) {
        currentFilter.include =
          jugglerUtils.mergeIncludes(includeRelations, currentFilter.include);
      } else {
        currentFilter.include =
          jugglerUtils.mergeIncludes(includeRelations, currentFilter.include);
      }

      ctx.args.filter = currentFilter;
      next();
    });
  });
};
