import { PROMISE_TYPE, Server } from "../src";

describe("remoteAsync:server to server", () => {
  const serverSub = new Server();
  const serverMain = new Server();

  const passDataToSub = (data: any) => serverSub.receiveData(data);
  const passDataToMain = (data: any) => serverMain.receiveData(data);

  serverMain.registerSender(passDataToSub);
  serverSub.registerSender(passDataToMain);

  test("pass {a: 1} from sub to main and resolve {b:2} by target:`c`", async () => {
    const sendO = { a: 1 };
    const returnO = { b: 2 };
    serverMain.listen("c", (d, resolve) => {
      expect(d).toEqual(sendO);
      resolve(returnO);
    });
    const ret = await serverSub.registerPromise("c", sendO);
    expect(ret).toEqual(returnO);
  });
  test("pass {a: 1} from sub to main and reject {b:2} by target:`c`", async () => {
    const sendO = { a: 1 };
    const returnO = { b: 2 };
    serverMain.listen("c", (d, _, reject) => {
      expect(d).toEqual(sendO);
      reject(returnO);
    });
    const ret = await serverSub
      .registerPromise("c", sendO)
      .catch((d) => Promise.resolve(d));
    expect(ret).toEqual(returnO);
  });
  test("pass undefined | null from sub to main and resolve {} by target: `d`", async () => {
    serverMain.listen("d", (d, resolve) => resolve(d));
    const sendO: null = null;
    const returnO = {};
    const ret0 = await serverSub.registerPromise("d", sendO);
    expect(ret0).toEqual(returnO);
    const send1: undefined = undefined;
    const return1 = {};
    const ret1 = await serverSub.registerPromise("d", send1);
    expect(ret1).toEqual(return1);
    serverMain.off("d")
  })
  test("pass number from sub to main and resolve number by target: `e`", async () => {
    serverMain.listen("e", (d, resolve) => resolve(d));
    const sendO: number = 0;
    const ret0 = await serverSub.registerPromise("e", sendO);
    expect(ret0).toEqual(sendO);
    const send1: number = 1;
    const ret1 = await serverSub.registerPromise("e", send1);
    expect(ret1).toEqual(send1);
    const send2: number = 2;
    const ret2 = await serverSub.registerPromise("e", send2);
    expect(ret2).toEqual(send2);
    serverMain.off("e")
  })
  test("sending error PROMISE_TYPE.pending", () => {
    return new Promise((resolve) => {
      window.console.error = (t) => {
        expect(t).toBe(
          "[async-remote] server should never get pending, check receive function is correct or not."
        );
        resolve();
      };
      serverMain.listen("c2", (a, b, c, remoteData) => {
        serverMain.sender({
          data: JSON.stringify({ v: 1 }),
          promiseType: PROMISE_TYPE.pending,
          uuid: remoteData.uuid,
        });
      });
      serverSub.registerPromise("c2", { a: 1 }).catch((d) => Promise.resolve(d));
    });
  });
});
