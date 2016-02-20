'use strict';

const _ = require( 'lodash' );

function formatPath( basePath, path, options ) {

    const opts = options || {};

    let fullPath = '';

    if( basePath ) {
        fullPath += basePath;
    }

    if( fullPath && path ) {

        const segments = path.split( '/' );

        if( opts.trimTrailingSegment ) {
            segments.pop();
        }

        fullPath += segments.join( '.' );
    }

    return fullPath;
}

function stringFirstToLowerCase( str ) {

    if( str && str.length > 0 ) {
        return str.charAt( 0 ).toLowerCase() + str.slice( 1 );
    }

    return '';
}

const messageFormatters = {

    OBJECT_REQUIRED: ( basePath, error ) => {

        var formattedPath = formatPath( basePath, error.dataPath );
        const key = error.params.key;

        return `${ formattedPath }: missing required property '${ key }'`;
    },

    OBJECT_ADDITIONAL_PROPERTIES: ( basePath, error ) => {

        const formattedPath = formatPath( basePath, error.dataPath, { trimTrailingSegment: true } );
        return `${ formattedPath }: additional property '${ error.params.key }' not allowed`;
    },

    INVALID_TYPE: ( basePath, error ) => {

        const formattedPath = formatPath( basePath, error.dataPath );
        return `${ formattedPath }: invalid type (expected ${ error.params.expected }, got ${ error.params.type })`;
    },

    STRING_LENGTH_SHORT: ( basePath, error ) => {

        const formattedPath = formatPath( basePath, error.dataPath );
        return `${ formattedPath }: string is too short (minimum ${ error.params.minimum }, actual ${ error.params.length })`;
    },

    STRING_LENGTH_LONG: ( basePath, error ) => {

        const formattedPath = formatPath( basePath, error.dataPath );
        return `${ formattedPath }: string is too long (maximum ${ error.params.maximum }, actual ${ error.params.length })`;
    },

    ONE_OF_MISSING: ( basePath, error ) => {

        const formattedPath = formatPath( basePath, error.dataPath );

        const actual = error.subErrors[ 0 ].params.type;
        const expected = _.map( error.subErrors, subError => subError.params.expected ).join( '/' );

        return `${ formattedPath }: data does not match any schemas (expected ${ expected }, got ${ actual })`;
    },

    FORMAT_CUSTOM: ( basePath, error ) => {

        const formattedPath = formatPath( basePath, error.dataPath );
        const message = error.params.message;

        return `${ formattedPath }: format validation failed (${ message })`;
    },

    DEFAULT: ( basePath, error ) => {

        const formattedPath = formatPath( basePath, error.dataPath );
        const baseMessage = stringFirstToLowerCase( error.message );

        return `${ formattedPath }: ${ baseMessage }`;
    }
};

module.exports = function( basePath ) {

    const formatters = _.mapValues( messageFormatters, formatter => {
        return ( error ) => formatter( basePath, error );
    } );

    return function( error ) {

        const formatter = formatters[ error.code ] || formatters.DEFAULT;
        return formatter( error );
    };
};
