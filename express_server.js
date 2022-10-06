const express = require("express");
const cookieParser = require('cookie-parser');
const app = express();
const PORT = 8080; //default port 8080


app.set("view engine", "ejs");

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey=dinosaur"
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
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

const findUserWithEmail = function(email) {
  for (let userKey in users) {
    const user = users[userKey];
    if (user.email === email) {
      return user;
    }
  }
  return null;
}

const urlsForUser = function(id) {
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
} 

const generateRandomString = function(len) {
  // generates a random number between 0 and (36 ^ len) and converts it to a string, rendering it base 36
  return Math.floor(Math.random() * Math.pow(36, len)).toString(36);
};

generateRandomString();
app.use(cookieParser());
app.use(express.urlencoded({extended: true}));

app.use((req, res, next) => {
  const userID = req.cookies.user_id;
  res.user = users[userID];
  console.log(res.user);
  next();
});

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls", (req, res) => {
  const userID = req.cookies.user_id;

  if (!userID) {
    const statusCode = 401;
    const errorMessage = "Please log in to acess tinyURLs";
    const errorMessageEncoded = encodeURI(errorMessage);
    res.redirect(`/urls/error/${statusCode}/${errorMessageEncoded}`);
    return;
  }

  const availableURLs = urlsForUser(userID);
  const templateVars = {
    user: res.user,
    urls: availableURLs,
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  // or res.user
  if (!req.cookies.user_id) {
    res.redirect("/login") ;
  }
  const templateVars = { user: res.user};
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  const userID = req.cookies.user_id;
  if (!userID) {
    const statusCode = 401;
    const errorMessage = "Only registered users can access the page for a tiny URL";
    const errorMessageEncoded = encodeURI(errorMessage);
    res.redirect(`/urls/error/${statusCode}/${errorMessageEncoded}`);
    return;
  }
  const id = req.params.id;
  const availableURLs = urlsForUser(userID);
  const availableKeys = availableURLs.map(url => url.id);
  if (!availableKeys.includes(id)) {
    const statusCode = 401;
    const errorMessage = `Tiny URL ${id} is not available for you. If you want to edit or view a short URL for a website, you will have to make it yourself.`;
    const errorMessageEncoded = encodeURI(errorMessage);
    res.redirect(`/urls/error/${statusCode}/${errorMessageEncoded}`);
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
  if (req.cookies.user_id) {
    res.redirect("/urls");
  }
  res.render("registration_index.ejs", { user: '' });
});

app.get("/u/:id", (req, res) => {
  const id = req.params.id;
  

  if (!urlDatabase[id]) {
    const statusCode = 404;
    const errorMessage = "This short URL doesn't exist. Please use a valid short URL"
    const errorMessageEncoded = encodeURI(errorMessage);
    res.redirect(`/u/error/${statusCode}/${errorMessageEncoded}`);
    return;
  }
  const longURL = urlDatabase[id].longURL;
  res.redirect(longURL);
});

app.get("/login", (req, res) => {
  // change back to res.user, if reasonable after refactor.
  if (req.cookies.user_id) {
    res.status(401).redirect("/urls");
  }
  res.render("login", { user: '' });
});

app.get("/:main/error/:status/:message", (req, res) => {
  const { status, message } = req.params;
  const decodedMessage = decodeURI(message);
  const user = res.user;
  res.status(status).render("error_page", { user, statusCode: status, message: decodedMessage});
});

app.post("/urls", (req, res) => {
  if (!res.user) {
    const statusCode = 401;
    const errorMessage = "You must be logged in to create a new short URL. Please Log in and try again";
    const errorMessageEncoded = encodeURI(errorMessage);
    res.redirect(`/urls/error/${statusCode}/${errorMessageEncoded}`);
    return;
  }
  const userID = req.cookies.user_id;
  const shortURL = generateRandomString(6);
  const longURL = req.body.longURL;
  urlDatabase[shortURL] = { longURL, userID };
  res.redirect(`/urls/${shortURL}`);
});

app.post("/urls/:id", (req, res) => {
  const userID = req.cookies.user_id;
  if (!userID) {
    const statusCode = 401;
    const errorMessage = "You must be logged in to edit a tinyURL";
    const errorMessageEncoded = encodeURI(errorMessage);
    res.redirect(`/urls/error/${statusCode}/${errorMessageEncoded}`);
    return;
  }
  const availableUrls = urlsForUser(userID);
  const availableKeys = availableUrls.map(url => url.id);
  const id = req.params.id;
  if (!availableKeys.includes(id)) {
    const statusCode = 401;
    const errorMessage = "You can only edit your own tiny URLs";
    const errorMessageEncoded = encodeURI(errorMessage);
    res.redirect(`/urls/error/${statusCode}/${errorMessageEncoded}`);
    return;
  }
  const editLongURL = req.body.editLongURL;
  urlDatabase[id].longURL = editLongURL;
  res.redirect(`/urls/${id}`);
});

app.post("/urls/:id/delete", (req, res) => {
  const id = req.params.id;
  delete urlDatabase[id];
  res.redirect("/urls");
});

app.post("/login", (req, res) => {
  const renderError = () => {
    const statusCode = 403;
    const errorMessage = "Invalid Account Info. Please Try again"
    const errorMessageEncoded = encodeURI(errorMessage);
    res.redirect(`/login/error/${statusCode}/${errorMessageEncoded}`);
  }

  const { email, password } = req.body;
  const loggedUser = findUserWithEmail(email);
  console.log(loggedUser);
  if (!loggedUser) {
    renderError();
    return;
  };
  
  const { id: loggedUserID, password: userPassword } = loggedUser;
  
  if (password !== userPassword) {
    renderError();
    return;
  }

  res.cookie("user_id", loggedUserID);
  
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
  res.redirect("/urls");
});

app.post("/register", (req, res) => {
  const newUserID = generateRandomString(6);
  const {email, password} = req.body;
  const isDuplicateEmail = !!findUserWithEmail(email);
  let statusCode;
  
  if (!email || !password || isDuplicateEmail) {
    const statusCode = 400;
    const errorMessage = "Invalid Registration info. Please return and try again";
    const errorMessageEncoded = encodeURI(errorMessage);
    res.redirect(`/register/error/${statusCode}/${errorMessageEncoded}`)
    
    return;
  }
  users[newUserID] = {id: newUserID, email, password};
  res.cookie("user_id", newUserID);
  console.log(users);
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});