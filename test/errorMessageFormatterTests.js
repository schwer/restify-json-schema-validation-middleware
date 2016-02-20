'use strict';

const _ = require( 'lodash' );
const chai = require( 'chai' );
const tv4 = require( 'tv4' );

const errorMessageFormatter = require( '../lib/errorMessageFormatter.js' )( 'root' );

const assert = chai.assert;
const errorCodes = _.invert( tv4.errorCodes );

function getError( data, schema ) {

    const result = tv4.validateResult( data, schema );

    const validationError = result.error;
    validationError.code = errorCodes[ validationError.code ];

    return validationError;
}

function assertErrorMessageFormatter( schema, data, expectedMessage ) {

    const error = getError( data, schema );

    const message = errorMessageFormatter( error );
    assert.equal( message, expectedMessage );
}

describe( 'errorMessageFormatterTests', function() {

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

        const message = errorMessageFormatter( error );
        assert.equal( message, 'root.test: invalid type: number (expected string)' );
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

        assertErrorMessageFormatter( schema, data, `root: missing required property 'test'` );
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
            additional: {}
        };

        assertErrorMessageFormatter( schema, data, `root: additional property 'additional' not allowed` );
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

        assertErrorMessageFormatter( schema, data, 'root.test: invalid type (expected string, got number)' );
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

        assertErrorMessageFormatter( schema, data, 'root.test: string is too short (minimum 10, actual 3)' );
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

        assertErrorMessageFormatter( schema, data, 'root.test: string is too long (maximum 2, actual 3)' );
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

        assertErrorMessageFormatter( schema, data, 'root.test: data does not match any schemas (expected string/number, got object)' );
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

        assertErrorMessageFormatter( schema, data, 'root.test: format validation failed (Data is invalid)' );
    } );

} );
