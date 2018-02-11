
const async = require('async');
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
  const debug = require('debug')('component:commerce:product');
  let app;

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

    Model.afterRemote('find', (ctx, _, next) => {
      let result = ctx.result;
      ctx.result = result.filter((instance) => {
        return !instance.deletedAt;
      });
      ctx.result = ctx.result.map((instance) => {
        const instanceData = instance.toJSON();
        instanceData.discount = instanceData.discount.reverse().filter(
          (discount, index) => {
            return index === 0;
          });
        return instanceData;
      });

      // if transaction discounts are set, remove product discounts
      async.each(ctx.result, (result, callback) => {
        app
          .models
          .TransactionDiscount
          .findOne({
            where: {
              and: [{
                or: [{
                  endDate: null,
                }, {
                  endDate: {
                    gte: Date.now(),
                  },
                }],
              },
              {
                startDate: {
                  lte: Date.now(),
                },
                venueId: result.venueId,
              }],
            },
            include: {
              relation: 'discount',
            },
            order: 'id DESC',
          }, (err, instance) => {
            if (null != instance) {
              delete result.discount;
              callback(err);
            }
          });
      }, (err) => {
        next();
      });
    });

    /** ************* OPERATION HOOK ************* **/

    Model.observe('before save', (ctx, next) => {
      let userId = null;
      if (undefined !== ctx.options.accessToken) {
        userId = ctx.options.accessToken && ctx.options.currentUser.id;
      }
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
        ctx.instance.modifiedBy = userId || ctx.instance.createdBy;
        ctx.instance.createdBy = ctx.instance.createdBy || userId;
        ctx.instance.modifiedAt = new Date();
      } else if (ctx.isNewInstance) {
        ctx.instance.createdBy = userId || ctx.instance.createdBy;
        ctx.instance.createdAt = new Date();
      }
      next();
    });

    // white list the models which have create only behaviour
    const modelsWithOnlyCreateBehaviour = [
      'productPricing',
    ];

    Model.observe('after save', (ctx, next) => {
      const promises = [];
      if (ctx.instance) {
        ctx.instance.modifiedAt = new Date();
        Object.keys(Model.relations).forEach((related) => {
          let promiseArray = [];
          /* istanbul ignore if [cannot access ctx object] */
          const data = ctx.hookState.relations[related];
          if (typeof data !== 'undefined') {
            const relatedId = Model.relations[related].modelTo.getIdName();
            let promise = Promise.resolve('ready');
            if (data[relatedId]) {
              promise = ctx.instance[related].update(data);
            } else if (Object.keys(data).indexOf('0') > -1) {
              promiseArray = data.map((item) => {
                let promise = Promise.resolve('ready');
                // TODO: @prashant
                // Find a better way to do this
                if (modelsWithOnlyCreateBehaviour.indexOf(related) > -1) {
                  if (item[relatedId]) {
                    delete item.relatedId;
                  }
                  promise = ctx.instance[related].create(item);
                } else {
                  if (item[relatedId]) {
                    promise = ctx.instance[related].updateById(item.id, item);
                  } else {
                    promise = ctx.instance[related].create(item);
                  }
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

    Model.observe('before delete', (ctx, next) => {
      let userId = null;
      if (undefined !== ctx.options.accessToken) {
        userId = ctx.options.accessToken && ctx.options.currentUser.id;
      }
      Model.findById(ctx.where.id, (err, instance) => {
        if (err) {
          return next(err);
        }
        instance.deletedAt = new Date();
        instance.deletedBy = userId;
        ctx.hookState.deletedInstance = instance;
        next();
      });
    });

    Model.observe('after delete', (ctx, next) => {
      Model.findOrCreate(ctx.hookState.deletedInstance,
        (err, instance) => {
          if (err) {
            console.log(err);
            next(
              'An error occured while restoring data ' +
              'from hookState after delete operation'
            );
          }
          next();
        });
    });

    /** ********** REMOTE METHOD ********** **/

    Model.setAvailable = (id, res, next) => {
      Model.findById(id, (err, instance) => {
        if (err) {
          console.log(err);
          return next(err);
        }
        if (null !== instance) {
          instance.isAvailable = true;
          return instance.save(() => {
            res.json({product: instance});
          });
        }
        next();
      });
    };

    Model.remoteMethod('setAvailable', {
      description: 'Set a model instance as available',
      accepts: [
        {
          arg: 'id',
          type: 'number',
          description: 'Product ID',
        },
        {
          arg: 'res',
          type: 'object',
          http: {
            source: 'res',
          },
        },
      ],
      http: {
        verb: 'post',
        path: '/:id/available',
        status: 200,
        errorStatus: 404,
      },
    });

    Model.setUnavailable = (id, res, next) => {
      Model.findById(id, (err, instance) => {
        if (err) {
          console.log(err);
          return next(err);
        }
        if (null !== instance) {
          instance.isAvailable = false;
          return instance.save(() => {
            res.json({product: instance});
          });
        }
        next();
      });
    };

    Model.remoteMethod('setUnavailable', {
      description: 'Set a model instance as unavailable',
      accepts: [
        {
          arg: 'id',
          type: 'number',
          description: 'Product ID',
        },
        {
          arg: 'res',
          type: 'object',
          http: {
            source: 'res',
          },
        },
      ],
      http: {
        verb: 'post',
        path: '/:id/unavailable',
        status: 200,
        errorStatus: 404,
      },
    });
  });
};
