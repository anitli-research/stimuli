// index.js
const express = require('express');

const mysql = require('mysql2/promise');
const bodyParser = require('body-parser')
const multer = require('multer')
const ftpStorage = require('multer-ftp')
const { Client } = require("basic-ftp")
const cors = require('cors');


var dbpool = mysql.createPool({
  connectionLimit: 10,
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PWD,
  database: process.env.DB_NAME,
  waitForConnections: true,
});

const ftpCred = {
  host: process.env.FTP_HOST,
  user: process.env.FTP_USER,
  password: process.env.FTP_PWD,
  secure: false,
};

var storage = new ftpStorage({
  basepath: '/stimuli/',
  ftp: ftpCred,
  destination: function (req, file, options, callback) {
    const name = `${req.params["poolId"]}/${file.originalname}`
    callback(null, name)
  },
});

const upload = multer({ storage: storage });

const app = express();
app.use(cors());

app.use(bodyParser.json());

const port = process.env.PORT || 3001;

app.get('/api', (req, res) => {
  res.send(`<h5 style="color:green">Hello from a vercel function, and with hot reload!</h5>`)})


app.get("/experiment/", upload.none(), async (req, res) => {
  console.log(`GET /experiment/ Get experiments`);
  const q = `SELECT * FROM experiments;`
  const values = []

  const [rows, fields] = await dbpool.query(q, values).catch(e => {
    console.log(e);
    res.status(400).send(e.message);
    return;
  });
  res.json(rows);
});

  app.listen(8080, () => {
  console.log('Server started at http://localhost:8080')
})
module.exports = app