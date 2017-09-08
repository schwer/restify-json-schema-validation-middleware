'use strict';

const assert = require( 'chai' ).assert;
const restifyErrors = require( 'restify-errors' );
const sinon = require( 'sinon' );

const middlewareLib = require( '..' );

const res = Object.freeze( {} );

function matchError( message ) {
    return sinon.match( function( err ) {

        assert.instanceOf( err, restifyErrors.BadRequestError );
        assert.deepEqual( err.body, {
            code: 'BadRequest',
            message
        } );

        return true;
    } );
}

describe( 'middlewareTests', function() {

    describe( 'request', function() {

        describe( 'when data is valid', function() {
            it( 'should call next without error', function() {

                const req = {
                    headers: {
                        'Content-Type': 'text/plain'
                    },
                    body: {
                        hello: 'world'
                    }
                };

                const schema = {
                    type: 'object',
                    properties: {
                        body: { type: 'object' }
                    },
                    required: [ 'body' ]
                };

                const middleware = middlewareLib()( schema );

                const next = sinon.spy();
                middleware( req, res, next );

                sinon.assert.calledOnce( next );
                sinon.assert.calledWith( next );
            } );
        } );

        describe( 'when data is invalid', function() {
            it( 'should call next without error', function() {

                const req = {
                    headers: {
                        'Content-Type': 'text/plain'
                    },
                    body: {
                        hello: 'world'
                    }
                };

                const schema = {
                    type: 'object',
                    properties: {
                        body: { type: 'string' }
                    },
                    required: [ 'body' ]
                };

                const middleware = middlewareLib()( schema );

                const next = sinon.spy();
                middleware( req, res, next );

                sinon.assert.calledOnce( next );
                sinon.assert.calledWithExactly( next, matchError( 'request.body: invalid type (expected string, got object)' ) );
            } );
        } );

    } );

    [ 'headers', 'body', 'query', 'params', 'files' ].forEach( function( basePath ) {

        describe( basePath, function() {

            describe( 'when data is valid', function() {
                it( 'should call next without error', function() {

                    const req = {};
                    req[ basePath ] = {
                        hello: 'world'
                    };

                    const schema = {
                        type: 'object',
                        properties: {
                            hello: { type: 'string' }
                        },
                        required: [ 'hello' ]
                    };

                    const reqMiddlewareFactory = middlewareLib();
                    const basePathMiddlwareFactory = reqMiddlewareFactory[ basePath ];
                    const middleware = basePathMiddlwareFactory( schema );

                    const next = sinon.spy();
                    middleware( req, res, next );

                    sinon.assert.calledOnce( next );
                    sinon.assert.calledWith( next );
                } );
            } );

            describe( 'when data is invalid', function() {
                it( 'should call next without error', function() {

                    const req = {};
                    req[ basePath ] = {
                        hello: 666
                    };

                    const schema = {
                        type: 'object',
                        properties: {
                            hello: { type: 'string' }
                        },
                        required: [ 'hello' ]
                    };

                    const reqMiddlewareFactory = middlewareLib();
                    const basePathMiddlwareFactory = reqMiddlewareFactory[ basePath ];
                    const middleware = basePathMiddlwareFactory( schema );

                    const next = sinon.spy();
                    middleware( req, res, next );

                    sinon.assert.calledOnce( next );
                    sinon.assert.calledWithExactly( next, matchError( `${ basePath }.hello: invalid type (expected string, got number)` ) );
                } );
            } );

            describe( `when ${ basePath } is missing`, function() {
                it( 'should call next without error', function() {

                    const req = {};

                    const schema = {
                        type: 'object',
                        properties: {
                            hello: { type: 'string' }
                        },
                        required: [ 'hello' ]
                    };

                    const reqMiddlewareFactory = middlewareLib();
                    const basePathMiddlwareFactory = reqMiddlewareFactory[ basePath ];
                    const middleware = basePathMiddlwareFactory( schema );

                    const next = sinon.spy();
                    middleware( req, res, next );

                    sinon.assert.calledOnce( next );
                    sinon.assert.calledWithExactly( next, matchError( `${ basePath }: missing required property 'hello'` ) );
                } );
            } );

        } );
    } );

    describe( 'config.banUnknownProperties', function() {
        it( 'should ban unknown properties', function() {

            const req = {
                headers: {
                    'Content-Type': 'text/plain'
                },
                body: {
                    hello: 'world'
                }
            };

            const schema = {
                type: 'object',
                properties: {
                    body: { type: 'object' }
                },
                required: [ 'body' ]
            };

            const middleware = middlewareLib( { banUnknownProperties: true } )( schema );

            const next = sinon.spy();
            middleware( req, res, next );

            sinon.assert.calledOnce( next );
            sinon.assert.calledWithExactly( next, matchError( 'request.headers: unknown property (not in schema)' ) );
        } );
    } );
} );
