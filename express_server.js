const express = require('express');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = process.env.PORT || 8080;
const bodyParser = require('body-parser');

app.use(cookieParser());

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));

const urlDatabase = {
  "b2xVn2": {longURL: "http://www.lighthouselabs.ca", userID: 'system'},
  "9sm5xK": {longURL: "http://www.google.com", userID: 'system'},
};

const users = {
  "system": {
    id: 'system',
    email: "imsys@.sys.com",
    password: 'adminnimda'
  },
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
 "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
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

let loginStatus;
const remindLogin = function(id, res){
  if (!id) {
    loginStatus = false;
  } else {
    loginStatus = true;
  }
}

//if (loginStatus), then run urlsForUsers to return {}, save it
//else, run urlsForUsers('system';)
//id = req.cookies.user_id
const urlsForUsers = function(id) {
  let userOwned = {};
    for (let key in urlDatabase) {
      if (urlDatabase[key].userID === id) {
        userOwned[key] = urlDatabase[key];
      }
    }
   return userOwned;
};


app.get('/', (req, res) => {
  res.end('Hello!');
});


app.get('/hello', (req, res) => {
  res.end('<html><body>Hello <b>World</b></body></html>\n');
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


app.get('/login', (req, res) => {
  remindLogin();
  if(!loginStatus){
    let templateVars = {user: "system",
      loginStatus: loginStatus};
    res.render('login', templateVars);
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


app.post('/logout', (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/urls');
});


app.get('/urls.json', (req, res) =>{
  //send a json response
  res.json(urlDatabase);
});


app.get('/urls', (req, res) => {
  remindLogin(req.cookies.user_id);
  if(loginStatus){
    let userOwned = urlsForUsers(req.cookies.user_id);
    let templateVars = {urlDatabase: userOwned,
      user: users[req.cookies.user_id],
      loginStatus: loginStatus};
    res.render('urls_index', templateVars);
  } else {
    let sysOwned = urlsForUsers('system');
    let templateVars = {urlDatabase: sysOwned,
      user: 'system',
      loginStatus: loginStatus};
    res.render('urls_index', templateVars);
  }

});


app.get('/urls/new', (req, res) => {
  remindLogin(req.cookies.user_id);
  if(loginStatus){
    let templateVars = {user: users[req.cookies.user_id],
      loginStatus: loginStatus};
    res.render('urls_new', templateVars);
  } else {
    res.redirect('/login');
  }
});

function urlDuplicats (newLongURL) {
  let duplicateStatus = false;
  for (let key in urlDatabase) {
    if (urlDatabase[key].longURL === newLongURL){
      duplicateStatus = key;
    }
  }
  return duplicateStatus;
}

app.post('/urls', (req, res) => {
  remindLogin(req.cookies.user_id);
  if(loginStatus){
    let newLongURL = req.body.longURL;
    let duplicateStatus = urlDuplicats(newLongURL);
    let shortURL;
    if (!duplicateStatus) {
      shortURL = generateRandomString();
      urlDatabase[shortURL] = {};
      urlDatabase[shortURL].longURL = newLongURL;
      urlDatabase[shortURL].userID = req.cookies.user_id;
    } else {
      shortURL = duplicateStatus;
    }
    let updatedURL = '/urls/' + shortURL;
    res.redirect(updatedURL);
  }
});


app.post('/urls/:id/delete', (req, res) => {
  remindLogin(req.cookies.user_id);
  if(loginStatus){
    let shortURL = req.params.id;
    delete urlDatabase[shortURL];
    res.redirect('/urls');
  } else {
    res.redirect('/login');
  }
});


app.get('/urls/:id', (req, res) => {
  remindLogin(req.cookies.user_id);
  if(loginStatus){
    let userOwned = urlsForUsers(req.cookies.user_id);
    let templateVars = {shortURL: req.params.id,
      urlDatabase: userOwned,
      user: users[req.cookies.user_id],
      loginStatus: loginStatus};
  res.render('urls_show', templateVars);
  } else {
    res.redirect('/login');
  }
});


app.post('/urls/:id', (req, res) => {
  remindLogin(req.cookies.user_id);
  if(loginStatus){
    let newLongURL = req.body.newLongUrl;
    let shortURL = req.params.id;
    let duplicateStatus = urlDuplicats(newLongURL);

    if (!duplicateStatus){
      urlDatabase[shortURL].longURL = newLongURL;
      res.redirect(`/urls/${shortURL}`);
    } else {
      res.send('Updated long url exists.');
    }
  }
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