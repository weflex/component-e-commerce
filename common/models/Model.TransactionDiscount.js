
const discountTypes = require('../../lib/helpers/DiscountTypes');

module.exports = function(Model) {
  const debug = require('debug')('component:commerce:discount');
  let app;

  Model.once('attached', (a) => {
    app = a;

    /**
     * Check if transaction discounts are available for the venue
     * @param {Object} ctx LoopbackContext
     * @param {String|Integer} venueId Venue ID
     * @return {Object} Return LoopbackContext
     */
    Model.hasTransactionDiscount = (ctx, venueId) => {
      app.models.TransactionDiscount.findOne({
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
          relation: 'discount',
        },
        order: 'id DESC',
      }, (err, instance) => {
        /* istanbul ignore if */
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

    Model.getTotalTransactionDiscount = (discount, totalPrice, quantity) => {
      let appliedDiscount = 0;
      if (discount.discountTypeId ===
        discountTypes.DISCOUNT_TYPE_PCT_WHEN_MIN_TXN_AMT) {
        if (totalPrice >= discount.minTxnAmt) {
          appliedDiscount = (discount.pctOfPrice * totalPrice) / 100;
        }
      }

      if (discount.discountTypeId ===
        discountTypes.DISCOUNT_TYPE_FLAT_WHEN_MIN_TXN_AMT) {
        if (totalPrice >= discount.minTxnAmt) {
          appliedDiscount = discount.flatPrice;
        }
      }

      if (discount.discountTypeId ===
        discountTypes.DISCOUNT_TYPE_PCT_WHEN_MIN_QTY_PER_TXN) {
        if (quantity >= discount.minQty) {
          appliedDiscount = (discount.pctOfPrice * totalPrice) / 100;
        }
      }

      if (discount.discountTypeId ===
        discountTypes.DISCOUNT_TYPE_FLAT_WHEN_MIN_QTY_PER_TXN) {
        if (quantity >= discount.minQty) {
          appliedDiscount = discount.flatPrice;
        }
      }

      return appliedDiscount;
    };
  });
};
