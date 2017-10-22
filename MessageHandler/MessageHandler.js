const Connection    = require('../Connections.js');
const redisClient   = Connection.redisClient;
const Config        = require('../Config.json');
const handlerFunctions = require('./handlerFunctions.js');
const Async         = require('async');
const crypto        = require('crypto');

let messageHandler = null;


let getArrayWaterfallFunctions = handlerFunctions.getArrayWaterfallFunctions;

function MessageHandler( redisClient ) {}


MessageHandler.prototype.getMessageAndCheckOnError = function ( mainCallback ) {

    let arrayFunctions = getArrayWaterfallFunctions( redisClient );

    Async.waterfall( arrayFunctions, (err, resultWaterfall) => {

        // error in eventHandler
        if( err === true ) {
            ///write error message to redis
            
            return this.errorHandler.writeErrorMessage( resultWaterfall, mainCallback );
        }
        else if( err ) {

            return mainCallback("error in Async.waterfall", err);
        }

        if( resultWaterfall === "generatorGoneAway" ) return mainCallback( resultWaterfall );

        return mainCallback();
    });
}

module.exports.createMessageHandler = function( errorHandler ) {

    if( messageHandler === null ) {
        MessageHandler.prototype.errorHandler = errorHandler;
        messageHandler = new MessageHandler( redisClient );
    }

    return messageHandler;
}
