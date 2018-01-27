const express = require('express');
const cookieSession = require('cookie-session');

const app = express();
const PORT = process.env.PORT || 8080;
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt-nodejs');

app.use(cookieSession({
  name: 'session',
  keys: ['mySecretKey']
}));

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));

const urlDatabase = {
  "b2xVn2": {longURL: "http://www.lighthouselabs.ca", userID: 'userRandomID'},
  "9sm5xK": {longURL: "http://www.google.com", userID: 'user2RandomID'}
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: bcrypt.hashSync('purple-monkey-dinosaur')
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: bcrypt.hashSync('dishwasher-funk')
  }
};


//to generate random user_id and shortURL
const generateRandomString = function(){
  const alphNumList = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 'z', 'x', 'c', 'v', 'b', 'n', 'm', 'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'];
  let alphNumString = '';
  for (let i = 1; i <= 6; i++){
    let randomNum = Math.floor(Math.random() * 62);
    alphNumString += alphNumList[randomNum];
  }
  return alphNumString;
};

//to check the the presence of cookie/login
const checkLogin = function(id){
  return !!id;
};

//to generate customized database for each login user
const urlsForUsers = function(id) {
  let userOwned = {};
  for (let key in urlDatabase) {
    if (urlDatabase[key].userID === id) {
      userOwned[key] = urlDatabase[key];
    }
  }
  return userOwned;
};

//check the updated longURL exist or not
//check the new added longURL exist or not
const urlDuplicats = function (newLongURL) {
  let duplicateStatus = false;
  for (let key in urlDatabase) {
    if (urlDatabase[key].longURL === newLongURL){
      duplicateStatus = key;
    }
  }
  return duplicateStatus;
};

//check email has been registered
const registerHistory = function(users, email){
  for (let obj in users) {
    if (email === users[obj].email){
      return true;
    }
  }
};

//check if registration info are not empty
const validRegistration = function(req){
  //empty fields
  if(!req.body.email || !req.body.password) {
    return false;
  } else {
    return true;
  }
};

//check if the login info matches the user database
//if not matched, key = undefined
//if matched, key = user's user_id
const loginMatch = function (users, req){
  for (let key in users) {
    if (req.body.email === users[key].email && bcrypt.compareSync(req.body.password, users[key].password)) {
      return key;
    }
  }
};


app.get('/', (req, res) => {
  const loginStatus = checkLogin(req.session.user_id);
  if(loginStatus){
    res.redirect('/urls');
  } else {
    res.redirect('/login');
  }
});


app.get('/register', (req, res) => {
  const loginStatus = checkLogin(req.session.user_id);
  if(!loginStatus){
    let templateVars = {
      registerHistoryStatus: registerHistory(users, req.body.email),
      validRegistrationStatus: validRegistration(req)};
    res.render('registration', templateVars);
  } else {
    res.redirect('/urls');
  }
});


app.post('/register', (req, res) => {
//data validation
  if(!validRegistration(req)) {
    res.status(400);
    res.render('registration', {validRegistrationStatus: false});
//registration history
  }else if (registerHistory(users, req.body.email)) {
    res.status(400);
    res.render('registration', {validRegistrationStatus: true, registerHistoryStatus: true});
//set up new registration
  } else {
    let userId = generateRandomString();
    users[userId] = {};
    users[userId].id = userId;
    users[userId].email = req.body.email;
    password = req.body.password;
    users[userId].password = bcrypt.hashSync(password);
    req.session.user_id = userId;
    res.redirect('/urls');
  }
});


app.get('/login', (req, res) => {
  const loginStatus = checkLogin(req.session.user_id);
  if(!loginStatus){
    let templateVars = {
      loginStatus: loginStatus
    };
    res.render('login', templateVars);
  } else {
    res.redirect('/urls');
  }
});



app.post('/login', (req, res) => {
  //if not matched, key = undefined
  //if matched, key = user's user_id
  let key = loginMatch(users, req);
  if (!key) {
    res.status(403);
    res.render('login', { loginStatus: false });
  } else {
    req.session.user_id = users[key].id;
    res.redirect('/urls');
  }
});


app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect('/urls');
});


app.get('/urls.json', (req, res) =>{
  //send a json response
  res.json(urlDatabase);
});


