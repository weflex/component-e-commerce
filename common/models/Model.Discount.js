
module.exports = function(Model) {
  const debug = require('debug')('component:commerce:discount');
  let app;

  Model.once('attached', (a) => {
    app = a;

    const DISCOUNT_TYPE_FLAT_PER_PRODUCT = 1;
    const DISCOUNT_TYPE_PERCENTAGE_PER_PRODUCT = 2;
    const DISCOUNT_TYPE_BONUS_PRODUCT = 3;
    const DISCOUNT_TYPE_FLAT_WHEN_MIN_QTY = 4;
    const DISCOUNT_TYPE_PERCENTAGE_WHEN_MIN_QTY = 5;
    const DISCOUNT_TYPE_MEMBERSHIP_PRICE_OFF = 6;
    const DISCOUNT_TYPE_PERCENTAGE_WHEN_MIN_TXN_AMT = 7;
    const DISCOUNT_TYPE_FLAT_WHEN_MIN_TXN_AMT = 8;
    const DISCOUNT_TYPE_FLAT_WHEN_MIN_QTY_PER_TXN = 9;
    const DISCOUNT_TYPE_PERCENTAGE_WHEN_MIN_QTY_PER_TXN = 10;

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
      boughtBy,
      productId
    ) => {
      let appliedDiscount = 0;
      switch (discount.discountTypeId) {
        case DISCOUNT_TYPE_FLAT_PER_PRODUCT:
          appliedDiscount = quantity * discount.flatPrice;
          break;

        case DISCOUNT_TYPE_PERCENTAGE_PER_PRODUCT:
          appliedDiscount =
            quantity * ((discount.pctOfPrice * productPricing.unitPrice) / 100);
          // console.log(discount.discountTypeId);
          // console.log(quantity);
          // console.log(discount.pctOfPrice);
          // console.log(productPricing.unitPrice);
          // console.log(productId);
          // console.log(appliedDiscount);
          break;

        case DISCOUNT_TYPE_BONUS_PRODUCT:
          // TODO: @prashant
          // add configured bonus products to the cart
          // by either updating the quantity if same product
          // or getProduct with unitPrice 0.0
          break;

        case DISCOUNT_TYPE_FLAT_WHEN_MIN_QTY:
          if (quantity >= discount.minQty) {
            appliedDiscount = discount.flatPrice;
          }
          break;

        case DISCOUNT_TYPE_PERCENTAGE_WHEN_MIN_QTY:
          if (quantity >= discount.minQty) {
            appliedDiscount =
              (discount.pctOfPrice * productPricing.unitPrice) / 100;
          }
          break;

        case DISCOUNT_TYPE_MEMBERSHIP_PRICE_OFF:
          if (boughtBy) {
            // TODO: @prashant
            // check membership card exists
            // and only if exists return discount.memberPriceOff
          }
          break;

        case DISCOUNT_TYPE_PERCENTAGE_WHEN_MIN_TXN_AMT:
          // Do nothing as must be applied for a complete transaction
          break;

        case DISCOUNT_TYPE_FLAT_WHEN_MIN_TXN_AMT:
          // Do nothing as must be applied for a complete transaction
          break;

        case DISCOUNT_TYPE_FLAT_WHEN_MIN_QTY_PER_TXN:
          // Do nothing as must be applied for a complete transaction
          break;

        case DISCOUNT_TYPE_PERCENTAGE_WHEN_MIN_QTY_PER_TXN:
          // Do nothing as must be applied for a complete transaction
          break;

        default:
          throw new Error('Invalid discount type');
          break;
      }
      return appliedDiscount;
    };
  });
};
