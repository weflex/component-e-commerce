
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
            discountTypeId: '1',
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
            discountTypeId: '4',
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
          boughtBy: '2',
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
            discountTypeId: '5',
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

  describe('Membership discount', () => {
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
            discountTypeId: '6',
            venueId: '1',
            createdBy: 'venue1Owner',
            createdAt: '2018-01-18T13:49:22.205Z',
            flatPrice: null,
            pctOfPrice: null,
            minTxnAmt: null,
            minQty: null,
            memberPriceOff: 300,
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
            discountId: '10',
            discountTypeId: '6',
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

    it('Add transaction with membership discount should return 200', (next) => {
      let tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      // NOTE: override fixtures for product that has cash card which expires
      // otherwise the test will fail on future dates
      app.models.Product.findById(4, (err, instance) => {
        instance.expiresAt = tomorrow;
        instance.save();
      });
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
          let response = res.body[8];
          let transactionDetail = response.transactionDetail;
          expect(err).toBe(null);
          expect(res.body).not.toBe(null);
          expect(res.body.length).toEqual(9);
          expect(transactionDetail).toEqual([
            {
              productId: 1,
              productPricingId: 1,
              transactionId: 9,
              quantity: 3,
              subTotal: 3000,
              discount: 900,
              netTotal: 2100,
              id: 15,
            },
            {
              productId: 2,
              productPricingId: 2,
              transactionId: 9,
              quantity: 1,
              subTotal: 1001,
              discount: 0,
              netTotal: 1001,
              id: 16,
            },
          ]);
          expect(response.totalDiscount).toEqual(900);
          expect(response.grandTotal).toEqual(3101);
          next();
        });
    });

    it('Add transaction with membership discount when no membership should return 200', // eslint-disable-line
      (next) => {
        // NOTE: remove all cash cards to simulate user with no membership
        app.models.CardBalance.destroyAll();
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
          let response = res.body[9];
          let transactionDetail = response.transactionDetail;
          expect(err).toBe(null);
          expect(res.body).not.toBe(null);
          expect(res.body.length).toEqual(10);
          expect(transactionDetail).toEqual([
            {
              productId: 1,
              productPricingId: 1,
              transactionId: 10,
              quantity: 3,
              subTotal: 3000,
              discount: 0,
              netTotal: 3000,
              id: 17,
            },
            {
              productId: 2,
              productPricingId: 2,
              transactionId: 10,
              quantity: 1,
              subTotal: 1001,
              discount: 0,
              netTotal: 1001,
              id: 18,
            },
          ]);
          expect(response.totalDiscount).toEqual(0);
          expect(response.grandTotal).toEqual(4001);
          next();
        });
    });
  });

  describe('Bonus product discount', () => {
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
            discountTypeId: '3',
            venueId: '1',
            createdBy: 'venue1Owner',
            createdAt: '2018-01-18T13:49:22.205Z',
            flatPrice: null,
            pctOfPrice: null,
            minTxnAmt: null,
            minQty: null,
            memberPriceOff: null,
            modifiedBy: null,
            modifiedAt: null,
            deletedAt: null,
            deletedBy: null,
          });
          app.models.Discount.create({
            discountTypeId: '3',
            venueId: '1',
            createdBy: 'venue1Owner',
            createdAt: '2018-01-18T13:49:22.205Z',
            flatPrice: null,
            pctOfPrice: null,
            minTxnAmt: null,
            minQty: null,
            memberPriceOff: null,
            modifiedBy: null,
            modifiedAt: null,
            deletedAt: null,
            deletedBy: null,
          });
          // add bonus product
          app.models.BonusProduct.create({
            freeQty: 3,
            venueId: '1',
            withProductId: '1',
            getProductId: '1',
            discountId: '11',
          });

          // add bonus product
          app.models.BonusProduct.create({
            freeQty: 3,
            venueId: '1',
            withProductId: '2',
            getProductId: '1',
            discountId: '12',
          });
          // add a ProductDiscount
          app.models.ProductDiscount.create({
            createdAt: '2018-01-18T13:49:22.205Z',
            createdBy: 'venue1Owner',
            venueId: '1',
            discountId: '11',
            discountTypeId: '3',
            productId: '1',
            startDate: '2018-01-18T13:49:22.205Z',
            endDate: null,
            deletedBy: null,
            deletedAt: null,
          }, (err, models) => {
            next();
          });
          // add a ProductDiscount
          app.models.ProductDiscount.create({
            createdAt: '2018-01-18T13:49:22.205Z',
            createdBy: 'venue1Owner',
            venueId: '1',
            discountId: '12',
            discountTypeId: '3',
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

    it('Add transaction with bonus product discount should return 200',
      (next) => {
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
          let response = res.body[10];
          let transactionDetail = response.transactionDetail;
          expect(err).toBe(null);
          expect(res.body).not.toBe(null);
          expect(res.body.length).toEqual(11);
          expect(transactionDetail).toEqual([
            {
              productId: 1,
              productPricingId: 1,
              transactionId: 11,
              quantity: 6,
              subTotal: 6000,
              discount: 3000,
              netTotal: 3000,
              id: 19,
            },
            {
              productId: 2,
              productPricingId: 2,
              transactionId: 11,
              quantity: 1,
              subTotal: 1001,
              discount: 0,
              netTotal: 1001,
              id: 20,
            },
            {
              productId: 1,
              productPricingId: 1,
              transactionId: 11,
              quantity: 3,
              discount: 3000,
              subTotal: 3000,
              netTotal: 0,
              id: 21,
            },
          ]);
          expect(response.totalDiscount).toEqual(3000);
          expect(response.grandTotal).toEqual(4001);
          next();
        });
    });
  });

  describe('Group buy discount', () => {
    let token = null;
    beforeAll((next) => {
      request(app)
        .post('/api/users/login')
        .set('Accept', 'application/json')
        .send({
          username: 'venue1Member',
          password: 'password',
        })
        .expect(200, (err, res) => {
          let tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          expect(err).toBe(null);
          token = res.body.id;
          expect(res.body.userId).toEqual(4);
          app.models.Discount.create({
            discountTypeId: '11',
            venueId: '1',
            createdBy: 'venue1Owner',
            createdAt: '2018-01-18T13:49:22.205Z',
            flatPrice: 800,
            pctOfPrice: null,
            minTxnAmt: null,
            minQty: 10,
            memberPriceOff: null,
            modifiedBy: null,
            modifiedAt: null,
            deletedAt: null,
            deletedBy: null,
            groupBuyAvailable: 10,
          });
          // add a ProductDiscount
          app.models.ProductDiscount.create({
            createdAt: '2018-01-18T13:49:22.205Z',
            createdBy: 'venue1Owner',
            venueId: '1',
            discountId: '13',
            discountTypeId: '11',
            productId: '1',
            startDate: '2018-01-18T13:49:22.205Z',
            endDate: tomorrow.toISOString(),
            deletedBy: null,
            deletedAt: null,
          }, (err, models) => {
            next();
          });
        });
    });

    it('Add transaction with group buy discount should return 200', (next) => {
      const txn = {
        boughtBy: '4',
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
          let response = res.body[11];
          let transactionDetail = response.transactionDetail;
          expect(err).toBe(null);
          expect(res.body).not.toBe(null);
          expect(res.body.length).toEqual(12);
          expect(transactionDetail).toEqual([
            {
              productId: 1,
              productPricingId: 1,
              transactionId: 12,
              quantity: 1,
              subTotal: 1000,
              discount: 800,
              netTotal: 200,
              id: 22,
            },
            {
              productId: 2,
              productPricingId: 2,
              transactionId: 12,
              quantity: 1,
              subTotal: 1001,
              discount: 0,
              netTotal: 1001,
              id: 23,
            },
          ]);
          expect(response.totalDiscount).toEqual(800);
          expect(response.grandTotal).toEqual(1201);
          next();
        });
    });

    it('Add transaction with more than 1 group buy product should return 200',
      (next) => {
        const txn = {
          boughtBy: '4',
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
        const errMsg = 'Group Buy product quantity cannot be more than 1.';
        request(app)
          .post('/api/transaction')
          .set('Accept', 'application/json')
          .query({'access_token': token})
          .send(txn)
          .expect(422, (err, res) => {
            expect(err).toBe(null);
            expect(res.body.error.message).toBe(errMsg);
            next(); // TODO: @prashant, why it doesn't call callback here?
          });
        next();
      });
  });

  describe('Group buy discount for same user', () => {
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
          let tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          expect(err).toBe(null);
          token = res.body.id;
          expect(res.body.userId).toEqual(2);
          app.models.Discount.create({
            discountTypeId: '11',
            venueId: '1',
            createdBy: 'venue1Owner',
            createdAt: '2018-01-18T13:49:22.205Z',
            flatPrice: 800,
            pctOfPrice: null,
            minTxnAmt: null,
            minQty: 10,
            memberPriceOff: null,
            modifiedBy: null,
            modifiedAt: null,
            deletedAt: null,
            deletedBy: null,
            groupBuyAvailable: 10,
          });
          // add a ProductDiscount
          app.models.ProductDiscount.create({
            createdAt: '2018-01-18T13:49:22.205Z',
            createdBy: 'venue1Owner',
            venueId: '1',
            discountId: '14',
            discountTypeId: '11',
            productId: '1',
            startDate: '2018-01-18T13:49:22.205Z',
            endDate: tomorrow.toISOString(),
            deletedBy: null,
            deletedAt: null,
          }, (err, models) => {
            next();
          });
        });
    });

    it('Add transaction with group buy discount again for same user should return 200 with discount 0', // eslint-disable-line
      (next) => {
        const txn = {
          boughtBy: '2',
          boughtAt: '2018-01-20T13:49:22.205Z',
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

    it('List transaction for same user should return detail with discount 0',
      (next) => {
        request(app)
          .get('/api/transaction')
          .set('Accept', 'application/json')
          .query({
            'access_token': token,
          })
          .expect(200, (err, res) => {
            let response = res.body[12];
            let transactionDetail = response.transactionDetail;
            expect(err).toBe(null);
            expect(res.body).not.toBe(null);
            expect(res.body.length).toEqual(13);
            expect(transactionDetail).toEqual([
              {
                productId: 1,
                productPricingId: 1,
                transactionId: 13,
                quantity: 1,
                subTotal: 1000,
                discount: 0,
                netTotal: 1000,
                id: 24,
              },
              {
                productId: 2,
                productPricingId: 2,
                transactionId: 13,
                quantity: 1,
                subTotal: 1001,
                discount: 0,
                netTotal: 1001,
                id: 25,
              },
            ]);
            expect(response.totalDiscount).toEqual(0);
            expect(response.grandTotal).toEqual(2001);
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
          username: 'venue1Member',
          password: 'password',
        })
        .expect(200, (err, res) => {
          expect(err).toBe(null);
          token = res.body.id;
          expect(res.body.userId).toEqual(4);
          next();
        });
    });

    afterAll((next) => {
      const loopbackContext = LoopBackContext.getCurrentContext();
      loopbackContext.set('currentUser', null);
      next();
    });

    it('Transaction payment success through cash', (next) => {
      LoopBackContext.runInContext(() => {
        request(app)
          .get('/api/transaction/9/pay/')
          .set('Accept', 'application/json')
          .query({'access_token': token})
          .expect(200, (err, res) => {
            expect(res.err).not.toBe(null);
            expect(res.body.error.statusCode).toBe(404);
            expect(res.body.error.name).toBe('Error');
            next();
          });
      });
    });

    it('Transaction payment success through cash', (next) => {
      request(app)
        .get('/api/transaction/9/pay/4')
        .set('Accept', 'application/json')
        .query({'access_token': token})
        .expect(200, (err, res) => {
          expect(res.body.transaction).not.toBe(null);
          console.log('Tony');
          console.log(res.body);
          next();
        });
    });

    it('List transaction should return transaction with all related details',
      (next) => {
        LoopBackContext.runInContext(() => {
          request(app)
            .get('/api/transaction/9/details')
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
                  transactionId: 9,
                  quantity: 3,
                  subTotal: 3000,
                  discount: 900,
                  netTotal: 2100,
                  id: 15,
                  product: {
                    productCode: 'P4',
                    venueId: 1,
                    isAvailable: true,
                    id: 1,
                    canUseToPay: true,
                    expiresAt: '2018-02-24T13:49:22.205Z',
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
