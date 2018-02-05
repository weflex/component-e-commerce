
const path = require('path');
const request = require('supertest');
const LoopBackContext = require('loopback-context');

const SIMPLE_APP = path.join(__dirname, '..', 'fixtures', 'simple-app');
const APP_MODELS = require(path.join(__dirname, '../../lib/models'));
let app = require(path.join(SIMPLE_APP, 'server/server.js'));

describe('Model builder', () => {
  it('should return all models as object', (next) => {
    const options = {
      userModel: 'user',
      venueModel: 'Venue',
      dataSource: app.dataSources.db,
    };
    let modelObj = APP_MODELS(app, options);
    expect(modelObj.hasOwnProperty('user')).toBeTruthy();
    expect(modelObj.hasOwnProperty('paymentType')).toBeTruthy();
    expect(modelObj.hasOwnProperty('product')).toBeTruthy();
    expect(modelObj.hasOwnProperty('productCategory')).toBeTruthy();
    expect(modelObj.hasOwnProperty('brand')).toBeTruthy();
    expect(modelObj.hasOwnProperty('productPricing')).toBeTruthy();
    expect(modelObj.hasOwnProperty('transaction')).toBeTruthy();
    expect(modelObj.hasOwnProperty('transactionStatus')).toBeTruthy();
    expect(modelObj.hasOwnProperty('venuePaymentConfig')).toBeTruthy();
    expect(modelObj.hasOwnProperty('cardDepositHistory')).toBeTruthy();
    expect(modelObj.hasOwnProperty('cardBalance')).toBeTruthy();
    next();
  });
});
