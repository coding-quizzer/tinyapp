const { assert } = require('chai');

const { findUserWithEmail } = require('../helpers.js');

const testUsers = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey=dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

describe('getUserByEmail', function() {
  it('should return a user with valid email', function() {
    const user = findUserWithEmail(testUsers, "user@example.com")

    const expectedUserID = "userRandomID";
    assert.strictEqual(user.id, expectedUserID);
  });

  it('should return null if user doesn\'t exist in the database', function() {
    const user = findUserWithEmail(testUsers, "readyfox@ready.com");
    assert.isNull(user);
  });
});