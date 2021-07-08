import { RemoteData } from './Server';
import { PROMISE_TYPE } from './promiseType';

export class RemoteAsyncObject<T> {
  public promiseType: PROMISE_TYPE = PROMISE_TYPE.pending;
  constructor(
    public guid: string,
    public promise: Promise<T>,
    private readonly eject: (d: any) => any,
    private readonly resolve: (d: any) => any,
  ) {}

  judge(data: RemoteData, parser: (k: any) => any) {
    this.promiseType = data.promiseType;
    const d = parser(data.data);
    switch (this.promiseType) {
      case PROMISE_TYPE.pending:
        console.error('[async-remote] server should never get pending, check receive function is correct or not.');
        break;
      case PROMISE_TYPE.reject:
        this.eject(d);
        break;
      case PROMISE_TYPE.resolve:
        this.resolve(d);
        break;
    }
  }
}
