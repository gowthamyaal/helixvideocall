
const express = require('express');
var appExp = express();
const app = require('http').createServer(appExp);
const io = require('socket.io');
const bodyParser = require("body-parser");
const userIds = {};
const noop = () => {};
var docId="";
appExp.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-type,Authorization");
  next();
});

appExp.use(bodyParser.json({ limit: "50mb", extended: true }));
appExp.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));
appExp.use('/', express.static(`${process.cwd()}/../client`));
appExp.post("/id",(req, res)=> {
  const { id } = req.body;
  docId="Video-Call-"+id;
    res.json({
        msg: "true"
      });
});

//config.PORT = process.env.PORT || 5000;

function sendTo(to, done, fail) {
  const receiver = userIds[to];
  if (receiver) {
    const next = typeof done === 'function' ? done : noop;
    next(receiver);
  } else {
    const next = typeof fail === 'function' ? fail : noop;
    next();
  }
}
function initSocket(socket) {
  let id;
  socket
    .on('init', () => {
        id = docId;
        userIds[id] = socket;
        socket.emit('init', { id });
    })
    .on('request', (data) => {
      sendTo(data.to, to => to.emit('request', { from: id }));
    })
    .on('call', (data) => {
      sendTo(
        data.to,
        to => to.emit('call', { ...data, from: id }),
        () => socket.emit('failed')
      );
    })
    .on('end', (data) => {
      sendTo(data.to, to => to.emit('end'));
    })
    .on('disconnect', () => {
      delete userIds[id];
      console.log(id, 'disconnected');
    });

  return socket;
}
app.listen(5000,'localhost', () => {
  // eslint-disable-next-line
  console.log(`Magic happens on port 5000`);
   io.listen(app, { log: true })
    .on('connection', initSocket);
});

//server.run(config, docId);
