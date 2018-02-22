
const moment = require('moment');
const discountTypes = require('../../lib/helpers/DiscountTypes');

module.exports = function(Model) {
  const debug = require('debug')('component:commerce:discount');
  let app;

  Model.once('attached', (a) => {
    app = a;

    /**
     * ONLY processes Product Discounts
     * Accepts productPricing, discount, quantity per product
     * and returns configured discount
     * @param {String|Array|Object} productPricing The latest price for product
     * @param {String|Array|Object} discount Discount to be applied
     * @param {String|Integer} quantity Number of products bought
     */
    Model.getProductDiscounts = (
      productPricing,
      discount,
      quantity
    ) => {
      let appliedDiscount = 0;
      if (discount.discountTypeId ===
        discountTypes.DISCOUNT_TYPE_FLAT_PER_PRODUCT
      ) {
        appliedDiscount = quantity * discount.flatPrice;
      }

      if (discount.discountTypeId ===
        discountTypes.DISCOUNT_TYPE_PCT_PER_PRODUCT) {
        appliedDiscount =
          quantity * ((discount.pctOfPrice * productPricing.unitPrice) / 100);
      }

      if (discount.discountTypeId ===
        discountTypes.DISCOUNT_TYPE_FLAT_WHEN_MIN_QTY) {
        if (quantity >= discount.minQty) {
          appliedDiscount = discount.flatPrice;
        }
      }

      if (discount.discountTypeId ===
        discountTypes.DISCOUNT_TYPE_PCT_WHEN_MIN_QTY) {
        if (quantity >= discount.minQty) {
          appliedDiscount =
            (discount.pctOfPrice * productPricing.unitPrice) / 100;
        }
      }

      if (discount.discountTypeId ===
        discountTypes.DISCOUNT_TYPE_MEMBERSHIP_PRICE_OFF) {
        // check membership card exists and is valid expiresAt is not set
        // and only if exists return discount.memberPriceOff
        // TODO: @prashant
        // check whether to restrict user when paying by membership card
        // check whether to restrict user only when he has card balance > 0
        // check what should happen if latest membership card expired
        appliedDiscount = quantity * discount.memberPriceOff;
      }
      return appliedDiscount;
    };

    Model.getMembershipDiscount = (discount, quantity, boughtBy) => {
      let appliedDiscount = 0;
      if (discount.discountTypeId ===
        discountTypes.DISCOUNT_TYPE_MEMBERSHIP_PRICE_OFF) {
        // check membership card exists and is valid expiresAt is not set
        // and only if exists return discount.memberPriceOff
        // TODO: @prashant
        // check whether to restrict user when paying by membership card
        // check whether to restrict user only when he has card balance > 0
        // check what should happen if latest membership card expired
        appliedDiscount = app.models.CardBalance.findOne({
          where: {
            cardOwner: boughtBy,
          },
          include: {
            relation: 'membership',
          },
          order: 'id DESC',
        }, (err, instance) => {
          let appliedDiscount = 0;
          if (null !== instance) {
            const data  = instance.toJSON();
            if (data.membership.expiresAt === null ||
              data.membership.expiresAt > Date.now()) {
              appliedDiscount = quantity * discount.memberPriceOff;
            }
          }
          return appliedDiscount;
        });
      }
    };

    /**
     * ONLY processes Transaction Discounts
     * Accepts discount, quantity per product
     * and returns configured discount
     * @param {String|Array|Object} discount Discount to be applied
     * @param {String|Integer} quantity Number of products bought
     * @param {String|Object} amount Total Transaction amount
     */
    Model.getTransactionDiscounts = (discount, quantity, amount) => {
      let appliedDiscount = 0;
      if (discount.discountTypeId ===
        discountTypes.DISCOUNT_TYPE_PCT_WHEN_MIN_TXN_AMT) {
        appliedDiscount = 0;
      }

      if (discount.discountTypeId ===
        discountTypes.DISCOUNT_TYPE_FLAT_WHEN_MIN_TXN_AMT) {
        appliedDiscount = 0;
      }

      if (discount.discountTypeId ===
        discountTypes.DISCOUNT_TYPE_PCT_WHEN_MIN_QTY_PER_TXN) {
        // TODO: @prashant
        // add configured bonus products to the cart
        // by either updating the quantity if same product
        // or getProduct with unitPrice 0.0
        appliedDiscount = 0;
      }

      if (discount.discountTypeId ===
        discountTypes.DISCOUNT_TYPE_FLAT_WHEN_MIN_QTY_PER_TXN) {
        appliedDiscount = 0;
      }

      return appliedDiscount;
    };
  });
};
