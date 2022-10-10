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

const urlsForUser = function(urlDatabase, userID) {
  const userURLs = {};
  let urlKeys = Object.keys(urlDatabase);
  for (let key of urlKeys) {
    let urlObj = urlDatabase[key];
    if (urlObj.userID === userID) {
      userURLs[key] = urlObj;
    }
  }
  
  return userURLs;
};

module.exports = { findUserWithEmail, urlsForUser, generateRandomString};