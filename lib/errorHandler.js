'use strict';

const _ = require( 'lodash' );
const restify = require( 'restify' );

const errorMessageFormatter = require( './errorMessageFormatter.js' );

function embedRequested( formattedError, error, options ) {

    const embed = {};

    if( options.embedValidationError ) {
        embed.validationError = error;
    }

    if( options.embedValidationErrorCode ) {
        embed.validationErrorCode = error.code;
    }

    if( formattedError instanceof restify.HttpError ) {
        _.assign( formattedError.body, embed );
    } else {
        _.assign( formattedError, embed );
    }
}

module.exports = function( error, options, res, next ) {

    options = options || {};

    const message = errorMessageFormatter.format( error, options.replaceMessageFormatters, options.addMessageFormatters );

    const formattedError = ( options.errorClass )
        ? new options.errorClass( message )
        : new restify.BadRequestError( message );

    embedRequested( formattedError, error, options );

    if( options.errorHandler ) {
        return options.errorHandler( formattedError, res, next );
    }

    return next( formattedError );
};
