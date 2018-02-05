
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
  const debug = require('debug')('component:commerce:product:category');
  let app;

  Model.disableRemoteMethodByName('destroyById', true);
  Model.disableRemoteMethodByName('deleteById',  true);
  Model.disableRemoteMethodByName('removeById',  true);

  Model.once('attached', (a) => {
    app = a;

    /** *************** REMOTE HOOK *************** **/

    Model.beforeRemote('find', (ctx, _, next) => {
      let currentFilter = ctx.args.filter || {};
      // override current filter include
      if (currentFilter.include) {
        currentFilter.include =
          jugglerUtils.mergeIncludes({
            transactionStatusDetail: null,
          }, currentFilter.include);
      } else {
        currentFilter.include = {
          transactionStatusDetail: null,
        };
      }

      ctx.args.filter = currentFilter;
      next();
    });

    /** ************* OPERATION HOOK ************* **/

    Model.observe('before save', (ctx, next) => {
      ctx.hookState.relations = {};
      if (ctx.isNewInstance && ctx.instance) {
        Object.keys(Model.relations).forEach((related) => {
          ctx.hookState.relations[related] = ctx.instance [related]();
        });
      } else if (ctx.instance) {
        Object.keys(Model.relations).forEach((related) => {
          ctx.hookState.relations[related] = ctx.instance [related]();
        });
      }
      if (ctx.instance && ctx.instance.id) {
        next();
      } else if (ctx.isNewInstance) {
        ctx.instance.createdAt = new Date();
        next();
      }
    });

    Model.observe('after save', (ctx, next) => {
      const promises = [];
      if (ctx.instance) {
        ctx.instance.modifiedAt = new Date();
        Object.keys(Model.relations).forEach((related) => {
          let promiseArray = [];
          const data = ctx.hookState.relations[related];
          if (typeof data !== 'undefined') {
            const relatedId = Model.relations[related].modelTo.getIdName();
            let promise = Promise.resolve('ready');
            if (data[relatedId]) {
              promise = ctx.instance[related].update(data);
            } else if (Object.keys(data).indexOf('0') > -1) {
              promiseArray = data.map((item) => {
                let promise = Promise.resolve('ready');
                if (item[relatedId]) {
                  promise = ctx.instance[related].updateById(item.id, item);
                } else {
                  promise = ctx.instance[related].create(item);
                }
                return promise;
              });
            }
            if (promiseArray.length > 0) {
              ctx.instance.__data[related] = [];
              promiseArray.forEach((promiseInArray) => {
                promise = promiseInArray.then((record) => {
                  ctx.instance.__data[related].push(record);
                  return ctx;
                });
                promises.push(promise);
              });
            } else {
              promise = promise.then((record) => {
                ctx.instance.__data[related] = record;
                return ctx;
              });
              promises.push(promise);
            }
          }
        });
        Promise.all(promises).then(() => next()).catch(err => next(err));
      }
    });
  });
};