const Connection    = require('../Connections.js');
const redisClient   = Connection.redisClient;
const Config        = require('../Config.json');
const Async         = require('async');
const crypto        = require('crypto');

let errorHandler = null;


function ErrorHandler( redisClient ) {}

ErrorHandler.prototype.writeErrorMessage = function( message, callback ) {

    let key  = "errors";
    let hash = crypto.createHash('md5').update('' + Math.random() + Date.now()).digest('hex');

    redisClient.hset(key, hash, message, function (err) {
        if (err) {
            callback("error in redisClient.set qps " + err);
            return false;
        }

        callback(null);
    });
}

ErrorHandler.prototype.getAllErrors = function( callback ) {
    let key  = "errors";

    redisClient.hgetall(key, function (err, data) {
        if (err) {
            console.log("error in redisClient.set qps ", err);
            callback(null)
            return false;
        }

        callback(data);
    });
}

ErrorHandler.prototype.removeAllErrors = function() {

    let key  = "errors";

   return new Promise( ( resolve, reject ) => {

        redisClient.hkeys(key, function (err, data) {
            if (err) {
                console.log("error in redisClient.set qps ", err);
                reject(err)
                return false;
            }

            resolve(data);
        });
    })
        .then( ( keys ) => {

            return new Promise( ( resolve, reject ) => {
                redisClient.hdel(key, keys, function (err, data) {
                    if (err) {
                        console.log("error in redisClient.hdel removeAllErrors ", err);
                        reject(err);
                        return false;
                    }

                    return resolve(data);
                });
            });
        })
        .catch( ( err ) => {
            console.log('error in catch removeAllErrors()', err);
        })
}


ErrorHandler.prototype.printAllErrors = function(data, mainCallback) {

    let keys = Object.keys(data);

    let options = {'index': 0};

    function asyncPrintErrors( options, doneCallback ) {

        let timer = setInterval(() => {

            if( options['done'] ) {
                clearInterval(timer);
                return doneCallback('ok');
            }

            for( let i = 0; i < 1000; i++ ) {

                let key = keys[options['index']];

                // end of array
                if( key === undefined ) options['done'] = true;

                if( options['done'] ) {
                    clearInterval(timer);
                    return doneCallback('ok');
                }

                console.log(data[key]);
                options['index']++;
            }

        }, 0);
    }

    asyncPrintErrors( options, ( result ) => {

        mainCallback(result);
    });
}

ErrorHandler.prototype.printAllErrorsAndDelete = function() {

    new Promise( ( resolve, reject ) => {

        this.getAllErrors( ( data ) => {

            return resolve( data );
        });
    })

        .then( ( data ) => {

            return new Promise( ( resolve, reject ) => {

                if( data === null ) {
                    console.log('in redis records does not exists');
                    return resolve(false);
                }

                this.printAllErrors(data, ( result ) => {

                    return resolve(true);
                });
            });
        })
        .then( ( isRecordsExists ) => {

            if(isRecordsExists) return this.removeAllErrors();

            return Promise.resolve(true);
        })
        .then( () => {
            process.exit(0);
        })
        .catch( (err) => {
            console.log( 'error in catch printAllErrorsAndDelete()', err );
            process.exit(1);
        })




}

ErrorHandler.prototype.eventHandler = function (msg, callback){

    function onComplete(){

        var error = Math.random() > 0.85;
        //console.log('callback', callback);
        callback(error, msg);
    }
// processing takes time...
    setTimeout(onComplete, Math.floor(Math.random()*1000));
}



module.exports.createErrorHandler = function() {

    if( errorHandler === null ) errorHandler = new ErrorHandler( redisClient );

    return errorHandler;
}
