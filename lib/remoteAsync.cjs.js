'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

(function (PROMISE_TYPE) {
    PROMISE_TYPE[PROMISE_TYPE["pending"] = 0] = "pending";
    PROMISE_TYPE[PROMISE_TYPE["resolve"] = 1] = "resolve";
    PROMISE_TYPE[PROMISE_TYPE["reject"] = 2] = "reject";
})(exports.PROMISE_TYPE || (exports.PROMISE_TYPE = {}));

class RemoteAsyncObject {
    constructor(guid, promise, eject, resolve) {
        this.guid = guid;
        this.promise = promise;
        this.eject = eject;
        this.resolve = resolve;
        this.promiseType = exports.PROMISE_TYPE.pending;
    }
    judge(data, parser) {
        this.promiseType = data.promiseType;
        const d = parser(data.data);
        switch (this.promiseType) {
            case exports.PROMISE_TYPE.pending:
                console.error("[async-remote] server should never get pending, check receive function is correct or not.");
                break;
            case exports.PROMISE_TYPE.reject:
                this.eject(d);
                break;
            case exports.PROMISE_TYPE.resolve:
                this.resolve(d);
                break;
        }
    }
}

function uuidv4() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
        const r = (Math.random() * 16) | 0, v = c == "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

class Server {
    constructor() {
        this.promiseMap = {};
        this.listeners = {};
        this.sender = () => console.warn("[async remote]: u should add a sender to send data to remote;");
    }
    get dataParser() {
        return JSON.parse;
    }
    get dataStringify() {
        return JSON.stringify;
    }
    receiveData(data) {
        if (data.target) {
            this.emit(data.target, data, this.dataParser(data.data));
        }
        else if (this.promiseMap[data.uuid]) {
            this.promiseMap[data.uuid].judge(data, this.dataParser);
            this.promiseMap[data.uuid] = null;
            delete this.promiseMap[data.uuid];
        }
    }
    emit(target, remoteData, data) {
        var _a;
        (_a = this.listeners[target]) === null || _a === void 0 ? void 0 : _a.forEach((fn) => {
            const sendTo = (ret, promiseType) => {
                this.sender({
                    promiseType,
                    uuid: remoteData.uuid,
                    data: this.dataStringify(ret),
                });
            };
            fn(data, (ret) => sendTo(ret, exports.PROMISE_TYPE.resolve), (ret) => sendTo(ret, exports.PROMISE_TYPE.reject), remoteData);
        });
    }
    listen(target, callback) {
        let data = this.listeners[target];
        if (!data) {
            data = this.listeners[target] = [];
        }
        if (data.indexOf(callback) === -1) {
            this.listeners[target].push(callback);
        }
    }
    off(target, callback) {
        let data = this.listeners[target];
        if (data) {
            if (!callback) {
                this.listeners[target] = [];
            }
            let index = data.indexOf(callback);
            if (index >= 0) {
                this.listeners[target].splice(index, 1);
            }
        }
    }
    registerSender(sender) {
        this.sender = sender;
    }
    registerPromise(target, data) {
        const uuid = uuidv4();
        let resolver = () => { };
        let ejector = () => { };
        const promise = new Promise((resolve, reject) => {
            resolver = resolve;
            ejector = reject;
        });
        this.promiseMap[uuid] = new RemoteAsyncObject(uuid, promise, ejector, resolver);
        this.sender({
            promiseType: exports.PROMISE_TYPE.pending,
            uuid,
            data: this.dataStringify(data),
            target,
        });
        return promise;
    }
}

exports.RemoteAsyncObject = RemoteAsyncObject;
exports.Server = Server;
