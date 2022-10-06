const findUserWithEmail = function(userDatabase, email) {
  for (let userKey in userDatabase) {
    const user = userDatabase[userKey];
    if (user.email === email) {
      return user;
    }
  }
  return null;
}

module.exports = { findUserWithEmail };