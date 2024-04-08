## remote async

[![Build Status](https://github.com/iceprosurface/remote-async/actions/workflows/merge.yml/badge.svg)](https://github.com/iceprosurface/remote-async/actions/workflows/merge.yml) [![codecov](https://codecov.io/gh/iceprosurface/remote-async/branch/master/graph/badge.svg)](https://codecov.io/gh/iceprosurface/remote-async)

## Installation

```
# Using npm
npm i remote-async
# Using yarn
yarn add remote-async
# Using pnpm
pnpm add remote-async
```

## Why use remote-async?

This library allows the use of promises over protocols like sockets (similar to a standard HTTP request).

It utilizes a simple format for communication between services and employs a Subscribers-Publishers system for updates.

The server can operate over any protocol, such as sockets, web workers, events, etc.


## Usage

### iframe event


```ts
import { Server } from "remote-async";
export const ServerClient = new Server();
const iframe = document.getElementById('iframe')
const ORIGIN = 'some-origin'
window.addEventListener('message', (event) => {
  if ((event.origin || event.originalEvent.origin) !== ORIGIN) {
    // For security reasons, the host must match.
    return;
  }
  if (event.data.type === 'promise') {
    ServerClient.receiveData(event.data.data);
  }
}, false);
ServerClient.registerSender((data) => {
  iframe.contentWindow?.postMessage({ data, type: 'promise' }, ORIGIN)
})

ServerClient.listen('anything', (data, resolve, reject) => {
  // Perform any action.
})
ServerClient.registerPromise('do-something')
```

The script should be identical to the previous code within the iframe. After this, the protocol facilitates full duplex communication via postMessage

### Figma plugin

Usage within a Figma plugin is similar to that of iframe events.

```ts
// message front
import { Server } from "remote-async";
export const ServerClient = new Server();
ServerClient.registerSender((data) =>
  parent.postMessage(
    {
      pluginMessage: {
        type: "promise",
        data,
      },
    },
    "*"
  )
);

window && (window.onmessage = (event) => {
  const message = event.data.pluginMessage;
  if (message.type === "promise") {
    ServerClient.receiveData(message.data);
  }
});

ServerClient.registerPromise('do-something');
```

```ts
// Field `main` in manifest.json 
export const serverMain = new Server();
serverMain.registerSender((data) => {
  figma.ui.postMessage({
    type: "promise",
    data: data,
  });
});

figma.ui.onmessage = (message) => {
  if (message.type === "promise") {
    serverMain.receiveData(message.data);
  }
};
// Listen for events from the front.
serverMain.listen('do something', async (data, resolve, reject) => {
  // Perform any action.
});
```

### qiankun

qiankun does not have native events for communication, but we can use onGlobalStateChange and setGlobalState to simulate events.

```javascript
// main/index.js
import { Server } from 'remote-async';
const { onGlobalStateChange, setGlobalState } = initGlobalState({
  user: 'qiankun',
  asyncData: {},
});

const serverMain = new Server();
serverMain.listen('do-something', (d, resolve, reject) => {
  // If client sends data { a: 1}, send resolve({ b: 2 })
  if (d.a === 1) {
    resolve({ b: 2 });
  } else {
    reject({ c: 1 });
  }
});
serverMain.registerSender((data) => {
  // Define where to send data to the client.
  setGlobalState({ asyncData: data });
});

onGlobalStateChange((value, prev) => {
  // Define where to receive data from the client.
  serverMain.receiveData(value.asyncData);
});
```

```javascript
// Single spa
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
// To use in any Vue component
export default {
  methods: {
      async click() {
        // Similar to using axios
        const data = await ServerClient.registerPromise('do-something', { a: 1 });
        // Should return {b: 2}
        console.log(data);
      },
  }
}

```
### socket

```javascript
// Server
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
// Client
import { Server } from 'remote-async';
const serverClient = new Server();
const socket = io();
socket.on('connection', (socket) => {
    socket.on('async-data', (data) => {
        serverClient.receiveData(data);
    });
    serverClient.registerSender((data) => socket.emit('async-data', data));
    // Execute a promise.
    serverClient.registerPromise('do-something', {a: 1})
        .then((d) => {
            // It will return here.
            console.log(d);
            // Should be {b: 2}.
        })
    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
});
```


## Api Reference

### constructor(setting: { timeout: number })

`timeout`: Default timeout setting.

### Server.receiveData(data: RemoteData)

Receive a remote data from another server.


### Server.listen(target: string, callback: RemoteCallBack)

Add a listener on `target` path, which will call `callback` when `receiveData` is invoked under any circumstances.

### Server.off(target: string, callback?: any)

Remove listener on target. This will remove all callbacks when the callback parameter is not set.

### Server.registerPromise(target: string, data: any, option: { timeout: number })

Registers a promise and sends it to another server listening on the `target` path.


### Server.registerSender(sender: (data: RemoteData) => void)

Defines how the server sender should pass a promise to another server.

