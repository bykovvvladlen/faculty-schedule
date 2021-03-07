const express = require('express');
const app = express();
const mysql = require('mysql2');
const port = 3000;
const cookieParser = require('cookie-parser');
app.use(cookieParser());

app.use(express.json());
const api = require('./api');

function connectToDatabase() {
  return mysql.createConnection({
      host: 'localhost',
      user: 'root',
      database: 'bykov',
      password: 'ZChw9ohQCoMJ',
  });
}

const connection = connectToDatabase();

function checkToken(token) {
  return new Promise((resolve) => {
      connection.execute('SELECT * FROM `users` WHERE token=?', [token], (error, results) => {
          if (error || results.length === 0) {
              resolve(false);
          }

          else resolve(true);
      });
  });
}

app.use(async (req, res, next) => {
  const token = req.cookies?.token;
  const exists = token ? await checkToken(token) : undefined;
  const authLinks = ['/auth', '/api/signup', '/api/login'].includes(req.url);

  if (authLinks || exists) {
      if (authLinks && exists) res.redirect('/');
      else next();
  }

  else {
      res.redirect('/auth');
  }
});

app.use('/api', api);
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/html/index.html');
});

app.get('/common.js', (req, res) => {
  res.sendFile(__dirname + '/public/js/common.js');
});

app.get('/programs', (req, res) => {
    res.sendFile(__dirname + '/public/html/programs.html');
});

app.get('/teachers', (req, res) => {
  res.sendFile(__dirname + '/public/html/teachers.html');
});

app.get('/plans', (req, res) => {
  res.sendFile(__dirname + '/public/html/plans.html');
});

app.get('/audiences', (req, res) => {
  res.sendFile(__dirname + '/public/html/audiences.html');
});

app.get('/groups', (req, res) => {
  res.sendFile(__dirname + '/public/html/groups.html');
});

app.get('/auth', (req, res) => {
  res.sendFile(__dirname + '/public/html/auth.html');
});

app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}`);
});

