const express = require("express");
const cookieSession = require('cookie-session');
const { findUserWithEmail } = require('./helpers');

const bcrypt = require('bcryptjs');
const app = express();
const PORT = 8080; //default port 8080



app.set("view engine", "ejs");

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: bcrypt.hashSync("purple-monkey=dinosaur")
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: bcrypt.hashSync("dishwasher-funk"),
  },
};

const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "userRandomID",
  },

  "9sm5xK": {
    longURL: "http://google.com",
    userID: "user2RandomID"
  }
};


const urlsForUser = function(urlDatabase, id) {
  let urlKeys = Object.keys(urlDatabase);
  // filter the keys
  const validKeys = urlKeys.filter(urlKey => urlDatabase[urlKey].userID === id);
  const validURLs = validKeys.map(validKey => {
    const url = urlDatabase[validKey];
    url.id = validKey;
    return url;
  });
  console.log(validURLs);

  return validURLs;
};

const generateRandomString = function(len) {
  // generates a random number between 0 and (36 ^ len) and converts it to a string, rendering it base 36
  return Math.floor(Math.random() * Math.pow(36, len)).toString(36);
};

generateRandomString();
app.use(cookieSession({
  name: 'session',
  keys: ["key1", "key2"]
}));

app.use(express.urlencoded({extended: true}));

app.use((req, res, next) => {
  const userID = req.session.user_id;
  res.user = users[userID];
  console.log(res.user);
  next();
});

app.use((req, res, next) => {
  res.sendError = (statusCode, message, path) => {
    const errorMessageEncoded = encodeURI(message);
    res.redirect(`${path}/error/${statusCode}/${errorMessageEncoded}`);
  };
  next();
});

app.get("/", (req, res) => {
  res.redirect("/login");
});

app.get("/urls", (req, res) => {
  const userID = req.session.user_id;

  if (!userID) {
    res.sendError(401, "Please log in to access tinyURLs.", "/urls");
    return;
  }

  const availableURLs = urlsForUser(urlDatabase, userID);
  const templateVars = {
    user: res.user,
    urls: availableURLs,
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  if (!req.session.user_id) {
    res.redirect("/login");
  }
  const templateVars = { user: res.user};
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  const userID = req.session.user_id;
  if (!userID) {
    res.sendError(401, "Only registered users can access the page for a tiny URL", "/urls");
    return;
  }
  const id = req.params.id;
  const availableURLs = urlsForUser(urlDatabase, userID);
  const availableKeys = availableURLs.map(url => url.id);
  if (!availableKeys.includes(id)) {
    res.sendError(401, `Tiny URL ${id} is not available for you. If you want to edit or view a short URL for a website, you will have to make it yourself.`, "/urls");
  }
  
  const templateVars = {
    id,
    longURL: urlDatabase[id].longURL,
    user: res.user
  };
  res.render("urls_show.ejs", templateVars);
});

app.get("/register", (req, res) => {
  // Change to res.user, if the object still makes sense after the refactoring
  if (req.session.user_id) {
    res.redirect("/urls");
  }
  res.render("registration_index.ejs", { user: '' });
});

app.get("/u/:id", (req, res) => {
  const id = req.params.id;
  

  if (!urlDatabase[id]) {
    res.sendError(404, "This short URL doesn't exist. Please use a valid short URL", "/u");
    return;
  }
  const longURL = urlDatabase[id].longURL;
  res.redirect(longURL);
});

app.get("/login", (req, res) => {
  if (req.session.user_id) {
    res.status(401).redirect("/urls");
  }
  res.render("login", { user: '' });
});

app.get("/:main/error/:status/:message", (req, res) => {
  const { status, message } = req.params;
  const intStatus = parseInt(status);
  const decodedMessage = decodeURI(message);
  const user = res.user;
  res.status(intStatus).render("error_page", { user, statusCode: intStatus, message: decodedMessage});
});

app.post("/urls", (req, res) => {
  if (!res.user) {
    res.sendError(401, "You must be logged in to create a new short URL. Please Log in and try again", "/urls");
    return;
  }
  const userID = req.session.user_id;
  const shortURL = generateRandomString(6);
  const longURL = req.body.longURL;
  urlDatabase[shortURL] = { longURL, userID };
  res.redirect(`/urls/${shortURL}`);
});

app.post("/urls/:id", (req, res) => {
  const userID = req.session.user_id;
  if (!userID) {
    res.sendError(401, "You must be logged in to edit a tinyURL", "/urls");
    return;
  }
  const availableUrls = urlsForUser(urlDatabase, userID);
  const availableKeys = availableUrls.map(url => url.id);
  const id = req.params.id;
  if (!availableKeys.includes(id)) {
    res.sendError(401, "You can only edit your own tiny URLs", "/urls");
    return;
  }
  const editLongURL = req.body.editLongURL;
  urlDatabase[id].longURL = editLongURL;
  res.redirect(`/urls/${id}`);
});

app.post("/urls/:id/delete", (req, res) => {
  const userID = req.session.user_id;
  if (!userID) {
    res.sendError(401, "You must be logged in to delete a tiny URL", "/urls");
    return;
  }
  const id = req.params.id;
  const availableURLs = urlsForUser(urlDatabase, userID);
  const availableKeys = availableURLs.map(url => url.id);
  if (!availableKeys.includes(id)) {
    res.sendError(401, "Users can only delete their own tiny URLs", "/urls");
    return;
  }
  delete urlDatabase[id];
  res.redirect("/urls");
});

app.post("/login", (req, res) => {
  const renderError = () => {
    res.sendError(403, "Invalid Account Info. Please Try again", "/login");
    return;
  };

  const { email, password } = req.body;
  const loggedUser = findUserWithEmail(users, email);
  console.log(loggedUser);
  if (!loggedUser) {
    renderError();
    return;
  }
  
  const { id: loggedUserID, password: hashedPassword } = loggedUser;
  
  if (!bcrypt.compareSync(password, hashedPassword)) {
    renderError();
    return;
  }

  req.session.user_id =  loggedUserID;
  
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});

app.post("/register", (req, res) => {
  const newUserID = generateRandomString(6);
  const email = req.body.email;
  const password = bcrypt.hashSync(req.body.password, 10);
  const isDuplicateEmail = !!findUserWithEmail(users, email);
  
  if (!email || !password || isDuplicateEmail) {
    res.sendError(400, "Invalid Registration info. Please return and try again", "/register");
    return;
  }
  users[newUserID] = {id: newUserID, email, password};
  req.session.user_id = newUserID;
  console.log(users);
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});