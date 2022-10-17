const express = require("express");
const cookieSession = require('cookie-session');
const { generateRandomString, findUserWithEmail, urlsForUser } = require('./helpers');
const { users, urlDatabase } = require('./databases');

const bcrypt = require('bcryptjs');

const app = express();
const PORT = 8080; //default port 8080


app.set("view engine", "ejs");

/**
 * Middleware
 */

app.use(cookieSession({
  name: 'session',
  keys: ["key1", "key2"]
}));


app.use(express.urlencoded({extended: true}));

// Assign function that routes errors to the error path as res.sendToErrorPage method
app.use((req, res, next) => {
  res.sendToErrorPage = (statusCode, message, path) => {
    const errorMessageEncoded = encodeURI(message);
    res.redirect(`${path}/error/${statusCode}/${errorMessageEncoded}`);
  };
  next();
});

/**
 * 
 * Routing: 
 * 
 */

/**
 *  GET requests
 */

app.get("/", (req, res) => {
  res.redirect("/login");
});

app.get("/urls", (req, res) => {
  const userID = req.session.user_id;

  if (!userID) {
    res.sendToErrorPage(401, "Please log in to access tinyURLs.", "/urls");
    return;
  }
  const user = users[userID];

  const availableURLs = urlsForUser(urlDatabase, userID);
  const templateVars = {
    user,
    urls: availableURLs,
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const userID = req.session.user_id;
  if (!userID) {
    res.redirect("/login");
    return;
  }

  const user = users[userID];
  const templateVars = { user };
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  const userID = req.session.user_id;
  if (!userID) {
    res.sendToErrorPage(401, "Only registered users can access the page for a tiny URL", "/urls");
    return;
  }
  const id = req.params.id;
  if (!urlDatabase[id] || urlDatabase[id].userID !== userID) {
    res.sendToErrorPage(401, `Tiny URL ${id} is not available for you. If you want to edit or view a short URL for a website, you will have to make it yourself.`, "/urls");
    return;
  }
  const user = users[userID];
  
  const templateVars = {
    user,
    id,
    longURL: urlDatabase[id].longURL,
  };
  res.render("urls_show.ejs", templateVars);
});

app.get("/register", (req, res) => {
  if (req.session.user_id) {
    res.redirect("/urls");
    return;
  }
  res.render("registration_index.ejs", { user: '' });
});

app.get("/u/:id", (req, res) => {
  const id = req.params.id;
  

  if (!urlDatabase[id]) {
    res.sendToErrorPage(404, "This short URL doesn't exist. Please use a valid short URL", "/u");
    return;
  }
  const longURL = urlDatabase[id].longURL;
  res.redirect(longURL);
});

app.get("/login", (req, res) => {
  if (req.session.user_id) {
    res.status(401).redirect("/urls");
    return;
  }
  res.render("login", { user: '' });
});

app.get("/:main/error/:status/:message", (req, res) => {

  const { status, message } = req.params;
  const statusCode = parseInt(status);
  const decodedMessage = decodeURI(message);
  const userID = req.session.user_id;
  const user = users[userID];
  res.status(statusCode).render("error_page", { user, statusCode, message: decodedMessage});
});

/**
 *  POST requests
 */

app.post("/urls", (req, res) => {
  const userID = req.session.user_id;
  if (!userID) {
    res.sendToErrorPage(401, "You must be logged in to create a new short URL. Please Log in and try again", "/urls");
    return;
  }
  const shortURL = generateRandomString(6);
  const longURL = req.body.longURL;
  urlDatabase[shortURL] = { longURL, userID };
  res.redirect(`/urls/${shortURL}`);
});

app.post("/urls/:id", (req, res) => {
  const userID = req.session.user_id;
  if (!userID) {
    res.sendToErrorPage(401, "You must be logged in to edit a tinyURL", "/urls");
    return;
  }
  const id = req.params.id;

  if (!urlDatabase[id] || urlDatabase[id].userID !== userID) {
    res.sendToErrorPage(401, "You can only edit your own tiny URLs", "/urls");
    return;
  }
  const editLongURL = req.body.editLongURL;
  urlDatabase[id].longURL = editLongURL;
  res.redirect(`/urls/${id}`);
});

app.post("/urls/:id/delete", (req, res) => {
  const userID = req.session.user_id;
  if (!userID) {
    res.sendToErrorPage(401, "You must be logged in to delete a tiny URL", "/urls");
    return;
  }
  const id = req.params.id;
  if (!urlDatabase[id] || urlDatabase[id].userID !== userID) {
    res.sendToErrorPage(401, "You can only delete your own tiny URLs", "/urls");
    return;
  }
  delete urlDatabase[id];
  res.redirect("/urls");
});

app.post("/login", (req, res) => {
  const renderError = () => {
    res.sendToErrorPage(403, "Invalid Account Info. Please Try again", "/login");
    return;
  };

  const { email, password } = req.body;
  const loggedUser = findUserWithEmail(users, email);
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

  const isDuplicateEmail = !!findUserWithEmail(users, email);
  
  if (!email || !req.body.password) {
    res.sendToErrorPage(400, "Invalid Registration info. Please return and try again.", "/register");
    return;
  }

  
  if (isDuplicateEmail) {
    res.sendToErrorPage(400, "Account already exists. For a new account please use a different email address.", "/register");
    return;
  }
  
  const password = bcrypt.hashSync(req.body.password, 10);
  
  users[newUserID] = {id: newUserID, email, password};
  req.session.user_id = newUserID;
  res.redirect("/urls");
});

/**
 *  Server Listener
 */

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});