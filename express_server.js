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
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://google.com"
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
  const templateVars = {
    user: res.user,
    urls: urlDatabase
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const templateVars = { user: res.user};
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  const templateVars = {
    user: res.user,
    id: req.params.id,
    longURL: urlDatabase[req.params.id]
  };
  res.render("urls_show.ejs", templateVars);
});

app.get("/register", (req, res) => {
  if (req.cookies.user_id) {
    res.redirect("/urls");
  }
  res.render("registration_index.ejs", { user: res.user });
});

app.get("/u/:id", (req, res) => {
  const id = req.params.id;
  const longURL = urlDatabase[id];
  res.redirect(longURL);
});

app.get("/login", (req, res) => {
  // change back to res.user, if reasonable after refactor.
  if (req.cookies.user_id) {
    res.redirect("/urls");
  }
  res.render("login", { user: res.user });
})

app.post("/urls", (req, res) => {
  const shortURL = generateRandomString(6);
  const longURL = req.body.longURL;
  urlDatabase[shortURL] = longURL;
  res.redirect(`/urls/${shortURL}`);
});

app.post("/urls/:id", (req, res) => {
  const editLongURL = req.body.editLongURL;
  const id = req.params.id;
  urlDatabase[id] = editLongURL;
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
    res.status(statusCode).render("error_page", {
      user: res.user,
      statusCode,
      message: "Invalid Account Info. Please Try again"
    });
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
    const statusCode = 403;
    renderError();
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
    statusCode = 400;
    res.status(statusCode).render("error_page", { 
      user: res.user, 
      statusCode,
      message: "Invalid Registration info. Please return and try again"
    });
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