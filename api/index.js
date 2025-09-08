// index.js
const express = require('express')
const app = express()
app.get('/api', (req, res) => {
  res.send(`<h5 style="color:green">Hello from a vercel function!</h5>`)})
app.listen(8080, () => {
  console.log('Server started at http://localhost:8080')
})
module.exports = app