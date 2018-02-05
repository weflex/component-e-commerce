
module.exports = function userCustomizer(user) {
  user.currentUser = (cb) => {
    return process.nextTick(() => cb(null, user.getCurrentUser()));
  };
};
