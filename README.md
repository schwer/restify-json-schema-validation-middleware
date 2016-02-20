# restify-json-schema-validation-middleware

Middleware to validate incoming requests using json schema and respond with [restify](https://github.com/restify/node-restify) error. Inspired by [json-schema-validation-middleware](https://github.com/jwoudenberg/json-schema-validation-middleware). Based on [tv4](https://github.com/geraintluff/tv4) and [tv4-formats](https:////github.com/ikr/tv4-formats).

## Usage

### Partial request validation

```JavaScript
const validator = require( 'restify-json-schema-validation-middleware' )();

const headersSchema = { type: 'object' };
const bodySchema = { type: 'object' };
const querySchema = { type: 'object' };
const paramsSchema = { type: 'object' };

server.post(
    '/path',
    validator.headers( headersSchema ),
    validator.body( bodySchema ),
    validator.query( querySchema ),
    validator.params( paramsSchema ),
    function( req, res, next ) {
        ...
    }
);
```

### Full request validation

```JavaScript
const validator = require( 'restify-json-schema-validation-middleware' )();

const schema = {
    type: 'object',
    properties: {
        headers: { type: 'object' },
        body: { type: 'object' },
        query: { type: 'object' }
        params: { type: 'object' }
    },
    required: [ 'headers' ]
};

server.post(
    '/path',
    validator( schema ),
    function( req, res, next ) {
        ...
    }
);
```

## Options

`banUnknownProperties`: boolean of whether or not to ban unknown properties
 
```JavaScript
const validator = require( 'restify-json-schema-validation-middleware' )( {
    banUnknownProperties: true
} );
```
