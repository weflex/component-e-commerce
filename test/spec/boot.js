
describe('boot the test environment', () => {
  it('boot the test environment', (next) => {
    require('../fixtures/simple-app/server/server.js')(next);
  });
});
