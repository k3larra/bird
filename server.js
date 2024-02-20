const express = require('express');
const session = require('express-session');
const app = express();
const port = 80;

app.use(express.static('./'));

// Add session middleware
app.use(session({
  secret: '7f190520-cf46-4270-b62b-2c307e600b97',
  resave: false,
  saveUninitialized: true
}));

app.listen(port, '0.0.0.0', function () {
  console.log('Server running at http://0.0.0.0:80');
});