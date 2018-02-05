
module.exports = function(app) {
  const User = app.models.user;
  const Role = app.models.Role;
  const RoleMapping = app.models.RoleMapping;
  const userData = require('../../fixtures/user.json');

  createUserWithRoles(userData[0], 'admin');
  createUserWithRoles(userData[1], 'user');
  createUserWithRoles(userData[2], 'manager');
  createUserWithRoles(userData[3], 'member');
  createUserWithRoles(userData[4], 'manager');
  createUserWithRoles(userData[5], 'member');

  function createUserWithRoles(userObj, roleName) {
    User.findOrCreate({
      where: {
        username: userObj.username,
        email: userObj.email,
      },
    },
    {
      username: userObj.username,
      email: userObj.email,
      password: userObj.password,
    },
    function(err, user) {
      if (err) {
        return console.log(err);
      }
      // Create the admin role
      Role.findOrCreate({
        where: {
          name: roleName,
        },
      },
      {
        name: roleName,
      },
      (err, role) => {
        if (err) {
          return console.log(err);
        }

        // Assign admin role
        RoleMapping.findOrCreate({
          where: {
            roleId: role.id,
            principalId: user.id,
          },
        },
        {
          roleId: role.id,
          principalId: user.id,
          principalType: RoleMapping.USER,
        },
        (err, roleMapping) => {
          if (err) {
            return console.log(err);
          }
        });
      });
    });
  };
};
