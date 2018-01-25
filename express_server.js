const express = require('express');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = process.env.PORT || 8080;
const bodyParser = require('body-parser');

app.use(cookieParser());

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

const generateRandomString = function(){
  const alphNumList = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 'z', 'x', 'c', 'v', 'b', 'n', 'm', 'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'];
  let alphNumString = '';
  for (let i = 1; i <= 6; i++){
    let randomNum = Math.ceil(Math.random() * 62);
    alphNumString += alphNumList[randomNum];
  }
  return alphNumString;
};


app.get('/', (req, res) => {
  res.end('Hello!');
});


app.get('/hello', (req, res) => {
  res.end('<html><body>Hello <b>World</b></body></html>\n');
});


app.get('/urls', (req, res) => {
  let templateVars = {urlDatabase: urlDatabase,
    user: users[req.cookies.user_id]};
  console.log(users);
  res.render('urls_index', templateVars);
});


app.get('/register', (req, res) => {
  res.render('registration');
});


app.post('/register', (req, res) => {
  let registerHistory = false;
  for (let obj in users) {
    if (req.body.email === obj.email){
      registerHistory = true;
    }
  }
  //data validation
  if(!req.body.email || !req.body.password) {
    res.status(400);
    res.send('Please fill up email and password.');
  //registration history
  } else if (registerHistory) {
        res.status(400);
        res.send('Your email has been registered.');
  //new registration
  } else {
    let userId = generateRandomString();
    users[userId] = {};
    users[userId].id = userId;
    users[userId].email = req.body.email;
    users[userId].password = req.body.password;
    res.cookie('user_id', userId);
    res.redirect('/urls');
  }
});


app.post('/login', (req, res) => {
  let loginStatus = false;
  for (let key in users) {
    if (req.body.email === users[key].email && req.body.password === users[key].password) {
      loginStatus = true;
      res.cookie('user_id', users[key].id);
      res.redirect('/');
      break;
    }
  }
  if (!loginStatus) {
      res.status(403);
      res.send('Wrong user email or password. Please try again.')
  }
});



app.get('/login', (req, res) => {
  let templateVars = {user: users[req.cookies.user_id]};
  res.render('login', templateVars);
});


app.post('/logout', (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/urls');
});


app.get('/urls.json', (req, res) =>{
  //send a json response
  res.json(urlDatabase);
});


app.get('/urls/new', (req, res) => {
  let templateVars = {user: users[req.cookies.user_id]};
  res.render('urls_new', templateVars);
});


app.post('/urls', (req, res) => {
  let longURL = req.body.longURL;
  let shortURLExisting = false;
  for (let key in urlDatabase) {
    if (urlDatabase[key] === longURL){
      shortURLExisting = true;
      shortURL = key;
    }
  }
  if (!shortURLExisting) {
    shortURL = generateRandomString();
    urlDatabase[shortURL] = longURL;
  }
  let updatedURL = '/urls/' + shortURL;
  res.redirect(updatedURL);
});


app.post('/urls/:id/delete', (req, res) => {
  let shortURL = req.params.id;
  delete urlDatabase[shortURL];
  res.redirect('/urls');
});


app.get('/urls/:id', (req, res) => {
  let templateVars = {shortURL: req.params.id,
    urlDatabase: urlDatabase,
    user: users[req.cookies.user_id]};
  res.render('urls_show', templateVars);
});


app.post('/urls/:id', (req, res) => {
  let longURL = req.body.newLongUrl;
  let shortURL = req.params.id;
  urlDatabase[shortURL] = longURL;
  res.redirect(`/urls/${shortURL}`);
});


app.get('/u/:shortURL', (req, res) => {
  let shortURL = req.params.shortURL;
  let longURL = urlDatabase[shortURL];
  //redirect to :id
  let idSearch = '/urls/' + shortURL;
  res.redirect(longURL || idSearch);
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});