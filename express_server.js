const express = require("express");
const app = express();
const PORT = 8080; //default port 8080


app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://google.com"
};

const generateRandomString = function() {
  // generates a random number between 0 and Z00000 base 36 and converts it to a string
  return Math.floor(Math.random()*Math.pow(36, 6)).toString(36);
};

generateRandomString();
app.use(express.urlencoded({extended: true}));

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase};
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
})

app.get("/urls/:id", (req, res) => {
  const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id]};
  res.render("urls_show.ejs", templateVars);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.post("/urls", (req, res) => {
  console.log(req.body); // Log the POST request body to the console
  res.send("Ok");
})

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});