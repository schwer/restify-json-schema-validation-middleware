'use strict';

const _ = require( 'lodash' );
const restify = require( 'restify' );
const sinon = require( 'sinon' );

const errorMessageFormatter = require( '../lib/errorMessageFormatter.js' );
const middlewareLib = require( '../lib/middleware.js' );

// -----------------------------------------------------------------------------

const testSchema = {
    type: 'object',
    additionalProperties: false,
    properties: {
        test: { type: 'string' }
    },
    required: [ 'test' ]
};

class CustomError {

    constructor( message ) {
        this.message = message;
    }
}

class CustomError2 {

    constructor( message ) {
        this.message = message;
    }
}

function matchRestifyError( message, options ) {

    options = options || {};

    const body = {
        code: options.code || 'BadRequestError',
        message
    };

    if( options.validationErrorCode ) {
        body.validationErrorCode = options.validationErrorCode;
    }

    if( options.expectErrorEmbedded ) {
        body.validationError = sinon.match.instanceOf( Error );
    }

    return sinon.match.instanceOf( restify.HttpError ).and(
        sinon.match.has( 'body', body ) );
}

function matchCustomError( message, options ) {

    options = options || {};

    const data = {
        message
    };

    if( options.validationErrorCode ) {
        data.validationErrorCode = options.validationErrorCode;
    }

    if( options.expectErrorEmbedded ) {
        data.validationError = sinon.match.instanceOf( Error );
    }

    return sinon.match.instanceOf( options.errorClass || CustomError ).and(
        sinon.match( data )
    );
}

function matchRawError( message ) {

    const data = {
        message
    };

    return sinon.match.instanceOf( Error ).and(
        sinon.match( data )
    );
}

// -----------------------------------------------------------------------------