app.get('/urls', (req, res) => {
  const loginStatus = checkLogin(req.session.user_id);
  if(loginStatus){
    let userOwned = urlsForUsers(req.session.user_id);
    let templateVars = {urlDatabase: userOwned,
      user: users[req.session.user_id],
      loginStatus: loginStatus};
    res.render('urls_index', templateVars);
  } else {
    //empty urlDatabase to avoid ejo error
    let templateVars = {urlDatabase: {},
      loginStatus: loginStatus};
    res.render('urls_index', templateVars);
  }
});


app.get('/urls/new', (req, res) => {
  const loginStatus = checkLogin(req.session.user_id);
  if(loginStatus){
    let templateVars = {user: users[req.session.user_id],
      loginStatus: loginStatus};
    res.render('urls_new', templateVars);
  } else {
    res.redirect('/login');
  }
});


app.post('/urls', (req, res) => {
  const loginStatus = checkLogin(req.session.user_id);
  //check log in and duplicates
  if(loginStatus){
    let newLongURL = req.body.longURL;
    let duplicateStatus = urlDuplicats(newLongURL);
    let shortURL;
    if (!duplicateStatus) {
      shortURL = generateRandomString();
      urlDatabase[shortURL] = {};
      urlDatabase[shortURL].longURL = newLongURL;
      urlDatabase[shortURL].userID = req.session.user_id;
    } else {
      shortURL = duplicateStatus;
    }
    let updatedURL = '/urls/' + shortURL;
    res.redirect(updatedURL);
  } else {
    res.redirect('/urls/new');
  }
});


app.post('/urls/:id/delete', (req, res) => {
  const loginStatus = checkLogin(req.session.user_id);
  //check login and if the user is the creator
  if(loginStatus){
    let shortURL = req.params.id;
    if(req.session.user_id === urlDatabase[shortURL].userID) {
      delete urlDatabase[shortURL];
      res.redirect('/urls');
    } else{
      //logged in but not the creator
      let userOwned = urlsForUsers(req.session.user_id);
      let templateVars = {loginStatus: loginStatus,
        shortURL: req.params.id,
        urlDatabase: userOwned};
      res.render(`/urls/ ${req.params.id}`, templateVars);
    }
  } else {
    //not log in
    let templateVars = {loginStatus: loginStatus};
    res.render('urls_show', templateVars);
  }
});


app.get('/urls/:id', (req, res) => {
  const loginStatus = checkLogin(req.session.user_id);
  if(loginStatus){
    let userOwned = urlsForUsers(req.session.user_id);
    let templateVars = {shortURL: req.params.id,
      urlDatabase: userOwned,
      user: users[req.session.user_id],
      loginStatus: loginStatus};
    res.render('urls_show', templateVars);
  } else {
    let templateVars = {loginStatus: loginStatus};
    res.render('urls_show', templateVars);
  }
});


app.post('/urls/:id', (req, res) => {
  const loginStatus = checkLogin(req.session.user_id);
  if(loginStatus){
    //check login and if the user is the creator
    let newLongURL = req.body.newLongUrl;
    let shortURL = req.params.id;
    //log in, as well as the creator
    if(req.session.user_id === urlDatabase[shortURL].userID) {
      let duplicateStatus = urlDuplicats(newLongURL);
      //check if the new url existing already
      if (!duplicateStatus){
        urlDatabase[shortURL].longURL = newLongURL;
        res.redirect(`/urls/${shortURL}`);
      } else {
        res.send('Updated long url exists.');
      }
      //log in, but not the creator
    } else{
      let userOwned = urlsForUsers(req.session.user_id);
      let templateVars = {loginStatus: loginStatus,
        shortURL: req.params.id,
        urlDatabase: userOwned};
      res.render(`/urls/ ${req.params.id}`, templateVars);
    }
    // not log in
  } else {
    //let templateVars = {loginStatus: loginStatus};
    res.redirect(`/urls/${req.params.id}`);
  }
});


app.get('/u/:shortURL', (req, res) => {
  let shortURL = req.params.shortURL;
  let longURL = urlDatabase[shortURL].longURL;
  if (longURL) {
    res.redirect(longURL);
  } else {
    res.redirect(`/urls/${shortURL}`);
  }
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});