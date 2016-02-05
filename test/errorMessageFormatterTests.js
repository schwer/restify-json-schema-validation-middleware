'use strict';

const _ = require( 'lodash' );
const chai = require( 'chai' );
const tv4 = require( 'tv4' );

const errorMessageFormatter = require( '../lib/errorMessageFormatter.js' );

const assert = chai.assert;
const errorCodes = _.invert( tv4.errorCodes );

function getError( data, schema ) {

    const result = tv4.validateResult( data, schema );

    const validationError = result.error;
    validationError.code = errorCodes[ validationError.code ];

    return validationError;
}

describe( 'errorMessageFormatterTests', function() {

    describe( '#format', function() {

        it( 'OBJECT_REQUIRED', function() {

            const schema = {
                type: 'object',
                properties: {
                    test: { type: 'string' }
                },
                required: [ 'test' ]
            };

            const data = {};

            const error = getError( data, schema );
            const message = errorMessageFormatter.format( error );

            assert.equal( message, 'missing required property: test' );
        } );

        it( 'OBJECT_ADDITIONAL_PROPERTIES', function() {

            const schema = {
                type: 'object',
                additionalProperties: false,
                properties: {
                    test: { type: 'string' }
                },
                required: [ 'test' ]
            };

            const data = {
                test: 'test',
                test2: {}
            };

            const error = getError( data, schema );
            const message = errorMessageFormatter.format( error );

            assert.equal( message, 'additional properties not allowed: test2' );
        } );

        it( 'INVALID_TYPE', function() {

            const schema = {
                type: 'object',
                properties: {
                    test: { type: 'string' }
                }
            };

            const data = {
                test: 123
            };

            const error = getError( data, schema );
            const message = errorMessageFormatter.format( error );

            assert.equal( message, 'invalid type: test (expected string, got number)' );
        } );

        it( 'STRING_LENGTH_SHORT', function() {

            const schema = {
                type: 'object',
                properties: {
                    test: {
                        type: 'string',
                        minLength: 10
                    }
                }
            };

            const data = {
                test: 'abc'
            };

            const error = getError( data, schema );
            const message = errorMessageFormatter.format( error );

            assert.equal( message, 'string is too short: test (minimum 10, actual 3)' );
        } );

        it( 'STRING_LENGTH_LONG', function() {

            const schema = {
                type: 'object',
                properties: {
                    test: {
                        type: 'string',
                        maxLength: 2
                    }
                }
            };

            const data = {
                test: 'abc'
            };

            const error = getError( data, schema );
            const message = errorMessageFormatter.format( error );

            assert.equal( message, 'string is too long: test (maximum 2, actual 3)' );
        } );

        it( 'ONE_OF_MISSING', function() {

            const schema = {
                type: 'object',
                properties: {
                    test: {
                        oneOf: [
                            { type: 'string' },
                            { type: 'number' }
                        ]
                    }
                }
            };

            const data = {
                test: {}
            };

            const error = getError( data, schema );
            const message = errorMessageFormatter.format( error );

            assert.equal( message, 'data does not match any schemas: test (expected string, number, got object)' );
        } );
    } );
} );