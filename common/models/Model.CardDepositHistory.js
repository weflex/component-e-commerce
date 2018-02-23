
const errCodes = require('../../lib/helpers/ErrorStatusCode');

module.exports = function(Model) {
  const debug = require('debug')('component:commerce:carddeposithistory');
  let app;

  Model.disableRemoteMethodByName('destroyById');
  Model.disableRemoteMethodByName('deleteById');
  Model.disableRemoteMethodByName('removeById');

  Model.disableRemoteMethodByName('prototype.updateAttributes');
  Model.disableRemoteMethodByName('upsert');
  Model.disableRemoteMethodByName('upsertWithWhere');
  Model.disableRemoteMethodByName('update');
  Model.disableRemoteMethodByName('updateById');
  Model.disableRemoteMethodByName('updateAll');
  Model.disableRemoteMethodByName('createChangeStream');

  Model.once('attached', (a) => {
    app = a;

    // validate if depositValue is greater than ZERO
    Model.validateAsync('depositValue', depositValueMustBeGreaterThanZero, {
      code: 422,
      message: errCodes.ERR_CARD_DEPOSIT_HISTORY_MINIMUM_DEPOSIT_GREATER_THAN_0,
    });

    function depositValueMustBeGreaterThanZero(err, next) {
      if (this.depositValue <= 0) {
        err();
      }
      next();
    };

    /** ************* OPERATION HOOK ************* **/

    Model.observe('after save', (ctx, next) => {
      // update balance by adding the depositValue
      // if balance update fails, failures must be recorded in a log
      // to update manually
      let userId = null;
      if (undefined !== ctx.options.accessToken) {
        userId = ctx.options.accessToken && ctx.options.currentUser.id;
      }
      if (ctx.instance) {
        let balanceData = {
          createdBy: userId || ctx.instance.createdBy,
          createdAt: new Date(),
          balance: ctx.instance.depositValue,
          cardOwner: ctx.instance.cardOwner,
          membershipCard: ctx.instance.membershipCard,
          venueId: ctx.instance.venueId,
        };
        addOrUpdateBalance(balanceData, next);
      }
    });

    function addOrUpdateBalance(balanceData, next) {
      let currentBalance = 0;
      app.models.CardBalance.findOne({
        where: {
          membershipCard: balanceData.membershipCard,
        },
      }, (findErr, persistedModel) => {
        if (findErr) {
          console.log(findErr);
          next(findErr);
        }
        if (null !== persistedModel) {
          currentBalance = persistedModel.balance;
          currentBalance += balanceData.balance;
          persistedModel.balance = currentBalance;
          persistedModel.save((err, instance) => {
            if (err) {
              // TODO: invoke logger
              console.log(err);
              next(err);
            }
            next();
          });
        } else {
          app.models.CardBalance.create(balanceData);
          next();
        }
      });
    }

    /** ************* REMOTE METHOD ************* **/

    Model.deposits = (membershipCard, options, filter, res, next) => {
      let userId = null;
      if (undefined !== options.accessToken) {
        userId = options.accessToken && options.currentUser.id;
      }
      let currentFilter = filter || {};
      // update filter
      if (currentFilter.order === undefined) {
        currentFilter.order = 'id DESC';
      }
      Model.find(currentFilter, {
        where: {
          cardOwner: userId,
          membershipCard: membershipCard,
        },
      }, (err, instance) => {
        /* istanbul ignore if */
        if (err) {
          console.log(err);
          return next(err);
        }
        return res.json({history: instance});
        /* istanbul ignore next */
        next();
      });
    };

    Model.remoteMethod('deposits', {
      description: [
        'Get the deposit history by membershipCard for cardOwner ',
        'from context',
      ],
      accepts: [
        {
          arg: 'membershipCard',
          type: 'string',
          description: 'Membership Card',
        },
        {
          arg: 'options',
          type: 'object',
          http: 'optionsFromRequest',
        },
        {
          arg: 'filter',
          type: 'object',
          http: {
            source: 'query',
          },
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
        path: '/membershipCard/:membershipCard',
        status: 200,
        errorStatus: 404,
      },
    });
  });
};
