
module.exports = function(Model) {
  const debug = require('debug')('component:commerce:productpricing');
  let app;

  Model.disableRemoteMethodByName('destroyById');
  Model.disableRemoteMethodByName('deleteById');
  Model.disableRemoteMethodByName('removeById');

  Model.disableRemoteMethodByName('prototype.updateAttributes', true);
  Model.disableRemoteMethodByName('upsert');
  Model.disableRemoteMethodByName('upsertWithWhere');
  Model.disableRemoteMethodByName('update');
  Model.disableRemoteMethodByName('updateById');
  Model.disableRemoteMethodByName('updateAll');
  Model.disableRemoteMethodByName('createChangeStream');

  Model.on('dataSourceAttached', function(obj) {
    let replaceOrCreate = Model.replaceOrCreate;
    let replaceById = Model.replaceById;
    let create = Model.create;

    Model.replaceOrCreate = (data, options, cb) => {
      delete data.id;
      return replaceOrCreate.call(Model, data, cb);
    };

    Model.replaceById = (id, data, options, cb) => {
      delete data.id;
      create.call(Model, data, cb);
    };
  });

  Model.once('attached', (a) => {
    app = a;

    /** *************** REMOTE HOOK *************** **/

    Model.beforeRemote('find', (ctx, _, next) => {
      let currentFilter = ctx.args.filter || {};
      currentFilter.order = 'id DESC';

      ctx.args.filter = currentFilter;
      next();
    });

    /** ************* OPERATION HOOK ************* **/

    Model.observe('before save', (ctx, next) => {
      let userId = null;
      if (undefined !== ctx.options.accessToken) {
        userId = ctx.options.accessToken && ctx.options.currentUser.id;
      }
      if (ctx.instance) {
        ctx.instance.createdBy = userId || ctx.instance.createdBy;
        ctx.instance.createdAt = new Date();
      }

      next();
    });

    /** ************* REMOTE METHOD ************* **/

    Model.latest = (productId, res, next) => {
      Model.find(
        {
          order: 'id DESC',
          limit: 1,
        }, {
          where: {
            productId: productId,
          },
        }, (err, instance) => {
          /* istanbul ignore if */
          if (err) {
            console.log(err);
            return next(err);
          }
          return res.json({price: instance[0]['unitPrice']});
          /* istanbul ignore next */
          next();
        });
    };

    Model.remoteMethod('latest', {
      description: 'Get the lastest price by the product ID',
      accepts: [
        {
          arg: 'productId',
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
        verb: 'get',
        path: '/:productId/latest',
        status: 200,
        errorStatus: 404,
      },
    });
  });
};
