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

const generateRandomString = function(len) {
  // generates a random number between 0 and (36 ^ len) and converts it to a string, rendering it base 36
  return Math.floor(Math.random() * Math.pow(36, len)).toString(36);
};

generateRandomString();
app.use(cookieParser());
app.use(express.urlencoded({extended: true}));

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls", (req, res) => {
  const templateVars = {
    username: req.cookies["username"],
    urls: urlDatabase
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const templateVars = { username: req.cookies["username"]};
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  const templateVars = {
    username: req.cookies["username"],
    id: req.params.id,
    longURL: urlDatabase[req.params.id]
  };
  res.render("urls_show.ejs", templateVars);
});

app.get("/register", (req, res) => {
  res.render("registration_index.ejs", {username: req.cookies.username});
});

app.get("/u/:id", (req, res) => {
  const id = req.params.id;
  const longURL = urlDatabase[id];
  res.redirect(longURL);
});

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
  const username = req.body.username;
  res.cookie("username", username);
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  res.clearCookie('username');
  res.redirect("/urls");
});

app.post("/register", (req, res) => {
  const {userID, submits: {email, password}} = {userID: generateRandomString(6), submits: req.body};
  users[userID] = {userID, email, password};
  res.cookie("user_id", userID);
  console.log(users);
  res.redirect("/urls");
})

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});