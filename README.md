# restify-json-schema-validation-middleware

Middleware to validate incoming requests using json schema and respond with [restify](https://github.com/restify/node-restify) error. Inspired by [json-schema-validation-middleware](https://github.com/jwoudenberg/json-schema-validation-middleware). Based on [tv4](https://github.com/geraintluff/tv4) and [tv4-formats](https:////github.com/ikr/tv4-formats).

## Usage

```JavaScript
const validator = require( 'restify-json-schema-validation-middleware' )();

const sampleSchema = {
    type: 'object',
    properties: {
        body: { type: 'object' }
    },
    required: [ 'body' ]
};

server.post( '/path', validator( sampleSchema ), function( req, res, next ) { /* */ } );
```

You can pass optional global config object:
```JavaScript
const validator = require( 'restify-json-schema-validation-middleware' )( config );
```

Or optional one-time options:
```JavaScript
server.post( '/path', validator( sampleSchema, options ), function( req, res, next ) { /* */ } );
```

## Config and Options
Both `config` and `options` have the same properties, but if some property is provided in `options`, it overrides corresponding one from `config`.

* `errorHandler`: Instead of responding with an error, library will call custom callback `errorHandler( formattedError, rawError, res, next )`.
* `errorClass`: Error class to be used instead of default `restify.BadRequestError` class. Must take `message` as the first constructor parameter.
* `checkOnly`: Takes specified property (can be path) from the request object and performs check against it.
* `addMessageFormatters`: Adds and/or overrides some of the existing error formatters.
* `replaceMessageFormatters`: Removes all the existing error formatters and replaces them with the provided ones.
* `embedValidationError`: Embeds raw validation error into the error response.
* `embedValidationErrorCode`: Embeds validation error code into the error response.

See tests for more examples.