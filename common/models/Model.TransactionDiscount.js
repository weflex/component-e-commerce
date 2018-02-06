
module.exports = function(Model) {
  const debug = require('debug')('component:commerce:discount');
  let app;

  Model.once('attached', (a) => {
    app = a;

    Model.getTransactionDiscounts = (ctx, venueId) => {
      let promise = Promise.resolve('ready');
      promise = app.models.TransactionDiscount.findOne({
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
            venueId: venueId,
          }],
        },
        include: {
          relation: 'Discount',
        },
      }, (err, instance) => {
        if (err) {
          console.log(err);
          throw err;
        }
        if (null != instance) {
          const data = instance.toJSON();
          ctx.instance.__data['transactionDiscount'] = data;
        }
        return ctx;
      });
    };
  });
};
