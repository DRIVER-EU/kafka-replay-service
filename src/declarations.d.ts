declare module 'package.json' {
  const foo: {
    name: string;
    version: string;
    author: string;
    license: string;
    description: string;
  };
  export = foo;
}

declare module '*.json' {
  const foo: any;
  export = foo;
}
