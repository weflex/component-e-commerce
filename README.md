# Component commerce

This component consists of all the models required to process e-commerce data.

### Overview

We can categorise payments into two major channels.

- Cash payments are also processed by the venue.
- Online payments are processed using a third party service [Ping++](https://www.pingxx.com).

### Models

| Model name               | Description  
| -------------------------| ----------------------
| PaymentType              | Stores dimensional data for different payment types available in the system. <br /> **Example Alipay, WeChat, UnionPay or Cash etc.**
| VenuePaymentConfig       | This config helps determine which payment methods are enabled for a user.
| ProductCategory          | Each product may have a category and category may belong to other category. <br />**Default category is other**.
| ProductCategoryDetail    | Category detail is stored separately to help with internationalization by storing category with corresponding `locale` data.
| Product                  | These are different products that a user can choose to buy. Each `product` must have a product code.
| ProductDetail            | Product detail is stored separately to help with internationalization by storing product name and description with corresponding `locale` data.
| ProductPricing           | This is a factual information. When a price is added or updated, the price is stored in this collection and a reference is stored in the Product Model so that we can see price history and derive analytics corresponding to price changes.
| TransactionStatus        | This collection stores dimensional data that defines the various status for a transaction. <br />**PENDING, COMPLETED, PROCESSING, CANCELLED, REFUND, etc.**
| TransactionStatusDetail  | Transaction status detail is stored separately to help with internationalization by storing product name and description with corresponding `locale` data.
| Transaction              | When a user buys an item, they will create a transaction which may have many products.
| TransactionDetail        | A cart contains different products a user bought during a transaction.

## Usage

- Add dependency to your loopback project's package.json

```
  "component-commerce": "^1.0.0",
```

- Add models to server/model-config.json

```
  "_meta": {
    "sources": [
      "../common/models",
      ...
      ...
      "../node_modules/component-commerce/common/models"
    ]
  },
  "PaymentType": {
    "dataSource": "db",
    "public": true
  },
  "ProductCategory": {
    "dataSource": "db",
    "public": true
  },
  "ProductCategoryDetail": {
    "dataSource": "db",
    "public": true
  },
  "Brand": {
    "dataSource": "db",
    "public": true
  },
  "BrandDetail": {
    "dataSource": "db",
    "public": true
  },
  "Product": {
    "dataSource": "db",
    "public": true
  },
  "ProductDetail": {
    "dataSource": "db",
    "public": true
  },
  "ProductPricing": {
    "dataSource": "db",
    "public": true
  },
  "TransactionStatus": {
    "dataSource": "db",
    "public": true
  },
  "TransactionStatusDetail": {
    "dataSource": "db",
    "public": true
  },
  "Transaction": {
    "dataSource": "db",
    "public": true
  },
  "TransactionDetail": {
    "dataSource": "db",
    "public": true
  },
  "VenuePaymentConfig": {
    "dataSource": "db",
    "public": true
  },
  "CardDepositHistory": {
    "dataSource": "db",
    "public": true
  },
  "CardBalance": {
    "dataSource": "db",
    "public": true
  },
  "DiscountType": {
    "dataSource": "db",
    "public": true
  },
  "DiscountTypeDetail": {
    "dataSource": "db",
    "public": true
  },
  "Discount": {
    "dataSource": "db",
    "public": true
  },
  "ProductDiscount": {
    "dataSource": "db",
    "public": true
  },
  "TransactionDiscount": {
    "dataSource": "db",
    "public": true
  },
```

- Add a boot script to server/boot/commerce.js

```
module.exports = function commerce(app) {
  var commerce = require('../../node_modules/component-commerce/lib'); // specify relative path

  var options = {
    // custom user model
    userModel: 'user', // specify your custom user model
    venueModel: 'Venue', // specify your custom venue model

    // used by modelBuilder, component-issue-handler/lib/models/index.js
    // Data source for metadata persistence
    dataSource: app.dataSources.db, // specify your datasource
  };
  commerce(app, options);
};
```
