type HTTPMethod = 'POST' | 'GET';
type HTTPStatus = 200 | 500;

interface User {
  name: string;
  age: number;
  roles: string[];
  createdAt: Date;
  isDeleted: boolean;
}

interface Request {
  method: HTTPMethod;
  host: string;
  path: string;
  body?: User;
  params?: Record<string, string>;
}

interface ObserverHandlers<T> {
  next?: (value: T) => void;
  error?: (error: unknown) => void;
  complete?: () => void;
}

class Observer<T> {
  private handlers: ObserverHandlers<T>;
  private isUnsubscribed: boolean = false;
  private _unsubscribe?: () => void;

  constructor(handlers: ObserverHandlers<T>) {
    this.handlers = handlers;
  }

  next(value: T): void {
    if (this.handlers.next && !this.isUnsubscribed) {
      this.handlers.next(value);
    }
  }

  error(error: unknown): void {
    if (!this.isUnsubscribed) {
      if (this.handlers.error) {
        this.handlers.error(error);
      }
      this.unsubscribe();
    }
  }

  complete(): void {
    if (!this.isUnsubscribed) {
      if (this.handlers.complete) {
        this.handlers.complete();
      }
      this.unsubscribe();
    }
  }

  unsubscribe(): void {
    this.isUnsubscribed = true;

    if (this._unsubscribe) {
      this._unsubscribe();
    }
  }

  setUnsubscribe(unsubscribe: () => void): void {
    this._unsubscribe = unsubscribe;
  }
}

class Observable<T> {
  private _subscribe: (observer: Observer<T>) => (() => void) | void;

  constructor(subscribe: (observer: Observer<T>) => (() => void) | void) {
    this._subscribe = subscribe;
  }

  static from<T>(values: T[]): Observable<T> {
    return new Observable((observer: Observer<T>) => {
      values.forEach((value) => observer.next(value));
      observer.complete();

      return () => {
        console.log('unsubscribed');
      };
    });
  }

  subscribe(handlers: ObserverHandlers<T>): { unsubscribe: () => void } {
    const observer = new Observer<T>(handlers);

    const unsubscribeFunction = this._subscribe(observer);
    if (unsubscribeFunction) {
      observer.setUnsubscribe(unsubscribeFunction);
    }

    return {
      unsubscribe: () => observer.unsubscribe(),
    };
  }
}

const HTTP_POST_METHOD: HTTPMethod = 'POST';
const HTTP_GET_METHOD: HTTPMethod = 'GET';

const HTTP_STATUS_OK: HTTPStatus = 200;
const HTTP_STATUS_INTERNAL_SERVER_ERROR: HTTPStatus = 500;

const userMock: User = {
  name: 'User Name',
  age: 26,
  roles: ['user', 'admin'],
  createdAt: new Date(),
  isDeleted: false,
};

const requestsMock: Request[] = [
  {
    method: HTTP_POST_METHOD,
    host: 'service.example',
    path: 'user',
    body: userMock,
    params: {},
  },
  {
    method: HTTP_GET_METHOD,
    host: 'service.example',
    path: 'user',
    params: { id: '3f5h67s4s' },
  },
];

const handleRequest = (request: Request): { status: HTTPStatus } => {
  console.log('Handling request:', request);
  return { status: HTTP_STATUS_OK };
};

const handleError = (error: unknown): { status: HTTPStatus } => {
  console.error('Error occurred:', error);
  return { status: HTTP_STATUS_INTERNAL_SERVER_ERROR };
};

const handleComplete = (): void => console.log('complete');

const requests$ = Observable.from(requestsMock);

const subscription = requests$.subscribe({
  next: handleRequest,
  error: handleError,
  complete: handleComplete,
});

subscription.unsubscribe();
