import { Server } from '../src';
import { PROMISE_TYPE } from '../src/promiseType';

describe('remoteAsync:inner test', () => {
  test('no sender', async () => {
    window.console.warn = (t) => {
      expect(t).toBe('[async remote]: you should add a sender to send data to remote;');
    };
    const listener = new Server();
    listener.registerPromise('dataSend', { a: 1 });
  });
  test('register a promise & receiveData', async () => {
    const listener = new Server();
    const object = { a: 1 };
    const retObject = { b: 2 };
    let count = 1;
    // sender
    listener.registerSender((data) => {
      expect(data.data).toEqual(JSON.stringify(object));
      expect(count).toBe(2);
      count++;
      // pass data to receive
      setTimeout(() => {
        listener.receiveData({
          data: JSON.stringify(retObject),
          promiseType: PROMISE_TYPE.resolve,
          uuid: data.uuid,
        });
      }, 50);
    });
    count++;
    let returnedValue = await listener.registerPromise('dataSend', object);
    expect(count).toBe(3);
    expect(returnedValue).toEqual(retObject);
  });

  test('timeout', async () => {
    const defer = (time: number) => new Promise((resolve) => setTimeout(resolve, time));
    const listener = new Server({ timeout: 5 });
    listener.registerSender(() => {});
    await expect(() => listener.registerPromise('dataSend', { a: 1 })).rejects.toThrowError('ErrorTimeout');
    await expect(
      Promise.race([listener.registerPromise('dataSend', { a: 2 }, { timeout: 20 }), defer(30)]),
    ).rejects.toThrowError('ErrorTimeout');
  });

  test('reject data', async () => {
    const listener = new Server();
    const object = { a: 1 };
    let retObject = { b: 2 };

    listener.registerSender((data) => {
      setTimeout(() => {
        listener.receiveData({
          data: JSON.stringify(retObject),
          promiseType: PROMISE_TYPE.reject,
          uuid: data.uuid,
        });
      }, 50);
    });
    const retData = await listener.registerPromise('dataSend', object).catch((d) => Promise.resolve({ v: 1, d }));
    expect(retData).toEqual({ v: 1, d: retObject });
  });
  test('off cb', async () => {
    const listener = new Server();
    const cb1 = () => 'k';
    const cb2 = () => 'g';
    listener.listen('k', cb1);
    expect(listener.listeners.k[0]).toBe(cb1);
    listener.off('k', cb1);
    listener.listen('k', cb1);
    listener.listen('k', cb2);
    expect(listener.listeners.k.length).toBe(2);
    listener.off('k');
    expect(listener.listeners.k.length).toBe(0);
  });
});
