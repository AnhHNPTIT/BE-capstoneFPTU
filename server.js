const express = require('express');
require('dotenv').config()
const cors = require('cors');
var cookies = require("cookie-parser");
const path = require("path");
const http = require('http');
const multer = require('multer');
const { Server } = require("socket.io");
const { corsConfig } = require('./src/cors/serverCors')
var app = express();
const authorizeUser = require("./src/socketio/authSocket")
const SocketServer = require("./src/socketio/socketServer");
const morgan = require('morgan');
app.use(express.json());

const redis = require("redis");
const { createClient } = redis;
const createAdapter = require("@socket.io/redis-adapter").createAdapter;


app.use(cookies());
app.use(cors(corsConfig));
app.use(morgan('dev'));
const mongoose = require('mongoose');
const URI = process.env.DATABASE_URL
// const blockedUserAgents = ['Postman', 'postman'];

// app.use((req, res, next) => {
//   const userAgent = req.get('user-agent');
//   if (blockedUserAgents.some(agent => userAgent.includes(agent))) {
//     res.status(403).send('Access forbidden Post man');
//   } else { 
//     next();
//   }
// });

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

// socket
const server = http.createServer(app);
// const io = new Server(server, {
//   cors: {
//     origin: `${process.env.CLIENT_URL}`,
//     credentials: true
//   }
// })


const io = new Server(server, {
  cors: {
    origin: true,
    credentials: true
  }
})

const initializeRedisAdapter = async () => {
  const pubClient = createClient({ url: "redis://127.0.0.1:6379" });
  await pubClient.connect();
  const subClient = pubClient.duplicate();
  io.adapter(createAdapter(pubClient, subClient)); 
};

initializeRedisAdapter()

io.use(authorizeUser).on('connection', (socket) => {
  SocketServer(socket , io)
});


app.use("/api", require('./src/routes/user'))
app.use("/api", require('./src/routes/project'))
app.use("/api", require('./src/routes/contract'))

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'src')));

// Additional static folder for images 
app.use('/img', express.static(path.join(__dirname, 'src/uploads')));


app.get('/', function (req, res) {
  res.send('Hello World!');
});
const port = process.env.PORT || 8000

server.listen(port, () => console.log(`Example app listening on port ${port}!`))