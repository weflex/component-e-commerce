
const path = require('path');
const request = require('supertest');
const LoopBackContext = require('loopback-context');

const SIMPLE_APP = path.join(__dirname, '..', 'fixtures', 'simple-app');
let app = require(path.join(SIMPLE_APP, 'server/server.js'));
const transactionFixtureHelper =
  require(path.join(__dirname, 'helpers/transaction'))();

describe('Transaction with transaction discount', () => {
  describe('Percentage discount with minTxnAmt', () => {
    let token = null;
    beforeAll((next) => {
      transactionFixtureHelper.setupFixturesWithoutDiscounts(app);
      request(app)
        .post('/api/users/login')
        .set('Accept', 'application/json')
        .send({
          username: 'generalUser',
          password: 'password',
        })
        .expect(200, (err, res) => {
          expect(err).toBe(null);
          token = res.body.id;
          expect(res.body.userId).toEqual(2);
          app.models.Discount.create({
            discountTypeId: '7',
            venueId: '1',
            createdBy: 'venue1Owner',
            createdAt: '2018-01-18T13:49:22.205Z',
            flatPrice: null,
            pctOfPrice: 25,
            minTxnAmt: 2000,
            minQty: null,
            memberPriceOff: null,
            modifiedBy: null,
            modifiedAt: null,
            deletedAt: null,
            deletedBy: null,
          });
          // add a TransactionDiscount
          app.models.TransactionDiscount.create({
            createdAt: '2018-01-18T13:49:22.205Z',
            createdBy: 'venue1Owner',
            venueId: '1',
            discountId: '13',
            startDate: '2018-01-18T13:49:22.205Z',
            endDate: null,
            deletedBy: null,
            deletedAt: null,
          }, (err, models) => {
            next();
          });
        });
    });

    afterAll((next) => {
      const loopbackContext = LoopBackContext.getCurrentContext();
      loopbackContext.set('currentUser', null);
      next();
    });

    it('Add transaction with percentage discount should return 200', (next) => {
      const txn = {
        boughtBy: '2',
        boughtAt: '2018-01-19T13:49:22.205Z',
        currency: 'CNY',
        venueId: '1',
        transactionDetail: [
          {
            quantity: 3,
            productId: '1',
            productPricingId: '1',
          },
          {
            quantity: 1,
            productId: '2',
            productPricingId: '2',
          },
        ],
        transactionStatusId: '1',
        paymentTypeId: '4',
      };
      request(app)
        .post('/api/transaction')
        .set('Accept', 'application/json')
        .query({'access_token': token})
        .send(txn)
        .expect(200, (err, res) => {
          expect(err).toBe(null);
          expect(res.body).not.toBe(null);
          next(); // TODO: @prashant, why it doesn't call callback here?
        });
      next();
    });

    it('List transaction should return transaction with details when include filter exists', // eslint-disable-line
      (next) => {
        request(app)
          .get('/api/transaction')
          .set('Accept', 'application/json')
          .query({
            'access_token': token,
            filter: {
              include: 'transactionDetail',
            },
          })
          .expect(200, (err, res) => {
            expect(err).toBe(null);
            expect(res.body).not.toBe(null);
            next();
          });
      });

    it('List transaction should return transaction with details', (next) => {
      request(app)
        .get('/api/transaction')
        .set('Accept', 'application/json')
        .query({
          'access_token': token,
        })
        .expect(200, (err, res) => {
          let response = res.body[0];
          let transactionDetail = response.transactionDetail;
          expect(err).toBe(null);
          expect(res.body).not.toBe(null);
          expect(res.body.length).toEqual(1);
          expect(transactionDetail).toEqual([
            {
              productId: 1,
              productPricingId: 1,
              transactionId: 1,
              quantity: 3,
              subTotal: 3000,
              discount: 0,
              netTotal: 3000,
              id: 1,
            },
            {
              productId: 2,
              productPricingId: 2,
              transactionId: 1,
              quantity: 1,
              subTotal: 1001,
              discount: 0,
              netTotal: 1001,
              id: 2,
            },
          ]);
          expect(response.totalDiscount).toEqual(1000.25);
          expect(response.grandTotal).toEqual(3000.75);
          next();
        });
    });
  });

  describe('Flat discount with minTxnAmt', () => {
    let token = null;
    beforeAll((next) => {
      request(app)
        .post('/api/users/login')
        .set('Accept', 'application/json')
        .send({
          username: 'generalUser',
          password: 'password',
        })
        .expect(200, (err, res) => {
          expect(err).toBe(null);
          token = res.body.id;
          expect(res.body.userId).toEqual(2);
          app.models.Discount.create({
            discountTypeId: '8',
            venueId: '1',
            createdBy: 'venue1Owner',
            createdAt: '2018-01-18T13:49:22.205Z',
            flatPrice: 1000.25,
            pctOfPrice: null,
            minTxnAmt: 2000,
            minQty: null,
            memberPriceOff: null,
            modifiedBy: null,
            modifiedAt: null,
            deletedAt: null,
            deletedBy: null,
          });
          // add a TransactionDiscount
          app.models.TransactionDiscount.create({
            createdAt: '2018-01-18T13:49:22.205Z',
            createdBy: 'venue1Owner',
            venueId: '1',
            discountId: '14',
            startDate: '2018-01-18T13:49:22.205Z',
            endDate: null,
            deletedBy: null,
            deletedAt: null,
          }, (err, models) => {
            next();
          });
        });
    });

    afterAll((next) => {
      const loopbackContext = LoopBackContext.getCurrentContext();
      loopbackContext.set('currentUser', null);
      next();
    });

    it('Add transaction with flat discount should return 200', (next) => {
      const txn = {
        boughtBy: '2',
        boughtAt: '2018-01-19T13:49:22.205Z',
        currency: 'CNY',
        venueId: '1',
        transactionDetail: [
          {
            quantity: 3,
            productId: '1',
            productPricingId: '1',
          },
          {
            quantity: 1,
            productId: '2',
            productPricingId: '2',
          },
        ],
        transactionStatusId: '1',
        paymentTypeId: '4',
      };
      request(app)
        .post('/api/transaction')
        .set('Accept', 'application/json')
        .query({'access_token': token})
        .send(txn)
        .expect(200, (err, res) => {
          expect(err).toBe(null);
          expect(res.body).not.toBe(null);
          next(); // TODO: @prashant, why it doesn't call callback here?
        });
      next();
    });

    it('List transaction should return transaction with details when include filter exists', // eslint-disable-line
      (next) => {
        request(app)
          .get('/api/transaction')
          .set('Accept', 'application/json')
          .query({
            'access_token': token,
            filter: {
              include: 'transactionDetail',
            },
          })
          .expect(200, (err, res) => {
            expect(err).toBe(null);
            expect(res.body).not.toBe(null);
            next();
          });
      });

    it('List transaction should return transaction with details', (next) => {
      request(app)
        .get('/api/transaction')
        .set('Accept', 'application/json')
        .query({
          'access_token': token,
        })
        .expect(200, (err, res) => {
          let response = res.body[1];
          let transactionDetail = response.transactionDetail;
          expect(err).toBe(null);
          expect(res.body).not.toBe(null);
          expect(res.body.length).toEqual(2);
          expect(transactionDetail).toEqual([
            {
              productId: 1,
              productPricingId: 1,
              transactionId: 2,
              quantity: 3,
              subTotal: 3000,
              discount: 0,
              netTotal: 3000,
              id: 3,
            },
            {
              productId: 2,
              productPricingId: 2,
              transactionId: 2,
              quantity: 1,
              subTotal: 1001,
              discount: 0,
              netTotal: 1001,
              id: 4,
            },
          ]);
          expect(response.totalDiscount).toEqual(1000.25);
          expect(response.grandTotal).toEqual(3000.75);
          next();
        });
    });
  });

  describe('Percentage discount with minQty', () => {
    let token = null;
    beforeAll((next) => {
      request(app)
        .post('/api/users/login')
        .set('Accept', 'application/json')
        .send({
          username: 'generalUser',
          password: 'password',
        })
        .expect(200, (err, res) => {
          expect(err).toBe(null);
          token = res.body.id;
          expect(res.body.userId).toEqual(2);
          app.models.Discount.create({
            discountTypeId: '9',
            venueId: '1',
            createdBy: 'venue1Owner',
            createdAt: '2018-01-18T13:49:22.205Z',
            flatPrice: null,
            pctOfPrice: 25,
            minTxnAmt: null,
            minQty: 2,
            memberPriceOff: null,
            modifiedBy: null,
            modifiedAt: null,
            deletedAt: null,
            deletedBy: null,
          });
          // add a TransactionDiscount
          app.models.TransactionDiscount.create({
            createdAt: '2018-01-18T13:49:22.205Z',
            createdBy: 'venue1Owner',
            venueId: '1',
            discountId: '15',
            startDate: '2018-01-18T13:49:22.205Z',
            endDate: null,
            deletedBy: null,
            deletedAt: null,
          }, (err, models) => {
            next();
          });
        });
    });

    afterAll((next) => {
      const loopbackContext = LoopBackContext.getCurrentContext();
      loopbackContext.set('currentUser', null);
      next();
    });

    it('Add transaction with percentage discount should return 200', (next) => {
      const txn = {
        boughtBy: '2',
        boughtAt: '2018-01-19T13:49:22.205Z',
        currency: 'CNY',
        venueId: '1',
        transactionDetail: [
          {
            quantity: 3,
            productId: '1',
            productPricingId: '1',
          },
          {
            quantity: 1,
            productId: '2',
            productPricingId: '2',
          },
        ],
        transactionStatusId: '1',
        paymentTypeId: '4',
      };
      request(app)
        .post('/api/transaction')
        .set('Accept', 'application/json')
        .query({'access_token': token})
        .send(txn)
        .expect(200, (err, res) => {
          expect(err).toBe(null);
          expect(res.body).not.toBe(null);
          next(); // TODO: @prashant, why it doesn't call callback here?
        });
      next();
    });

    it('List transaction should return transaction with details when include filter exists', // eslint-disable-line
      (next) => {
        request(app)
          .get('/api/transaction')
          .set('Accept', 'application/json')
          .query({
            'access_token': token,
            filter: {
              include: 'transactionDetail',
            },
          })
          .expect(200, (err, res) => {
            expect(err).toBe(null);
            expect(res.body).not.toBe(null);
            next();
          });
      });

    it('List transaction should return transaction with details', (next) => {
      request(app)
        .get('/api/transaction')
        .set('Accept', 'application/json')
        .query({
          'access_token': token,
        })
        .expect(200, (err, res) => {
          let response = res.body[2];
          let transactionDetail = response.transactionDetail;
          expect(err).toBe(null);
          expect(res.body).not.toBe(null);
          expect(res.body.length).toEqual(3);
          expect(transactionDetail).toEqual([
            {
              productId: 1,
              productPricingId: 1,
              transactionId: 3,
              quantity: 3,
              subTotal: 3000,
              discount: 0,
              netTotal: 3000,
              id: 5,
            },
            {
              productId: 2,
              productPricingId: 2,
              transactionId: 3,
              quantity: 1,
              subTotal: 1001,
              discount: 0,
              netTotal: 1001,
              id: 6,
            },
          ]);
          expect(response.totalDiscount).toEqual(1000.25);
          expect(response.grandTotal).toEqual(3000.75);
          next();
        });
    });
  });

  describe('Flat discount with minQty', () => {
    let token = null;
    beforeAll((next) => {
      request(app)
        .post('/api/users/login')
        .set('Accept', 'application/json')
        .send({
          username: 'generalUser',
          password: 'password',
        })
        .expect(200, (err, res) => {
          expect(err).toBe(null);
          token = res.body.id;
          expect(res.body.userId).toEqual(2);
          app.models.Discount.create({
            discountTypeId: '10',
            venueId: '1',
            createdBy: 'venue1Owner',
            createdAt: '2018-01-18T13:49:22.205Z',
            flatPrice: 1000.25,
            pctOfPrice: null,
            minTxnAmt: null,
            minQty: 2,
            memberPriceOff: null,
            modifiedBy: null,
            modifiedAt: null,
            deletedAt: null,
            deletedBy: null,
          });
          // add a TransactionDiscount
          app.models.TransactionDiscount.create({
            createdAt: '2018-01-18T13:49:22.205Z',
            createdBy: 'venue1Owner',
            venueId: '1',
            discountId: '16',
            startDate: '2018-01-18T13:49:22.205Z',
            endDate: null,
            deletedBy: null,
            deletedAt: null,
          }, (err, models) => {
            next();
          });
        });
    });

    afterAll((next) => {
      const loopbackContext = LoopBackContext.getCurrentContext();
      loopbackContext.set('currentUser', null);
      next();
    });

    it('Add transaction with flat discount should return 200', (next) => {
      const txn = {
        boughtBy: '2',
        boughtAt: '2018-01-19T13:49:22.205Z',
        currency: 'CNY',
        venueId: '1',
        transactionDetail: [
          {
            quantity: 3,
            productId: '1',
            productPricingId: '1',
          },
          {
            quantity: 1,
            productId: '2',
            productPricingId: '2',
          },
        ],
        transactionStatusId: '1',
        paymentTypeId: '4',
      };
      request(app)
        .post('/api/transaction')
        .set('Accept', 'application/json')
        .query({'access_token': token})
        .send(txn)
        .expect(200, (err, res) => {
          expect(err).toBe(null);
          expect(res.body).not.toBe(null);
          next(); // TODO: @prashant, why it doesn't call callback here?
        });
      next();
    });

    it('List transaction should return transaction with details when include filter exists', // eslint-disable-line
      (next) => {
        request(app)
          .get('/api/transaction')
          .set('Accept', 'application/json')
          .query({
            'access_token': token,
            filter: {
              include: 'transactionDetail',
            },
          })
          .expect(200, (err, res) => {
            expect(err).toBe(null);
            expect(res.body).not.toBe(null);
            next();
          });
      });

    it('List transaction should return transaction with details', (next) => {
      request(app)
        .get('/api/transaction')
        .set('Accept', 'application/json')
        .query({
          'access_token': token,
        })
        .expect(200, (err, res) => {
          let response = res.body[3];
          let transactionDetail = response.transactionDetail;
          expect(err).toBe(null);
          expect(res.body).not.toBe(null);
          expect(res.body.length).toEqual(4);
          expect(transactionDetail).toEqual([
            {
              productId: 1,
              productPricingId: 1,
              transactionId: 4,
              quantity: 3,
              subTotal: 3000,
              discount: 0,
              netTotal: 3000,
              id: 7,
            },
            {
              productId: 2,
              productPricingId: 2,
              transactionId: 4,
              quantity: 1,
              subTotal: 1001,
              discount: 0,
              netTotal: 1001,
              id: 8,
            },
          ]);
          expect(response.totalDiscount).toEqual(1000.25);
          expect(response.grandTotal).toEqual(3000.75);
          next();
        });
    });
  });
});
