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

        it( 'DEFAULT_FORMATTER', function() {

            const schema = {
                type: 'object',
                properties: {
                    test: { type: 'string' }
                },
                required: [ 'test' ]
            };

            const data = {
                test: 1
            };

            const error = getError( data, schema );
            error.code = 'UNKNOWN';
            const message = errorMessageFormatter.format( error );

            assert.equal( message, 'invalid type: number (expected string): test' );
        } );

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

            assert.equal( message, 'invalid type (expected string, got number): test' );
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

            assert.equal( message, 'string is too short (minimum 10, actual 3): test' );
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

            assert.equal( message, 'string is too long (maximum 2, actual 3): test' );
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

            assert.equal( message, 'data does not match any schemas (expected string, number, got object): test' );
        } );

        it( 'CUSTOM_FORMAT', function() {

            tv4.addFormat( 'test-format', data => {

                if( data !== 'valid data' ) {
                    return 'Data is invalid';
                }

                return null;
            } );

            const schema = {
                type: 'object',
                properties: {
                    test: {
                        type: 'string',
                        format: 'test-format'
                    }
                }
            };

            const data = {
                test: '123'
            };

            const error = getError( data, schema );
            const message = errorMessageFormatter.format( error );

            assert.equal( message, 'format validation failed (Data is invalid): test' );
        } );
    } );
} );
