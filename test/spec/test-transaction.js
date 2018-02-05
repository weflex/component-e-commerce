
const path = require('path');
const request = require('supertest');
const LoopBackContext = require('loopback-context');

const SIMPLE_APP = path.join(__dirname, '..', 'fixtures', 'simple-app');
const fixtures = require(path.join(SIMPLE_APP, 'fixtures/Transaction'));
let app = require(path.join(SIMPLE_APP, 'server/server.js'));
const transactionFixtureHelper =
  require(path.join(__dirname, 'helpers/transaction'))();

describe('Transaction', () => {
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
      transactionFixtureHelper.setupFixtures(app);
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
      transactionFixtureHelper.teardownFixtures(app);
      next();
    });

    it('Add transaction should return 200', (next) => {
      fixtures.forEach((transaction) => {
        request(app)
          .post('/api/transaction')
          .set('Accept', 'application/json')
          .query({'access_token': token})
          .send(transaction)
          .expect(200, (err, res) => {
            expect(err).toBe(null);
            expect(res.body).not.toBe(null);
            next();
          });
      });
    });

    it('Add transaction should return 422 when venueId is not specified',
      (next) => {
        fixtures.forEach((transaction) => {
          delete transaction.venueId;
          request(app)
            .post('/api/transaction')
            .set('Accept', 'application/json')
            .query({'access_token': token})
            .send(transaction)
            .expect(422, (err, res) => {
              expect(err).toBe(null);
              next();
            });
        });
      });

    it('Add transaction should return 422 when paymentTypeId is not enabled',
      (next) => {
        fixtures.forEach((transaction) => {
          transaction.paymentTypeId = '1';
          request(app)
            .post('/api/transaction')
            .set('Accept', 'application/json')
            .query({'access_token': token})
            .send(transaction)
            .expect(422, (err, res) => {
              expect(err).toBe(null);
              next();
            });
        });
      });

    it('Add transaction should return 422 when paymentTypeId is not as in db',
      (next) => {
        fixtures.forEach((transaction) => {
          transaction.paymentTypeId = '1000';
          request(app)
            .post('/api/transaction')
            .set('Accept', 'application/json')
            .query({'access_token': token})
            .send(transaction)
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
          let transactionDetail = res.body[0].transactionDetail;
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
          next();
        });
    });

    it('delete should return 404 Not Found', (next) => {
      LoopBackContext.runInContext(() => {
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
