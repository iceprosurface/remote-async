## why

This is a lib for use promise under the protocol like socket(just like a normal request under http)

.It has been specified a simple format between service and use a system like Subscribers - Publishers to get update)

The server can be use under any protocol like socket，web worker event .etc

## how to use

```javascript
// server
var io = require('socket.io')(http);
var Server = require('@platform/remote-async');
const serverMain = new Server();
io.on('connection', (socket) => {
  serverMain.registerSender((data) => io.emit('async-data', data));
  serverMain.listen('do-something', (d, resolve, reject) => {
    if (d.a === 1) {
      resolve({ b: 2 });
    } else {
      reject({ c: 1 });
    }
  });
});
```

```javascript
// client
import Server from '@platform/remote-async';
const serverClient = new Server();
const socket = io();
socket.on('connection', (socket) => {
    socket.on('async-data', (data) => {
        serverClient.receiveData(data);
    });
    serverClient.registerSender((data) => socket.emit('async-data', data));
    // do a promise
    serverClient.registerPromise('do-something', {a, 1})
        .then((d) => {
            // it will return here
            console.log(d);
            // {b: 2}
        })
    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
});
```
