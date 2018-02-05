
const path = require('path');
const request = require('supertest');
const LoopBackContext = require('loopback-context');

const SIMPLE_APP = path.join(__dirname, '..', 'fixtures', 'simple-app');
const fixtures = require(path.join(SIMPLE_APP, 'fixtures/CardDepositHistory'));
let app = require(path.join(SIMPLE_APP, 'server/server.js'));

describe('Card Deposit History', () => {
  describe('When user not in context', () => {
    it('Add membership card deposit history should return 401', (next) => {
      fixtures.forEach((cardDeposit) => {
        request(app)
          .post('/api/card-deposit')
          .set('Accept', 'application/json')
          .send(cardDeposit)
          .expect(401, (err, res) => {
            expect(err).toBe(null);
            expect(res.body.error.code).toBe('AUTHORIZATION_REQUIRED');
            next();
          });
      });
      if (fixtures.length === 0) {
        next(); // if no card deposit fixtures
      }
    });

    it('List membership card deposit should return 401', (next) => {
      request(app)
        .get('/api/card-deposit')
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

    it('Add membership card deposit should return 200', (next) => {
      LoopBackContext.runInContext(() => {
        fixtures.forEach((cardDeposit) => {
          request(app)
            .post('/api/card-deposit')
            .set('Accept', 'application/json')
            .query({
              'access_token': token,
            })
            .send(cardDeposit)
            .expect(200, (err, res) => {
              expect(err).toBe(null);
              expect(res.body).not.toBe(null);
              next();
            });
        });
        if (fixtures.length === 0) {
          next(); // if no card deposit fixtures
        }
      });
    });

    it('List membership card deposit without order filter should return 200',
      (next) => {
        LoopBackContext.runInContext(() => {
          request(app)
            .get('/api/card-deposit/membershipCard/1')
            .set('Accept', 'application/json')
            .query({
              'access_token': token,
            })
            .expect(200, (err, res) => {
              expect(err).toBe(null);
              expect(res.body).not.toBe(null);
              next();
            });
        });
      });

    it('List membership card deposit with order filter should return 200',
      (next) => {
        LoopBackContext.runInContext(() => {
          request(app)
            .get('/api/card-deposit/membershipCard/1')
            .set('Accept', 'application/json')
            .query({
              'access_token': token,
              filter: {
                order: 'id ASC',
              },
            })
            .expect(200, (err, res) => {
              expect(err).toBe(null);
              expect(res.body).not.toBe(null);
              next();
            });
        });
      });

    it('Add membership card deposit with depositValue 0 should return 422',
      (next) => {
        LoopBackContext.runInContext(() => {
          fixtures.forEach((cardDeposit) => {
            cardDeposit.depositValue = 0;
            request(app)
              .post('/api/card-deposit')
              .set('Accept', 'application/json')
              .query({
                'access_token': token,
              })
              .send(cardDeposit)
              .expect(422, (err, res) => {
                expect(err).toBe(null);
                expect(res.body).not.toBe(null);
                next();
              });
          });
          if (fixtures.length === 0) {
            next(); // if no card deposit fixtures
          }
        });
      });
  });
});
