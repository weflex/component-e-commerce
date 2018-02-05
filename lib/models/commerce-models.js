
const paymentTypeDef = require('../../common/models/Model.PaymentType.json');
const productCategoryDef =
  require('../../common/models/Model.ProductCategory.json');
const productCategoryDetailDef =
  require('../../common/models/Model.ProductCategoryDetail.json');
const venuePaymentConfigDef =
  require('../../common/models/Model.VenuePaymentConfig.json');
const brandDef =
  require('../../common/models/Model.Brand.json');
const brandDetailDef =
  require('../../common/models/Model.BrandDetail.json');
const productDef = require('../../common/models/Model.Product.json');
const productDetailDef =
  require('../../common/models/Model.ProductDetail.json');
const productPricingDef =
  require('../../common/models/Model.ProductPricing.json');
const transactionStatusDef =
  require('../../common/models/Model.TransactionStatus.json');
const transactionStatusDetailDef =
  require('../../common/models/Model.TransactionStatusDetail.json');
const transactionDef = require('../../common/models/Model.Transaction.json');
const transactionDetailDef =
  require('../../common/models/Model.TransactionDetail.json');
const cardDepositHistoryDef =
  require('../../common/models/Model.CardDepositHistory.json');
const cardBalanceDef =
  require('../../common/models/Model.CardBalance.json');
const discountDef = require('../../common/models/Model.Discount.json');
const discountTypeDef = require('../../common/models/Model.DiscountType.json');
const productDiscountDef =
  require('../../common/models/Model.ProductDiscount.json');
const transactionDiscountDef =
  require('../../common/models/Model.TransactionDiscount.json');

// Remove proerties that will confuse LB
function getSettings(def) {
  let settings = {};
  for (var s in def) {
    if (s === 'name' || s === 'properties') {
      continue;
    } else {
      settings[s] = def[s];
    }
  }
  return settings;
}

module.exports = function(dataSource) {
  // "Payment Type"
  const PaymentType = dataSource.createModel(
    paymentTypeDef.name,
    paymentTypeDef.properties,
    getSettings(paymentTypeDef)
  );

  // "Product Category"
  const ProductCategory = dataSource.createModel(
    productCategoryDef.name,
    productCategoryDef.properties,
    getSettings(productCategoryDef)
  );

  // "Product Category Detail"
  const ProductCategoryDetail = dataSource.createModel(
    productCategoryDetailDef.name,
    productCategoryDetailDef.properties,
    getSettings(productCategoryDetailDef)
  );

  // "Venue Payment Config"
  const VenuePaymentConfig = dataSource.createModel(
    venuePaymentConfigDef.name,
    venuePaymentConfigDef.properties,
    getSettings(venuePaymentConfigDef)
  );

  // "Brand"
  const Brand = dataSource.createModel(
    brandDef.name,
    brandDef.properties,
    getSettings(brandDef)
  );

  // "Brand Detail"
  const BrandDetail = dataSource.createModel(
    brandDetailDef.name,
    brandDetailDef.properties,
    getSettings(brandDetailDef)
  );

  // "Product"
  const Product = dataSource.createModel(
    productDef.name,
    productDef.properties,
    getSettings(productDef)
  );

  // "Product Detail"
  const ProductDetail = dataSource.createModel(
    productDetailDef.name,
    productDetailDef.properties,
    getSettings(productDetailDef)
  );

  // "Product Pricing"
  const ProductPricing = dataSource.createModel(
    productPricingDef.name,
    productPricingDef.properties,
    getSettings(productPricingDef)
  );

  // "Transaction Status"
  const TransactionStatus = dataSource.createModel(
    transactionStatusDef.name,
    transactionStatusDef.properties,
    getSettings(transactionStatusDef)
  );

  // "Transaction Status Detail"
  const TransactionStatusDetail = dataSource.createModel(
    transactionStatusDetailDef.name,
    transactionStatusDetailDef.properties,
    getSettings(transactionStatusDetailDef)
  );

  // "Transaction"
  const Transaction = dataSource.createModel(
    transactionDef.name,
    transactionDef.properties,
    getSettings(transactionDef)
  );

  // "Transaction Detail"
  const TransactionDetail = dataSource.createModel(
    transactionDetailDef.name,
    transactionDetailDef.properties,
    getSettings(transactionDetailDef)
  );

  // "Card Deposit History"
  const CardDepositHistory = dataSource.createModel(
    cardDepositHistoryDef.name,
    cardDepositHistoryDef.properties,
    getSettings(cardDepositHistoryDef)
  );

  // "Card Balance"
  const CardBalance = dataSource.createModel(
    cardBalanceDef.name,
    cardBalanceDef.properties,
    getSettings(cardBalanceDef)
  );

  // "Discount"
  const Discount = dataSource.createModel(
    discountDef.name,
    discountDef.properties,
    getSettings(discountDef)
  );

  // "Discount Type"
  const DiscountType = dataSource.createModel(
    discountTypeDef.name,
    discountTypeDef.properties,
    getSettings(discountTypeDef)
  );

  // "Product Discount"
  const ProductDiscount = dataSource.createModel(
    productDiscountDef.name,
    productDiscountDef.properties,
    getSettings(productDiscountDef)
  );

  // "Transaction Discount"
  const TransactionDiscount = dataSource.createModel(
    transactionDiscountDef.name,
    transactionDiscountDef.properties,
    getSettings(transactionDiscountDef)
  );

  return {
    PaymentType: PaymentType,
    ProductCategory: ProductCategory,
    ProductCategoryDetail: ProductCategoryDetail,
    VenuePaymentConfig: VenuePaymentConfig,
    Brand: Brand,
    BrandDetail: BrandDetail,
    Product: Product,
    ProductDetail: ProductDetail,
    ProductPricing: ProductPricing,
    TransactionStatus: TransactionStatus,
    TransactionStatusDetail: TransactionStatusDetail,
    Transaction: Transaction,
    TransactionDetail: TransactionDetail,
    CardDepositHistory: CardDepositHistory,
    CardBalance: CardBalance,
    DiscountType: DiscountType,
    Discount: Discount,
    ProductDiscount: ProductDiscount,
    TransactionDiscount: TransactionDiscount,
  };
};
