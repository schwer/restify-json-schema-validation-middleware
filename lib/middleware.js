'use strict';

const _ = require( 'lodash' );
const tv4 = require( 'tv4' );
const formats = require( 'tv4-formats' );
const restify = require( 'restify' );

const errorMessageFormatter = require( './errorMessageFormatter.js' );

const requestFormatter = errorMessageFormatter( 'request' );
const bodyFormatter = errorMessageFormatter( 'body' );
const headersFormatter = errorMessageFormatter( 'headers' );
const queryFormatter = errorMessageFormatter( 'query' );
const paramsFormatter = errorMessageFormatter( 'params' );

tv4.addFormat( formats );
const errorCodes = _.invert( tv4.errorCodes );

const checkRecursive = false;

module.exports = function( config ) {

    const cfg = config || {};

    const banUnknownProperties = cfg.banUnknownProperties || false;

    function validateData( schema, data, errorFormatter, next ) {

        const result = tv4.validateResult( data || {}, schema, checkRecursive, banUnknownProperties );
        if( result.valid ) {
            return next();
        }

        const validationError = result.error;
        validationError.code = errorCodes[ validationError.code ];

        const message = errorFormatter( validationError );
        const formattedError = new restify.BadRequestError( message );

        return next( formattedError );
    }

    function middleware( schema ) {
        return function( req, res, next ) {
            return validateData( schema, req, requestFormatter, next );
        };
    }

    middleware.headers = function( schema ) {
        return function( req, res, next ) {
            return validateData( schema, req.headers, headersFormatter, next );
        };
    };

    middleware.body = function( schema ) {
        return function( req, res, next ) {
            return validateData( schema, req.body, bodyFormatter, next );
        };
    };

    middleware.query = function( schema ) {
        return function( req, res, next ) {
            return validateData( schema, req.query, queryFormatter, next );
        };
    };

    middleware.params = function( schema ) {
        return function( req, res, next ) {
            return validateData( schema, req.params, paramsFormatter, next );
        };
    };

    return middleware;
};