describe( 'middlewareTests', function() {

    describe( 'when no configuration or options passed', function() {

        describe( 'when data is valid', function() {
            it( 'should call next without error', function() {

                const req = {
                    test: 'test'
                };
                const next = sinon.spy();

                const middleware = middlewareLib()( testSchema );

                middleware( req, {}, next );

                sinon.assert.calledOnce( next );
                sinon.assert.neverCalledWith( next, sinon.match.instanceOf( restify.HttpError ) );
            } );
        } );

        describe( 'when data is invalid', function() {
            it( 'should call next without error', function() {

                const req = {};
                const next = sinon.spy();

                const middleware = middlewareLib()( testSchema );

                middleware( req, {}, next );

                sinon.assert.calledOnce( next );
                sinon.assert.calledWithExactly( next, matchRestifyError( 'missing required property: test' ) );
            } );
        } );
    } );

    // -------------------------------------------------------------------------

    describe( 'when configuration passed and', function() {

        describe( 'errorHandler passed', function() {
            it( 'should call errorHandler instead of next', function() {

                const req = {};
                const res = {};
                const next = sinon.spy();
                const errorHandler = sinon.spy();

                const config = {
                    errorHandler
                };

                const expectedRestifyMessage = 'missing required property: test';
                const expectedRawMessage = 'Missing required property: test';

                const middleware = middlewareLib( config )( testSchema );

                middleware( req, res, next );

                sinon.assert.callCount( next, 0 );
                sinon.assert.calledOnce( errorHandler );
                sinon.assert.calledWithExactly( errorHandler, matchRestifyError( expectedRestifyMessage ), matchRawError( expectedRawMessage ), res, next );
            } );
        } );

        describe( 'errorClass passed', function() {
            it( 'should return errorClass instead of restify error', function() {

                const req = {};
                const next = sinon.spy();

                const config = {
                    errorClass: CustomError
                };

                const expectedErrorMessage = 'missing required property: test';

                const middleware = middlewareLib( config )( testSchema );

                middleware( req, {}, next );

                sinon.assert.calledOnce( next );
                sinon.assert.calledWithExactly( next, matchCustomError( expectedErrorMessage ) );
            } );
        } );

        describe( 'embedValidationError passed', function() {
            it( 'should return validationError embedded to body', function() {

                const req = {};
                const next = sinon.spy();

                const config = {
                    embedValidationError: true
                };

                const expectedErrorMessage = 'missing required property: test';

                const middleware = middlewareLib( config )( testSchema );

                middleware( req, {}, next );

                sinon.assert.calledOnce( next );
                sinon.assert.calledWithExactly( next, matchRestifyError( expectedErrorMessage, { expectErrorEmbedded: true } ) );
            } );
        } );

        describe( 'embedValidationError passed along with errorClass', function() {
            it( 'should return validationError embedded to body and error should be an instance of errorClass', function() {

                const req = {};
                const next = sinon.spy();

                const config = {
                    errorClass: CustomError,
                    embedValidationError: true
                };

                const expectedErrorMessage = 'missing required property: test';

                const middleware = middlewareLib( config )( testSchema );

                middleware( req, {}, next );

                sinon.assert.calledOnce( next );
                sinon.assert.calledWithExactly( next, matchCustomError( expectedErrorMessage, { expectErrorEmbedded: true } ) );
            } );
        } );

        describe( 'embedValidationErrorCode passed', function() {
            it( 'should return validationErrorCode embedded to body', function() {

                const req = {};
                const next = sinon.spy();

                const config = {
                    embedValidationErrorCode: true
                };

                const expectedErrorMessage = 'missing required property: test';

                const middleware = middlewareLib( config )( testSchema );

                middleware( req, {}, next );

                sinon.assert.calledOnce( next );
                sinon.assert.calledWithExactly( next, matchRestifyError( expectedErrorMessage, { validationErrorCode: 'OBJECT_REQUIRED' } ) );
            } );
        } );

        describe( 'embedValidationErrorCode passed along with errorClass', function() {
            it( 'should return validationErrorCode embedded to body and error should be an instance of errorClass', function() {

                const req = {};
                const next = sinon.spy();

                const config = {
                    errorClass: CustomError,
                    embedValidationErrorCode: true
                };

                const expectedErrorMessage = 'missing required property: test';

                const middleware = middlewareLib( config )( testSchema );

                middleware( req, {}, next );

                sinon.assert.calledOnce( next );
                sinon.assert.calledWithExactly( next, matchCustomError( expectedErrorMessage, { validationErrorCode: 'OBJECT_REQUIRED' } ) );
            } );
        } );

        describe( 'replaceMessageFormatters passed', function() {

            var messageFormatters;

            before( function() {
                messageFormatters = _.clone( errorMessageFormatter.getFormatters() );
            } );

            after( function() {
                errorMessageFormatter.replaceFormatters( messageFormatters );
            } );

            it( 'should return error message, formatted using custom formatter, and not defined formatters should be erased', function() {

                const next = sinon.spy();

                const config = {
                    replaceMessageFormatters: {
                        OBJECT_REQUIRED: () => {
                            return 'patched';
                        }
                    }
                };

                const middleware = middlewareLib( config )( testSchema );

                middleware( {}, {}, next );

                sinon.assert.calledOnce( next );
                sinon.assert.calledWithExactly( next, matchRestifyError( 'patched' ) );

                next.reset();

                middleware( { test: '', test2: 'test2' }, {}, next );

                sinon.assert.calledOnce( next );
                sinon.assert.calledWithExactly( next, matchRestifyError( 'additional properties not allowed: test2' ) );
            } );
        } );

        describe( 'addMessageFormatters passed', function() {

            var messageFormatters;

            before( function() {
                messageFormatters = _.clone( errorMessageFormatter.getFormatters() );
            } );

            after( function() {
                errorMessageFormatter.replaceFormatters( messageFormatters );
            } );

            it( 'should return error message, formatted using custom formatter, but other formatters should not be changed', function() {

                const next = sinon.spy();

                const config = {
                    addMessageFormatters: {
                        OBJECT_REQUIRED: () => {
                            return 'patched';
                        }
                    }
                };

                const middleware = middlewareLib( config )( testSchema );

                middleware( {}, {}, next );

                sinon.assert.calledOnce( next );
                sinon.assert.calledWithExactly( next, matchRestifyError( 'patched' ) );

                next.reset();

                middleware( { test: '', test2: 'test2' }, {}, next );

                sinon.assert.calledOnce( next );
                sinon.assert.calledWithExactly( next, matchRestifyError( 'additional properties not allowed: test2' ) );
            } );
        } );

        describe( 'checkOnly passed', function() {
            it( 'should return error message, formatted using custom formatter, but other formatters should not be changed', function() {

                const req = {
                    body: {
                        test: 'test',
                        test2: ''
                    }
                };
                const next = sinon.spy();

                const config = {
                    checkOnly: 'body'
                };

                const middleware = middlewareLib( config )( testSchema );

                middleware( req, {}, next );

                sinon.assert.calledOnce( next );
                sinon.assert.calledWithExactly( next, matchRestifyError( 'additional properties not allowed: test2' ) );
            } );
        } );
    } );

    // -------------------------------------------------------------------------

    describe( 'when both configuration and options passed and', function() {

        describe( 'errorHandler passed', function() {
            it( 'should call options\' errorHandler instead of next', function() {

                const req = {};
                const res = {};
                const next = sinon.spy();
                const errorHandlerConfig = sinon.spy();
                const errorHandlerOptions = sinon.spy();

                const config = {
                    errorHandler: errorHandlerConfig
                };

                const options = {
                    errorHandler: errorHandlerOptions
                };

                const expectedRestifyMessage = 'missing required property: test';
                const expectedRawMessage = 'Missing required property: test';

                const middleware = middlewareLib( config )( testSchema, options );

                middleware( req, res, next );

                sinon.assert.callCount( next, 0 );
                sinon.assert.callCount( errorHandlerConfig, 0 );
                sinon.assert.calledOnce( errorHandlerOptions );
                sinon.assert.calledWithExactly( errorHandlerOptions, matchRestifyError( expectedRestifyMessage ), matchRawError( expectedRawMessage ), res, next );
            } );
        } );

        describe( 'errorClass passed', function() {
            it( 'should return options\' errorClass instead of restify error', function() {

                const req = {};
                const next = sinon.spy();

                const config = {
                    errorClass: CustomError
                };

                const options = {
                    errorClass: CustomError2
                };

                const expectedErrorMessage = 'missing required property: test';

                const middleware = middlewareLib( config )( testSchema, options );

                middleware( req, {}, next );

                sinon.assert.calledOnce( next );
                sinon.assert.calledWithExactly( next, matchCustomError( expectedErrorMessage, { errorClass: CustomError2 } ) );
            } );
        } );

        describe( 'embedValidationError passed', function() {
            it( 'should return validationError embedded to body', function() {

                const req = {};
                const next = sinon.spy();

                const config = {
                    embedValidationError: false
                };

                const options = {
                    embedValidationError: true
                };

                const expectedErrorMessage = 'missing required property: test';

                const middleware = middlewareLib( config )( testSchema, options );

                middleware( req, {}, next );

                sinon.assert.calledOnce( next );
                sinon.assert.calledWithExactly( next, matchRestifyError( expectedErrorMessage, { expectErrorEmbedded: true } ) );
            } );
        } );

        describe( 'embedValidationError passed along with errorClass', function() {
            it( 'should return validationError embedded to body and error should be an instance of options\' errorClass', function() {

                const req = {};
                const next = sinon.spy();

                const config = {
                    errorClass: CustomError,
                    embedValidationError: false
                };

                const options = {
                    errorClass: CustomError2,
                    embedValidationError: true
                };

                const expectedErrorMessage = 'missing required property: test';

                const middleware = middlewareLib( config )( testSchema, options );

                middleware( req, {}, next );

                sinon.assert.calledOnce( next );
                sinon.assert.calledWithExactly( next, matchCustomError( expectedErrorMessage, { errorClass: CustomError2, expectErrorEmbedded: true } ) );
            } );
        } );

        describe( 'embedValidationErrorCode passed', function() {
            it( 'should return validationErrorCode embedded to body', function() {

                const req = {};
                const next = sinon.spy();

                const config = {
                    embedValidationErrorCode: false
                };

                const options = {
                    embedValidationErrorCode: true
                };

                const expectedErrorMessage = 'missing required property: test';

                const middleware = middlewareLib( config )( testSchema, options );

                middleware( req, {}, next );

                sinon.assert.calledOnce( next );
                sinon.assert.calledWithExactly( next, matchRestifyError( expectedErrorMessage, { validationErrorCode: 'OBJECT_REQUIRED' } ) );
            } );
        } );

        describe( 'embedValidationErrorCode passed along with errorClass', function() {
            it( 'should return validationErrorCode embedded to body and error should be an instance of options\' errorClass', function() {

                const req = {};
                const next = sinon.spy();

                const config = {
                    errorClass: CustomError,
                    embedValidationErrorCode: false
                };

                const options = {
                    errorClass: CustomError2,
                    embedValidationErrorCode: true
                };

                const expectedErrorMessage = 'missing required property: test';

                const middleware = middlewareLib( config )( testSchema, options );

                middleware( req, {}, next );

                sinon.assert.calledOnce( next );
                sinon.assert.calledWithExactly( next, matchCustomError( expectedErrorMessage, { errorClass: CustomError2, validationErrorCode: 'OBJECT_REQUIRED' } ) );
            } );
        } );

        describe( 'replaceMessageFormatters passed', function() {

            var messageFormatters;

            before( function() {
                messageFormatters = _.clone( errorMessageFormatter.getFormatters() );
            } );

            after( function() {
                errorMessageFormatter.replaceFormatters( messageFormatters );
            } );

            it( 'should return error message, formatted using options\' custom formatter, and not defined formatters should be erased', function() {

                const next = sinon.spy();

                const config = {
                    replaceMessageFormatters: {
                        OBJECT_REQUIRED: () => {
                            return 'patched';
                        }
                    }
                };

                const options = {
                    replaceMessageFormatters: {
                        OBJECT_REQUIRED: () => {
                            return 'patched2';
                        }
                    }
                };

                const middleware = middlewareLib( config )( testSchema, options );

                middleware( {}, {}, next );

                sinon.assert.calledOnce( next );
                sinon.assert.calledWithExactly( next, matchRestifyError( 'patched2' ) );

                next.reset();

                middleware( { test: '', test2: 'test2' }, {}, next );

                sinon.assert.calledOnce( next );
                sinon.assert.calledWithExactly( next, matchRestifyError( 'additional properties not allowed: test2' ) );
            } );
        } );

        describe( 'addMessageFormatters passed', function() {

            var messageFormatters;

            before( function() {
                messageFormatters = _.clone( errorMessageFormatter.getFormatters() );
            } );

            after( function() {
                errorMessageFormatter.replaceFormatters( messageFormatters );
            } );

            it( 'should return error message, formatted using options\' custom formatter, but other formatters should not be changed', function() {

                const next = sinon.spy();

                const config = {
                    addMessageFormatters: {
                        OBJECT_REQUIRED: () => {
                            return 'patched';
                        }
                    }
                };

                const options = {
                    addMessageFormatters: {
                        OBJECT_REQUIRED: () => {
                            return 'patched2';
                        }
                    }
                };

                const middleware = middlewareLib( config )( testSchema, options );

                middleware( {}, {}, next );

                sinon.assert.calledOnce( next );
                sinon.assert.calledWithExactly( next, matchRestifyError( 'patched2' ) );

                next.reset();

                middleware( { test: '', test2: 'test2' }, {}, next );

                sinon.assert.calledOnce( next );
                sinon.assert.calledWithExactly( next, matchRestifyError( 'additional properties not allowed: test2' ) );
            } );
        } );

        describe( 'checkOnly passed', function() {
            it( 'should return error message, formatted using custom formatter, but other formatters should not be changed', function() {

                const req = {
                    body: {
                        test: 'test',
                        test2: ''
                    }
                };
                const next = sinon.spy();

                const config = {
                    checkOnly: 'headers'
                };

                const options = {
                    checkOnly: 'body'
                };

                const middleware = middlewareLib( config )( testSchema, options );

                middleware( req, {}, next );

                sinon.assert.calledOnce( next );
                sinon.assert.calledWithExactly( next, matchRestifyError( 'additional properties not allowed: test2' ) );
            } );
        } );
    } );

    // -------------------------------------------------------------------------

    describe( 'when only options passed and ', function() {

        describe( 'replaceMessageFormatters passed', function() {
            it( 'should not persist changes', function() {

                const req = {};
                const next = sinon.spy();

                const options = {
                    replaceMessageFormatters: {
                        OBJECT_REQUIRED: () => {
                            return 'patched';
                        }
                    }
                };

                const middlewareWithOptions = middlewareLib()( testSchema, options );

                middlewareWithOptions( req, {}, next );

                sinon.assert.calledOnce( next );
                sinon.assert.calledWithExactly( next, matchRestifyError( 'patched' ) );


                next.reset();

                const middlewareWithoutOptions = middlewareLib()( testSchema );

                middlewareWithoutOptions( req, {}, next );

                sinon.assert.calledOnce( next );
                sinon.assert.calledWithExactly( next, matchRestifyError( 'missing required property: test' ) );
            } );
        } );

        describe( 'addMessageFormatters passed', function() {
            it( 'should not persist changes', function() {

                const req = {};
                const next = sinon.spy();

                const options = {
                    addMessageFormatters: {
                        OBJECT_REQUIRED: () => {
                            return 'patched';
                        }
                    }
                };

                const middlewareWithOptions = middlewareLib()( testSchema, options );

                middlewareWithOptions( req, {}, next );

                sinon.assert.calledOnce( next );
                sinon.assert.calledWithExactly( next, matchRestifyError( 'patched' ) );


                next.reset();

                const middlewareWithoutOptions = middlewareLib()( testSchema );

                middlewareWithoutOptions( req, {}, next );

                sinon.assert.calledOnce( next );
                sinon.assert.calledWithExactly( next, matchRestifyError( 'missing required property: test' ) );
            } );
        } );
    } );
} );
