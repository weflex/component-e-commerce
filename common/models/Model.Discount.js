
module.exports = function(Model) {
  const debug = require('debug')('component:commerce:discount');
  let app;

  Model.once('attached', (a) => {
    app = a;

    const DISCOUNT_TYPE_FLAT_PER_PRODUCT = 1;
    const DISCOUNT_TYPE_PCT_PER_PRODUCT = 2;
    const DISCOUNT_TYPE_BONUS_PRODUCT = 3;
    const DISCOUNT_TYPE_FLAT_WHEN_MIN_QTY = 4;
    const DISCOUNT_TYPE_PCT_WHEN_MIN_QTY = 5;
    const DISCOUNT_TYPE_MEMBERSHIP_PRICE_OFF = 6;
    const DISCOUNT_TYPE_PCT_WHEN_MIN_TXN_AMT = 7;
    const DISCOUNT_TYPE_FLAT_WHEN_MIN_TXN_AMT = 8;
    const DISCOUNT_TYPE_PCT_WHEN_MIN_QTY_PER_TXN = 9;
    const DISCOUNT_TYPE_FLAT_WHEN_MIN_QTY_PER_TXN = 10;

    /**
     * ONLY processes Product Discounts
     * Accepts productPricing, discount, quantity per product
     * and returns configured discount
     * @param {String|Array|Object} productPricing The latest price for product
     * @param {String|Array|Object} discount Discount to be applied
     * @param {String|Integer} quantity Number of products bought
     * @param {String|Object} boughtBy User who bought the products
     */
    Model.getProductDiscounts = (
      productPricing,
      discount,
      quantity,
      boughtBy
    ) => {
      let appliedDiscount = 0;
      if (discount.discountTypeId === DISCOUNT_TYPE_FLAT_PER_PRODUCT) {
        appliedDiscount = quantity * discount.flatPrice;
      }

      if (discount.discountTypeId === DISCOUNT_TYPE_PCT_PER_PRODUCT) {
        appliedDiscount =
          quantity * ((discount.pctOfPrice * productPricing.unitPrice) / 100);
      }

      if (discount.discountTypeId === DISCOUNT_TYPE_BONUS_PRODUCT) {
        // TODO: @prashant
        // add configured bonus products to the cart
        // by either updating the quantity if same product
        // or getProduct with unitPrice 0.0

      }

      if (discount.discountTypeId === DISCOUNT_TYPE_FLAT_WHEN_MIN_QTY) {
        if (quantity >= discount.minQty) {
          appliedDiscount = discount.flatPrice;
        }
      }

      if (discount.discountTypeId === DISCOUNT_TYPE_PCT_WHEN_MIN_QTY) {
        if (quantity >= discount.minQty) {
          appliedDiscount =
            (discount.pctOfPrice * productPricing.unitPrice) / 100;
        }
      }

      if (discount.discountTypeId === DISCOUNT_TYPE_MEMBERSHIP_PRICE_OFF) {
        if (boughtBy) {
          // TODO: @prashant
          // check membership card exists
          // and only if exists return discount.memberPriceOff
        }
      }
      return appliedDiscount;
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
      if (discount.discountTypeId === DISCOUNT_TYPE_PCT_WHEN_MIN_TXN_AMT) {
        appliedDiscount = 0;
      }

      if (discount.discountTypeId === DISCOUNT_TYPE_FLAT_WHEN_MIN_TXN_AMT) {
        appliedDiscount = 0;
      }

      if (discount.discountTypeId === DISCOUNT_TYPE_PCT_WHEN_MIN_QTY_PER_TXN) {
        // TODO: @prashant
        // add configured bonus products to the cart
        // by either updating the quantity if same product
        // or getProduct with unitPrice 0.0
        appliedDiscount = 0;
      }

      if (discount.discountTypeId === DISCOUNT_TYPE_FLAT_WHEN_MIN_QTY_PER_TXN) {
        appliedDiscount = 0;
      }

      return appliedDiscount;
    };
  });
};
