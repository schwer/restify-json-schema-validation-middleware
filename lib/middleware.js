'use strict';

const _ = require( 'lodash' );
const tv4 = require( 'tv4' );
const formats = require( 'tv4-formats' );

const errorHandler = require( './errorHandler.js' );
const errorMessageFormatter = require( './errorMessageFormatter.js' );

tv4.addFormat( formats );
const errorCodes = _.invert( tv4.errorCodes );

module.exports = function( config ) {

    config = config || {};

    if( config.replaceMessageFormatters ) {
        errorMessageFormatter.replaceFormatters( config.replaceMessageFormatters );
    }

    if( config.addMessageFormatters ) {
        errorMessageFormatter.addFormatters( config.addMessageFormatters );
    }

    return function( schema, options ) {

        options = options || {};

        return function( req, res, next ) {

            const checkRecursive = options.checkRecursive || config.checkRecursive;
            const banUnknownProperties = options.banUnknownProperties || config.banUnknownProperties;

            const errorHandlerOptions = {
                errorHandler: options.errorHandler || config.errorHandler,
                errorClass: options.errorClass || config.errorClass,
                replaceMessageFormatters: options.replaceMessageFormatters,
                addMessageFormatters: options.addMessageFormatters,
                embedValidationError: options.embedValidationError || config.embedValidationError,
                embedValidationErrorCode: options.embedValidationErrorCode || config.embedValidationErrorCode
            };

            const checkOnly = options.checkOnly || config.checkOnly;
            const data = checkOnly
                ? _.get( req, checkOnly )
                : req;

            const result = tv4.validateResult( data, schema, checkRecursive, banUnknownProperties );

            if( result.valid ) {
                return next();
            }

            const validationError = result.error;
            validationError.code = errorCodes[ validationError.code ];
            errorHandler( validationError, errorHandlerOptions, res, next );
        };
    };
};
