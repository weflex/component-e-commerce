
const path = require('path');
const request = require('supertest');
const LoopBackContext = require('loopback-context');

const SIMPLE_APP = path.join(__dirname, '..', 'fixtures', 'simple-app');
const fixtures = require(path.join(SIMPLE_APP, 'fixtures/CardBalance'));
let app = require(path.join(SIMPLE_APP, 'server/server.js'));

describe('Card Balance', () => {
  describe('When user not in context', () => {
    it('Add card balance should return 401', (next) => {
      fixtures.forEach((cardBalance) => {
        request(app)
          .post('/api/card-balance')
          .set('Accept', 'application/json')
          .send(cardBalance)
          .expect(401, (err, res) => {
            expect(err).toBe(null);
            expect(res.body.error.code).toBe('AUTHORIZATION_REQUIRED');
            next();
          });
      });
      if (fixtures.length === 0) {
        next(); // if no card balance fixtures
      }
    });

    it('List card balance should return 401', (next) => {
      request(app)
        .get('/api/card-balance')
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

    it('Add card balance should return 200', (next) => {
      LoopBackContext.runInContext(() => {
        fixtures.forEach((cardBalance) => {
          if (cardBalance === {}) {
            next();
          }
          request(app)
            .post('/api/card-balance')
            .set('Accept', 'application/json')
            .query({
              'access_token': token,
            })
            .send(cardBalance)
            .expect(200, (err, res) => {
              expect(err).toBe(null);
              expect(res.body).not.toBe(null);
              next();
            });
        });
        if (fixtures.length === 0) {
          next(); // if no card balance fixtures
        }
      });
    });

    it('Add card balance without balance should return 422', (next) => {
      LoopBackContext.runInContext(() => {
        fixtures.forEach((cardBalance) => {
          delete cardBalance.balance;
          request(app)
            .post('/api/card-balance')
            .set('Accept', 'application/json')
            .query({
              'access_token': token,
            })
            .send(cardBalance)
            .expect(422, (err, res) => {
              expect(err).toBe(null);
              expect(res.body).not.toBe(null);
              next();
            });
        });
        if (fixtures.length === 0) {
          next(); // if no card balance fixtures
        }
      });
    });

    it('Add card balance without membershipCard should return 422', (next) => {
      LoopBackContext.runInContext(() => {
        fixtures.forEach((cardBalance) => {
          if (cardBalance === {}) {
            next();
          }
          delete cardBalance.membershipCard;
          request(app)
            .post('/api/card-balance')
            .set('Accept', 'application/json')
            .query({
              'access_token': token,
            })
            .send(cardBalance)
            .expect(422, (err, res) => {
              expect(err).toBe(null);
              expect(res.body).not.toBe(null);
              next();
            });
        });
        if (fixtures.length === 0) {
          next(); // if no card balance fixtures
        }
      });
    });
  });
});
