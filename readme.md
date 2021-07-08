## remote async

[![Build Status](https://github.com/iceprosurface/remote-async/actions/workflows/merge.yml/badge.svg)](https://github.com/iceprosurface/remote-async/actions/workflows/merge.yml) [![codecov](https://codecov.io/gh/iceprosurface/remote-async/branch/master/graph/badge.svg)](https://codecov.io/gh/iceprosurface/remote-async)

## install

```
# npm
npm i remote-async
# yarn
yarn add remote-async
```

## why

This is a lib for using promise under the protocol like socket(just like a normal request under http).

It has been specified a simple format between service and use a system like Subscribers - Publishers to get update)

The server can be use under any protocol like socket, web worker event etc.


## how to use

### qiankun

```javascript
// main/index.js
import { Server } from 'remote-async';
const { onGlobalStateChange, setGlobalState } = initGlobalState({
  user: 'qiankun',
  asyncData: {},
});

const serverMain = new Server();
serverMain.listen('do-something', (d, resolve, reject) => {
  // if client send data { a: 1}, send resolve({ b:2 })
  if (d.a === 1) {
    resolve({ b: 2 });
  } else {
    reject({ c: 1 });
  }
});
serverMain.registerSender((data) => {
  // define where to send data to client
  setGlobalState({ asyncData: data });
});

onGlobalStateChange((value, prev) => {
  // define where to receiveData from client
  serverMain.receiveData(value.asyncData);
});
```

```javascript
// single spa
export const ServerClient = new Server();
function storeTest(props) {
  if (props.onGlobalStateChange) {
    props.onGlobalStateChange((value, prev) => {
      ServerClient.receiveData(value.asyncData);
    }, true);
  }
  if (props.setGlobalState) {
    ServerClient.registerSender(data =>
      props.setGlobalState({
        asyncData: data,
      }),
    );
  }
  props.setGlobalState &&
    props.setGlobalState({
      ignore: props.name,
      user: {
        name: props.name,
      },
    });
}
// to use in any vue component
export default {
  methods: {
      async click() {
        // just like axios 
        const data = await ServerClient.registerPromise('do-something', { a: 1 });
        // should be {b: 2} 
        console.log(data);
      },
  }
}

```
### socket

```javascript
// server
var io = require('socket.io')(http);
var { Server } = require('remote-async');
const serverMain = new Server();
io.on('connection', (socket) => {
  socket.on('async-data', (d) => serverMain.receiveData(d));
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
import { Server } from 'remote-async';
const serverClient = new Server();
const socket = io();
socket.on('connection', (socket) => {
    socket.on('async-data', (data) => {
        serverClient.receiveData(data);
    });
    serverClient.registerSender((data) => socket.emit('async-data', data));
    // do a promise
    serverClient.registerPromise('do-something', {a: 1})
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


## Api Reference

### Server.receiveData(data: RemoteData)

Receive a remote data from another server.


### Server.listen(target: string, callback: RemoteCallBack)

Add a listener on `target` path, which will call `callback` when `receiveData` was called by any conditions.

### Server.off(target: string, callback?: any)

Remove listener on target. This will remove all callbacks when callback params was not set.

### Server.registerPromise(target: string, data: any)

Register a promise and pass to anther server which listen `target` path.


### Server.registerSender(sender: (data: RemoteData) => void)

Define the server sender how to pass a promise to another server

