'use strict';

const _ = require( 'lodash' );

function formatPath( path ) {
    return path.slice( 1 ).replace( /\//g, '.' );
}

function stringFirstToLowerCase( str ) {

    if( str && str.length > 0 ) {
        return str.charAt( 0 ).toLowerCase() + str.slice( 1 );
    }

    return '';
}

function defaultMessageFormatter( error ) {

    const formattedPath = formatPath( error.dataPath );
    const baseMessage = stringFirstToLowerCase( error.message );

    return `${ baseMessage }: ${ formattedPath }`;
}

var messageFormatters = {

    OBJECT_REQUIRED: error => {

        var formattedPath = formatPath( error.dataPath );
        const key = error.params.key;

        formattedPath = ( formattedPath.length > 0 )
            ? formattedPath + '.' + key
            : key;

        return `missing required property: ${ formattedPath }`;
    },

    OBJECT_ADDITIONAL_PROPERTIES: error => {

        const formattedPath = formatPath( error.dataPath );
        return `additional properties not allowed: ${ formattedPath }`;
    },

    INVALID_TYPE: error => {

        const formattedPath = formatPath( error.dataPath );
        return `invalid type (expected ${ error.params.expected }, got ${ error.params.type }): ${ formattedPath }`;
    },

    STRING_LENGTH_SHORT: error => {

        const formattedPath = formatPath( error.dataPath );
        return `string is too short (minimum ${ error.params.minimum }, actual ${ error.params.length }): ${ formattedPath }`;
    },

    STRING_LENGTH_LONG: error => {

        const formattedPath = formatPath( error.dataPath );
        return `string is too long (maximum ${ error.params.maximum }, actual ${ error.params.length }): ${ formattedPath }`;
    },

    ONE_OF_MISSING: error => {

        const formattedPath = formatPath( error.dataPath );

        const actual = error.subErrors[ 0 ].params.type;
        const expected = _.map( error.subErrors, subError => subError.params.expected ).join( ', ' );

        return `data does not match any schemas (expected ${ expected }, got ${ actual }): ${ formattedPath }`;
    },

    FORMAT_CUSTOM: error => {

        const formattedPath = formatPath( error.dataPath );
        const message = stringFirstToLowerCase( error.params.message );

        return `format validation failed (${ message }): ${ formattedPath }`;
    }
};

module.exports = {

    replaceFormatters: function( formatters ) {
        messageFormatters = formatters;
    },

    addFormatters: function( formatters ) {
        _.assign( messageFormatters, formatters );
    },

    getFormatters: function() {
        return messageFormatters;
    },

    format: function( error, replaceFormatters, addFormatters ) {

        var currentFormatters = messageFormatters;

        if( replaceFormatters || addFormatters ) {

            currentFormatters = replaceFormatters
                ? replaceFormatters
                : _.clone( messageFormatters );

            if( addFormatters ) {
                _.assign( currentFormatters, addFormatters );
            }
        }

        const formatter = currentFormatters[ error.code ] || defaultMessageFormatter;
        return formatter( error );
    }
};
