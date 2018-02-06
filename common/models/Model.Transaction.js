
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
  const debug = require('debug')('component:commerce:transaction');
  const TXN_STATUS_COMPLETED = 2;

  let app;

  Model.disableRemoteMethodByName('destroyById', true);
  Model.disableRemoteMethodByName('deleteById',  true);
  Model.disableRemoteMethodByName('removeById',  true);

  Model.once('attached', (a) => {
    app = a;
    // validate if paymentType is available for a venue
    // or is available at all
    Model.validateAsync('paymentTypeId', isPaymentTypeEnabled, {
      code: 'UnprocessableEntity',
      message: 'PaymentType is not available',
    });

    function isPaymentTypeEnabled(err, next) {
      const VenuePaymentConfig = app.models.VenuePaymentConfig;
      const PaymentType = app.models.PaymentType;
      if (!this.paymentTypeId || !this.venueId) {
        err();
      }
      VenuePaymentConfig.findById(this.paymentTypeId,
        (err2, venuePaymentConfig) => {
          if (null !== venuePaymentConfig) {
            PaymentType.findById(venuePaymentConfig.paymentTypeId,
              (err1, paymentType) => {
                if (
                  err1 || err2 || venuePaymentConfig === null ||
              paymentType === null
                ) {
                  err();
                }
                if (
                  (venuePaymentConfig && !venuePaymentConfig.isEnabled) ||
              (paymentType && !paymentType.isEnabled)
                ) {
                  err();
                }
                next();
              });
          } else {
            err();
            next();
          }
        });
    }

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
      /* istanbul ignore next */
      next();
    });

    /** ************* OPERATION HOOK ************* **/

    Model.observe('before save', (ctx, next) => {
      const promises = [];
      let userId = null;
      if (undefined !== ctx.options.accessToken) {
        userId = ctx.options.accessToken && ctx.options.currentUser.id;
      }
      ctx.hookState.relations = {};
      /* istanbul ignore if */
      /* istanbul ignore else */
      if (ctx.isNewInstance && ctx.instance) {
        Object.keys(Model.relations).forEach((related) => {
          ctx.hookState.relations[related] = ctx.instance [related]();
        });
      } else if (ctx.instance) {
        Object.keys(Model.relations).forEach((related) => {
          ctx.hookState.relations[related] = ctx.instance [related]();
        });
      }
      if (ctx.isNewInstance) {
        ctx.instance.createdBy = userId || ctx.instance.createdBy;
        ctx.instance.createdAt = new Date();
        ctx.instance.totalPrice = 0;
        ctx.instance.grandTotal = 0;
        // this collection would hold the unit price for each product
        ctx.instance.__data['price'] = [];
        // this collection would hold the quantity for each product
        ctx.instance.__data['qty'] = [];
        // this collection would hold the discount for each product
        ctx.instance.__data['discount'] = [];
        let transactionDetail = ctx.hookState.relations['transactionDetail'];
        transactionDetail.forEach((detail) => {
          let promise = getProductPriceFromTransactionDetail(ctx, detail);
          promises.push(promise);
        });
        // by default, new transactions are pending
        if (ctx.instance.transactionStatusId === undefined) {
          ctx.instance.transactionStatusId = '1';
        }
      }
      // add transaction discount to the promise chain
      let promise =
        app
          .models
          .TransactionDiscount
          .getTransactionDiscounts(ctx, ctx.instance.__data['venueId']);
      promises.push(promise);

      /* istanbul ignore next */
      Promise.all(promises)
        .then((result) => {
          let totalDiscount = 0;

          // check if any transaction discounts are applied
          // Transaction discounts take precedence over product discounts,
          // thus it should make all product discounts 0
          let totalQty = 0;
          totalQty = ctx.instance.__data['qty'].reduce((totalQty, qty) => {
            return totalQty + qty;
          });
          // initalize counter
          let cntr = 0;
          let totalPrice = 0;
          totalPrice = ctx.instance.__data['price'].reduce(
            (totalPrice, price) => {
              return totalPrice + (ctx.instance.__data['qty'][cntr] * price);
              cntr++;
            });

          let transactionDiscount = ctx.instance.__data['transactionDiscount'];
          // iterate over each product price
          // and calculate subTotal, qty, product discount, and netTotal
          ctx.instance.__data['price'].forEach((price, item) => {
            let appliedDiscount = 0;
            let subTotal = price * ctx.instance.__data['qty'][item];
            appliedDiscount += ctx.instance.__data['discount'][item];
            ctx.hookState.relations['transactionDetail'][item]['subTotal'] =
              subTotal;
            ctx.hookState.relations['transactionDetail'][item]['discount'] =
              appliedDiscount;
            ctx.hookState.relations['transactionDetail'][item]['netTotal'] =
              subTotal - appliedDiscount;
            ctx.instance.totalPrice += subTotal;
            ctx.instance.totalDiscount += appliedDiscount;

            // Calculate grandTotal by subtracting discount from totalPrice
            ctx.instance.grandTotal =
              ctx.instance.totalPrice - ctx.instance.totalDiscount;
            item++;
          });
          delete ctx.instance.__data['price'];
          delete ctx.instance.__data['qty'];
          delete ctx.instance.__data['discount'];
          next();
        })
        .catch(err => {
          /* istanbul ignore next */
          next(err);
        });
    });

    function getProductPriceFromTransactionDetail(ctx, detail) {
      let promise = Promise.resolve('ready');
      promise = app.models.Product.findById(detail.productId, {
        include: [
          {
            relation: 'productPricing',
            scope: {
              order: 'id DESC',
              limit: 1,
            },
          },
          {
            relation: 'productDiscount',
            scope: {
              order: 'id DESC',
              limit: 1,
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
                }],
              },
              include: {
                relation: 'discount',
                scope: {
                  order: 'id DESC',
                  limit: 1,
                },
              },
            },
          },
        ],
      }, (err, instance) => {
        if (null !== instance) {
          let discount = 0;
          const data = instance.toJSON();
          ctx.instance.__data['price'].push(data.productPricing[0].unitPrice);
          ctx.instance.__data['qty'].push(detail.quantity);
          if (data.productDiscount.length > 0) {
            discount = app.models.Discount.getProductDiscounts(
              data.productPricing[0],
              data.productDiscount[0].discount,
              detail.quantity,
              ctx.instance.__data['boughtBy']
            );
          }
          ctx.instance.__data['discount'].push(discount);
        }
        return ctx;
      });
      return promise;
    }

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
            /* istanbul ignore if */
            /* istanbul ignore else */
            if (data[relatedId]) {
              /* istanbul ignore next */
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
            /* istanbul ignore if [async code] */
            /* istanbul ignore else [async code] */
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
        Promise.all(promises).then(() => {
          addCashCards(ctx, ctx.instance, next);
        }).catch(err => next(err));
      }
    });

    function addCashCards(ctx, transaction, next) {
      let userId = null;
      if (undefined !== ctx.options.accessToken) {
        userId = ctx.options.accessToken && ctx.options.currentUser.id;
      }
      if (transaction.transactionStatusId === TXN_STATUS_COMPLETED) {
        ctx.instance.__data['transactionDetail'].forEach((detail) => {
          app.models.Product.findById(detail.productId, (err, productObj) => {
            if (productObj.canUseToPay) {
              let data = {
                createdBy: userId || transaction.createdBy || transaction.boughtBy, // eslint-disable-line
                cardOwner: transaction.boughtBy,
                depositValue: detail.subTotal,
                membershipCard: detail.productId,
                createdAt: new Date(),
              };
              app.models.CardDepositHistory.create(data);
            }
            next();
          });
        });
      }
    };

    /** ********** Remote methods ********** **/

    Model.getTransactionDetails = (id, res, next) => {
      const promises = [];
      Model.findById(id, {
        include: [{
          relation: 'transactionDetail',
          scope: {
            include: ['product', 'productPricing'],
          },
        },
        {
          relation: 'transactionStatus',
          scope: {
            include: 'transactionStatusDetail',
          },
        },
        ],
      }, (err, instance) => {
        /* istanbul ignore if */
        if (err) {
          console.log(err);
          return next(err);
        }

        res.json({transaction: instance});
        /* istanbul ignore next */
        Promise.all(promises).then(() => next()).catch(err => next(err));
      });
    };

    Model.remoteMethod('getTransactionDetails', {
      description: 'Set a model instance with all details',
      accepts: [
        {
          arg: 'id',
          type: 'number',
          description: 'Transaction ID',
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
        path: '/:id/details',
        status: 200,
        errorStatus: 404,
      },
    });
  });
};
