const express = require('express');
const app = express();
const port = 80;

/* app.get('/', (req, res) => {
  res.send('Hello World!');
}); */

// Serve static files from the "local" directory
app.use(express.static('./'));

/* app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
}); */

app.listen(port, '0.0.0.0', function() {
  console.log('Server running at http://0.0.0.0:80');
});