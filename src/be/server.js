const express = require('express');
require('dotenv').config()
const cors = require('cors');
var cookies = require("cookie-parser");
const path = require("path");
const multer = require('multer');
const { Server } = require("socket.io");
const { corsConfig } = require('./src/cors/serverCors')
var app = express();
app.use(express.json());
app.use(cookies());
app.use(cors(corsConfig));
const mongoose = require('mongoose');
const URI = process.env.DATABASE_URL
const blockedUserAgents = ['Postman', 'postman'];

app.use((req, res, next) => {
  const userAgent = req.get('user-agent');
  if (blockedUserAgents.some(agent => userAgent.includes(agent))) {
    res.status(403).send('Access forbidden Post man');
  } else { 
    next();
  }
});

mongoose.connect(URI, {
  useCreateIndex: true,
  useFindAndModify: false,
  useNewUrlParser: true,
  useUnifiedTopology: true
}, err => {
  if (err) throw err;
  console.log('Connected to MongoDB')
})

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});
const server = require("http").createServer(app);
const io = new Server(server, {
  cors: corsConfig,
});

app.use("/api", require('./src/routes/user'))
app.use("/api", require('./src/routes/project'))

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'src')));

// Additional static folder for images 
app.use('/img', express.static(path.join(__dirname, 'src/uploads')));


app.get('/', function (req, res) {
  res.send('Hello World!');
});
const port = process.env.PORT || 8000

server.listen(port, () => console.log(`Example app listening on port ${port}!`))