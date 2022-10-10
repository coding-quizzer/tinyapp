const generateRandomString = function(len) {
  // generates a random number between 0 and (36 ^ len) and converts it to a string, rendering it base 36
  return Math.floor(Math.random() * Math.pow(36, len)).toString(36);
};

const findUserWithEmail = function(userDatabase, email) {
  for (let userKey in userDatabase) {
    const user = userDatabase[userKey];
    if (user.email === email) {
      return user;
    }
  }
  return null;
}

const urlsForUser = function(urlDatabase, id) {
  let urlKeys = Object.keys(urlDatabase);
  // filter the keys
  const validKeys = urlKeys.filter(urlKey => urlDatabase[urlKey].userID === id);
  const validURLs = validKeys.map(validKey => {
    const url = urlDatabase[validKey];
    url.id = validKey;
    return url;
  });

  return validURLs;
};

module.exports = { findUserWithEmail, urlsForUser, generateRandomString};