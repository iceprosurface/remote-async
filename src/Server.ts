import { uuidv4 } from './utils';
import { PROMISE_TYPE } from './promiseType';
import { RemoteAsyncObject } from './RemoteAsyncObject';
export interface RemoteData {
  uuid: string;
  promiseType: PROMISE_TYPE;
  data: string;
  target?: string;
}
export type RemoteCallBack = (
  data: any,
  resolve?: (ret: any) => void,
  reject?: (ret: any) => void,
  remoteData?: RemoteData,
) => any;
export class Server {
  protected promiseMap: {
    [key: string]: RemoteAsyncObject<any>;
  } = {};
  protected get dataParser() {
    return JSON.parse;
  }
  protected get dataStringify() {
    return JSON.stringify;
  }
  /**
   * Receive a remote data from another server.
   */
  receiveData(data: RemoteData) {
    if (data.target) {
      this.emit(data.target, data, this.dataParser(data.data));
    } else if (this.promiseMap[data.uuid]) {
      this.promiseMap[data.uuid].judge(data, this.dataParser);
      this.promiseMap[data.uuid] = null;
      delete this.promiseMap[data.uuid];
    }
  }
  private emit(target: string, remoteData: RemoteData, data: any) {
    this.listeners[target]?.forEach((fn) => {
      const sendTo = (ret: any, promiseType: PROMISE_TYPE) => {
        this.sender({
          promiseType,
          uuid: remoteData.uuid,
          data: this.dataStringify(ret),
        });
      };
      fn(
        data,
        (ret: any) => sendTo(ret, PROMISE_TYPE.resolve),
        (ret: any) => sendTo(ret, PROMISE_TYPE.reject),
        remoteData,
      );
    });
  }

  public listeners: {
    [key: string]: RemoteCallBack[];
  } = {};

  /**
   * When `receiveData` was called by any conditions,
   * It add a listener on `target` path,
   * then path will call `callback`
   */
  listen(target: string, callback: RemoteCallBack) {
    let data = this.listeners[target];
    if (!data) {
      data = this.listeners[target] = [];
    }
    if (data.indexOf(callback) === -1) {
      this.listeners[target].push(callback);
    }
  }
  /**
   * Remove listener on target.
   * This will remove all callbacks when callback params was not set.
   */
  off(target: string, callback?: any) {
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
  /**
   * you should override this to adapt other environment
   */
  sender: (data: RemoteData) => void = () =>
    console.warn('[async remote]: you should add a sender to send data to remote;');

  registerSender(sender: (data: RemoteData) => void) {
    this.sender = sender;
  }
  /**
   * Register a promise and pass to anther server which listen `target` path.
   */
  registerPromise<T = any, Payload = any>(target: string, data?: Payload): Promise<T> {
    const uuid = uuidv4();
    let resolver: (value: T | PromiseLike<T>) => void = () => {};
    let ejector = () => {};
    const promise = new Promise<T>((resolve, reject) => {
      resolver = resolve;
      ejector = reject;
    });
    this.promiseMap[uuid] = new RemoteAsyncObject(uuid, promise, ejector, resolver);
    this.sender({
      promiseType: PROMISE_TYPE.pending,
      uuid,
      data: this.dataStringify(typeof data === 'undefined' || data === null ? {} : data),
      target,
    });
    return promise;
  }
}
