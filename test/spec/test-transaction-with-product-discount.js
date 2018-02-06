
const path = require('path');
const request = require('supertest');
const LoopBackContext = require('loopback-context');

const SIMPLE_APP = path.join(__dirname, '..', 'fixtures', 'simple-app');
let app = require(path.join(SIMPLE_APP, 'server/server.js'));
const fixtures = require(
  path.join(__dirname, 'fixtures/transactions/WithProductDiscounts')
);
const transactionFixtureHelper =
  require(path.join(__dirname, 'helpers/transaction'))();

describe('Transaction with product discount', () => {
  describe('When user not in context', () => {
    it('Add transaction should return 401', (next) => {
      fixtures.forEach((transaction) => {
        request(app)
          .post('/api/transaction')
          .set('Accept', 'application/json')
          .send(transaction)
          .expect(401, (err, res) => {
            expect(err).toBe(null);
            expect(res.body.error.code).toBe('AUTHORIZATION_REQUIRED');
            next();
          });
      });
    });

    it('List transaction should return 401', (next) => {
      request(app)
        .get('/api/transaction')
        .set('Accept', 'application/json')
        .expect(401, (err, res) => {
          expect(err).toBe(null);
          expect(res.body.error.code).toBe('AUTHORIZATION_REQUIRED');
          next();
        });
    });
  });

  describe('When user in context', () => {
    let token = null;
    beforeAll((next) => {
      transactionFixtureHelper.setupFixturesWithProductDiscount(app);
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
          next();
        });
    });

    afterAll((next) => {
      const loopbackContext = LoopBackContext.getCurrentContext();
      loopbackContext.set('currentUser', null);
      next();
    });

    it('Add transaction with Percentage discount should return 200', (next) => {
      fixtures.forEach((txn) => {
        request(app)
          .post('/api/transaction')
          .set('Accept', 'application/json')
          .query({'access_token': token})
          .send(txn)
          .expect(200, (err, res) => {
            expect(err).toBe(null);
            expect(res.body).not.toBe(null);
            next();
          });
      });
    });

    it('Add transaction should return 422 when venueId is not specified',
      (next) => {
        fixtures.forEach((txn) => {
          delete txn.venueId;
          request(app)
            .post('/api/transaction')
            .set('Accept', 'application/json')
            .query({'access_token': token})
            .send(txn)
            .expect(422, (err, res) => {
              expect(err).toBe(null);
              next();
            });
        });
      });

    it('Add transaction should return 422 when paymentTypeId is not enabled',
      (next) => {
        fixtures.forEach((txn) => {
          txn.paymentTypeId = '1';
          request(app)
            .post('/api/transaction')
            .set('Accept', 'application/json')
            .query({'access_token': token})
            .send(txn)
            .expect(422, (err, res) => {
              expect(err).toBe(null);
              next();
            });
        });
      });

    it('Add transaction should return 422 when paymentTypeId is not as in db',
      (next) => {
        fixtures.forEach((txn) => {
          txn.paymentTypeId = '1000';
          request(app)
            .post('/api/transaction')
            .set('Accept', 'application/json')
            .query({'access_token': token})
            .send(txn)
            .expect(422, (err, res) => {
              expect(err).toBe(null);
              next();
            });
        });
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
        .query({'access_token': token})
        .expect(200, (err, res) => {
          let response = res.body[0];
          let transactionDetail = response.transactionDetail;
          expect(err).toBe(null);
          expect(res.body).not.toBe(null);
          expect(res.body.length).toEqual(3);
          expect(transactionDetail).toEqual([
            {
              productId: 1,
              productPricingId: 1,
              transactionId: 1,
              quantity: 3,
              subTotal: 3000,
              discount: 600,
              netTotal: 2400,
              id: 1,
            },
            {
              productId: 2,
              productPricingId: 2,
              transactionId: 1,
              quantity: 1,
              subTotal: 1001,
              discount: 200.2,
              netTotal: 800.8,
              id: 2,
            },
          ]);
          expect(response.totalDiscount).toEqual(800.2);
          expect(response.grandTotal).toEqual(3200.8);
          next();
        });
    });

    it('delete should return 404 Not Found', (next) => {
      request(app)
        .delete('/api/transaction/1')
        .set('Accept', 'application/json')
        .query({
          'access_token': token,
        })
        .expect(404, (err, res) => {
          expect(err).toBe(null);
          expect(res.body).not.toBe(null);
          next();
        });
    });
  });

  describe('Flat discount', () => {
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
            discountTypeId: '1',
            venueId: '1',
            createdBy: 'venue1Owner',
            createdAt: '2018-01-18T13:49:22.205Z',
            flatPrice: 300,
            pctOfPrice: null,
            minTxnAmt: null,
            minQty: null,
            memberPriceOff: null,
            modifiedBy: null,
            modifiedAt: null,
            deletedAt: null,
            deletedBy: null,
          });
          // add a ProductDiscount
          app.models.ProductDiscount.create({
            createdAt: '2018-01-18T13:49:22.205Z',
            createdBy: 'venue1Owner',
            venueId: '1',
            discountId: '7',
            productId: '1',
            startDate: '2018-01-18T13:49:22.205Z',
            endDate: null,
            deletedBy: null,
            deletedAt: null,
          }, (err, models) => {
            next();
          });
        });
    });

    it('Add transaction with flat discount should return 200', (next) => {
      const txn = {
        boughtBy: 'venue2Member',
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
              discount: 900,
              netTotal: 2100,
              id: 5,
            },
            {
              productId: 2,
              productPricingId: 2,
              transactionId: 4,
              quantity: 1,
              subTotal: 1001,
              discount: 200.2,
              netTotal: 800.8,
              id: 6,
            },
          ]);
          expect(response.totalDiscount).toEqual(1100.2);
          expect(response.grandTotal).toEqual(2900.8);
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
            discountTypeId: '4',
            venueId: '1',
            createdBy: 'venue1Owner',
            createdAt: '2018-01-18T13:49:22.205Z',
            flatPrice: 300,
            pctOfPrice: null,
            minTxnAmt: null,
            minQty: 2,
            memberPriceOff: null,
            modifiedBy: null,
            modifiedAt: null,
            deletedAt: null,
            deletedBy: null,
          });
          // add a ProductDiscount
          app.models.ProductDiscount.create({
            createdAt: '2018-01-18T13:49:22.205Z',
            createdBy: 'venue1Owner',
            venueId: '1',
            discountId: '8',
            productId: '1',
            startDate: '2018-01-18T13:49:22.205Z',
            endDate: null,
            deletedBy: null,
            deletedAt: null,
          }, (err, models) => {
            next();
          });
        });
    });

    it('Add transaction with flat discount with minQty should return 200',
      (next) => {
        const txn = {
          boughtBy: 'venue2Member',
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
          let response = res.body[4];
          let transactionDetail = response.transactionDetail;
          expect(err).toBe(null);
          expect(res.body).not.toBe(null);
          expect(res.body.length).toEqual(5);
          expect(transactionDetail).toEqual([
            {
              productId: 1,
              productPricingId: 1,
              transactionId: 5,
              quantity: 3,
              subTotal: 3000,
              discount: 300,
              netTotal: 2700,
              id: 7,
            },
            {
              productId: 2,
              productPricingId: 2,
              transactionId: 5,
              quantity: 1,
              subTotal: 1001,
              discount: 200.2,
              netTotal: 800.8,
              id: 8,
            },
          ]);
          expect(response.totalDiscount).toEqual(500.2);
          expect(response.grandTotal).toEqual(3500.8);
          next();
        });
    });

    it('Add transaction with flat discount with less than minQty should return 200', // eslint-disable-line
      (next) => {
        const txn = {
          boughtBy: 'venue2Member',
          boughtAt: '2018-01-19T13:49:22.205Z',
          currency: 'CNY',
          venueId: '1',
          transactionDetail: [
            {
              quantity: 1,
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
          let response = res.body[5];
          let transactionDetail = response.transactionDetail;
          expect(err).toBe(null);
          expect(res.body).not.toBe(null);
          expect(res.body.length).toEqual(6);
          expect(transactionDetail).toEqual([
            {
              productId: 1,
              productPricingId: 1,
              transactionId: 6,
              quantity: 1,
              subTotal: 1000,
              discount: 0,
              netTotal: 1000,
              id: 9,
            },
            {
              productId: 2,
              productPricingId: 2,
              transactionId: 6,
              quantity: 1,
              subTotal: 1001,
              discount: 200.2,
              netTotal: 800.8,
              id: 10,
            },
          ]);
          expect(response.totalDiscount).toEqual(200.2);
          expect(response.grandTotal).toEqual(1800.8);
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
            discountTypeId: '5',
            venueId: '1',
            createdBy: 'venue1Owner',
            createdAt: '2018-01-18T13:49:22.205Z',
            flatPrice: null,
            pctOfPrice: 30,
            minTxnAmt: null,
            minQty: 2,
            memberPriceOff: null,
            modifiedBy: null,
            modifiedAt: null,
            deletedAt: null,
            deletedBy: null,
          });

          // add a ProductDiscount
          app.models.ProductDiscount.create({
            createdAt: '2018-01-18T13:49:22.205Z',
            createdBy: 'venue1Owner',
            venueId: '1',
            discountId: '9',
            productId: '2',
            startDate: '2018-01-18T13:49:22.205Z',
            endDate: null,
            deletedBy: null,
            deletedAt: null,
          }, (err, models) => {
            next();
          });
        });
    });

    it('Add transaction with percentage discount should return 200', (next) => {
      const txn = {
        boughtBy: 'venue2Member',
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
            quantity: 2,
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
          let response = res.body[6];
          let transactionDetail = response.transactionDetail;
          expect(err).toBe(null);
          expect(res.body).not.toBe(null);
          expect(res.body.length).toEqual(7);
          expect(transactionDetail).toEqual([
            {
              productId: 1,
              productPricingId: 1,
              transactionId: 7,
              quantity: 3,
              subTotal: 3000,
              discount: 300,
              netTotal: 2700,
              id: 11,
            },
            {
              productId: 2,
              productPricingId: 2,
              transactionId: 7,
              quantity: 2,
              subTotal: 2002,
              discount: 300.3,
              netTotal: 1701.7,
              id: 12,
            },
          ]);
          expect(response.totalDiscount).toEqual(600.3);
          expect(response.grandTotal).toEqual(4401.7);
          next();
        });
    });

    it('Add transaction with percentage discount with less than minQty should return 200', // eslint-disable-line
      (next) => {
        const txn = {
          boughtBy: 'venue2Member',
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
          let response = res.body[7];
          let transactionDetail = response.transactionDetail;
          expect(err).toBe(null);
          expect(res.body).not.toBe(null);
          expect(res.body.length).toEqual(8);
          expect(transactionDetail).toEqual([
            {
              productId: 1,
              productPricingId: 1,
              transactionId: 8,
              quantity: 3,
              subTotal: 3000,
              discount: 300,
              netTotal: 2700,
              id: 13,
            },
            {
              productId: 2,
              productPricingId: 2,
              transactionId: 8,
              quantity: 1,
              subTotal: 1001,
              discount: 0,
              netTotal: 1001,
              id: 14,
            },
          ]);
          expect(response.totalDiscount).toEqual(300);
          expect(response.grandTotal).toEqual(3701);
          next();
        });
    });
  });

  describe('Remote method', () => {
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
          next();
        });
    });

    afterAll((next) => {
      const loopbackContext = LoopBackContext.getCurrentContext();
      loopbackContext.set('currentUser', null);
      next();
    });

    it('List transaction should return transaction with all related details',
      (next) => {
        LoopBackContext.runInContext(() => {
          request(app)
            .get('/api/transaction/1/details')
            .set('Accept', 'application/json')
            .query({'access_token': token})
            .expect(200, (err, res) => {
              let transactionDetail = res.body.transaction.transactionDetail[0];
              expect(err).toBe(null);
              expect(res.body).not.toBe(null);
              delete transactionDetail.product.createdBy;
              delete transactionDetail.product.createdAt;
              delete transactionDetail.product.modifiedBy;
              delete transactionDetail.product.modifiedAt;
              delete transactionDetail.product.deletedBy;
              delete transactionDetail.product.deletedAt;
              delete transactionDetail.productPricing.createdBy;
              delete transactionDetail.productPricing.createdAt;
              expect(transactionDetail).toEqual(
                {
                  productId: 1,
                  productPricingId: 1,
                  transactionId: 1,
                  quantity: 3,
                  subTotal: 3000,
                  discount: 600,
                  netTotal: 2400,
                  id: 1,
                  product: {
                    productCode: 'P4',
                    venueId: 1,
                    isAvailable: true,
                    id: 1,
                    canUseToPay: true,
                    expiresAt: '2018-01-24T13:49:22.205Z',
                  },
                  productPricing: {
                    unitPrice: 1000,
                    currency: 'CNY',
                    id: 1,
                    venueId: 1,
                    productId: 1,
                  },
                },
              );
              next();
            });
        });
      });
  });
});
