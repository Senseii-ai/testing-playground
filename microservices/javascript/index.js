const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.json({ message: 'Hello world this is realll' });
});

app.listen(9090, () => {
  console.log('Server running on port 9090');
});
