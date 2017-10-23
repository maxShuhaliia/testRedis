const Connection    = require('./Connections.js');
const Config        = require('./Config.json');
const redisClient   = Connection.redisClient;
let subscriber      = Connection.subscriber
let publisher       = Connection.publisher;


function ApplicationMode() {}


function getOneServerIpWithPid( data ) {

    let arr = data.sort();

    return arr[0];
}


function hdelFromRedis( key, keys ) {

    if( !keys || keys.length === 0) return false;

    redisClient.hdel(key, keys, function (err, data) {
        if (err) {
            console.log("error in redisClient.set hdelFromRedis ", err);
            return false;
        }
    });
}

ApplicationMode.prototype.isThisInstanceGenerator = function( callback ) {

    publisher.publish("serversExchangeMesssage", "setIpAndPid");

    setTimeout( getAllserversWithPid, 5000 );

    function getAllserversWithPid() {

        new Promise( ( resolve, reject ) => {

            redisClient.hkeys("setIpAndPid", function (err, data) {
                if (err) {
                    console.log("error in redisClient.set getAllserversWithPid() " + err);
                    return reject(err);
                }

                hdelFromRedis("setIpAndPid", data);

                let oneServerWithPid = getOneServerIpWithPid(data);

                let currentIpWithPid = Config.ipAddress + "|" + process.pid;


                return resolve( oneServerWithPid ===  currentIpWithPid );
            });
        })

            .then( ( isGeneratorCurrentMachine ) => {
                callback( isGeneratorCurrentMachine )
            })
            .catch( ( err ) => {
                console.log('error', err);
            });
    }
}


//////////////////////////////////////////////////////   set get del   //////////////////////
function setRecordToRedis( key, value ) {
/// set
    new Promise( ( resolve, reject ) => {

        redisClient.set(key, value, function (err) {
            if (err) {
                return reject(err);
            }

            return resolve(true);
        });
    })
/// set expire
        .then( ( result ) => {

            return new Promise( ( resolve, reject ) => {

                let ttl = Math.floor(Date.now() / 1000) + 100;  // 100 sec

                redisClient.expireat(key, ttl, (err, status) => {
                    if (err || status !== 1) {
                        return reject(err);
                    }
                    return resolve(true);
                });
            });
        })

        .catch( ( error ) => {
            console.log('error in setRecordToRedis()  catch() ', error);
        });
}

function getRecordFromRedis( key ) {

   return new Promise( ( resolve, reject ) => {

        redisClient.get(key, function (err, data) {
            if (err) {
                return reject(err);
            }

            return resolve(data);
        });
    })
}

function removeRecordFromRedis( key ) {

    redisClient.del(key, function (err) {
        if (err) {
           console.log('error removeRecordFromRedis()', err);
        }
    });
}

////////////////////////////////////////////////////////   hset hget hdel  //////////////////

function HsetRecordToRedis( key1, key2, value ) {

    redisClient.hset(key1, key2, value, function (err) {
        if (err) {
            console.log("error in redisClient.set HsetRecordToRedis " + err);
            return false;
        }
    });
}


ApplicationMode.prototype.subscibeSrever = function() {

    subscriber.subscribe('serversExchangeMesssage');

    subscriber.on("message", function(channel, message) {


        if( message === "generatorExists" && global.isGeneratorMode === true ) {
            setRecordToRedis( "generatorExists", true );
        }

        else if( message === "setOwnIpAndPidMessageHandlersToRedis" && global.isMessageMode === true ) {

            let key1 = "messageHandler";
            let key2 = Config.ipAddress + "|" + process.pid;

            HsetRecordToRedis( key1, key2, true );
        }
        else if( message && /getMessage/.test(message) && global.isMessageMode === true ) {

            let ipAndPid = message.split("=")[1];  // ipAndPid

            let key = Config.ipAddress + "|" + process.pid;

            if( ipAndPid === key ) global.eventEmiter.emit( "readMessage" );
        }
        else if( message === "setIpAndPid" ) {

            let key1 = "setIpAndPid";
            let key2 = Config.ipAddress + "|" + process.pid;

            HsetRecordToRedis( key1, key2, true );
        }

    });
}


function isGeneratorRanning( callback ) {

    publisher.publish("serversExchangeMesssage", "generatorExists");

    setTimeout( () => {

        getRecordFromRedis('generatorExists')
            .then( ( isGeneratorExists ) => {

                removeRecordFromRedis( "generatorExists" );

                //console.log(isGeneratorExists);

                if( isGeneratorExists ) return callback(true);

                return callback(false);
            });
    }, 3000);
}



function checkIsGetErrorsMode() {

    for( let i = 0; i < process.argv.length ; i++ ) {

        let parameter = process.argv[i];
        if( parameter === 'getErrors' ) return true;
    }

    return false;
}

ApplicationMode.prototype.getMode = function( callback ) {
    
    if( checkIsGetErrorsMode() === true ) return callback("ErrorsMode");

    isGeneratorRanning( ( isGeneratorExists ) => {

        if( isGeneratorExists === false ) return callback("GeneratorMode");

        return callback("MessageMode");
    });
}



let applicationMode = null;
module.exports.createApplicationMode = function(  ) {

    if( applicationMode === null ) {
        applicationMode = new ApplicationMode();
        applicationMode.subscibeSrever();
    }
    
    return applicationMode;
}
