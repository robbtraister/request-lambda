# request-lambda

This package attempts to replicate the API for request, but for AWS lambda functions built with serverless-http.

## Usage

Basic usage is similar to the [request](https://www.npmjs.com/package/request) package, but requires an extra `FunctionName` param.

Default values are shown here:
```js
const request = require('request-lambda')

request(
  {
    FunctionName: '', // required
    Qualifier: '$LATEST',
    LogType: 'None',
    method: 'GET',
    uri: '', // required
    headers: {},
    body: null,
    gzip: false,
    json: false,
    resolveWillFullResponse: false,
    simple: true
  },
  (err, response) => {
    // ... handle the response here ...
  }
)
```

### Promises

Along with handling a callback function, the request call also returns a promise.

```js
const request = require('request-lambda')

request(
  {
    FunctionName: '', // required
    Qualifier: '$LATEST',
    LogType: 'None',
    method: 'GET',
    uri: '', // required
    headers: {},
    body: null,
    gzip: false,
    json: false,
    resolveWillFullResponse: false,
    simple: true
  }
)
  .then((response) => {
    // ... handle a successful response here ...
  })
  .catch((err) => {
    // ... handle an error here ...
  })
```

### Re-use

A `Lambda` closure can be used for repeated requests.

```js
const { Lambda } = require('request-lambda')

const lambda = Lambda({
    FunctionName: '', // required
    Qualifier: '$LATEST',
    LogType: 'None',
    gzip: false,
    json: false,
    resolveWillFullResponse: false,
    simple: true
})

lambda(
  {
    method: 'GET',
    uri: '', // required
    headers: {},
    body: null
  }
)
  .then((response) => {
    // ... handle a successful response here ...
  })
  .catch((err) => {
    // ... handle an error here ...
  })
```

When using the closure, note that `FunctionName`, `Qualifier`, and `LogType` are immutable. However, all other params may be passed to either the closure creation or the request call, with the request values taking precedence.

For example, `gzip` is `true` in the following request:
```js
const { Lambda } = require('request-lambda')

const lambda = Lambda({
    FunctionName: '', // required
    Qualifier: '$LATEST',
    LogType: 'None',
    gzip: false, // defaulted to false for all subsequent requests
    json: false,
    resolveWillFullResponse: false,
    simple: true
})

lambda(
  {
    method: 'GET',
    uri: '', // required
    headers: {},
    body: null,
    gzip: true // overridden for this request
  }
)
  .then((response) => {
    // ... handle a successful response here ...
  })
  .catch((err) => {
    // ... handle an error here ...
  })
```
