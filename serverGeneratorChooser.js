const Connection    = require('./Connections.js');
const Config        = require('./Config.json');
const redisClient   = Connection.redisClient;
let subscriber      = Connection.subscriber
let publisher       = Connection.publisher;

function GeneratorChooser() {

}

function setIpToRedis( ipAddress ) {

    let key  = "serverIp";

    redisClient.hset(key, ipAddress, "", function (err) {
        if (err) {
            callback("error in redisClient.set qps " + err);
            return false;
        }
    });
}

function getGenaratorIpAndBroadcast() {

    let key  = "serverIp";

    new Promise( ( resolve, reject ) => {

        redisClient.hkeys(key, function (err, serversArray) {
            if (err) {
                console.log("error in redisClient.set qps ", err);
                reject(err);
                return false;
            }

            resolve(serversArray);
        });
    })

        .then( ( serversArray ) => {

            let ip = ( serversArray && Array.isArray(serversArray) ) ? serversArray.sort()[0] : Config.ipAddress;

            publisher.publish("serversCounter", "generatorIp=" + ip);
        })
        .catch( ( err ) => {
            console.log('error in catch getGenaratorIpAndBroadcast()', err);
        })
}


GeneratorChooser.prototype.subscribeOnServersMessages = function () {

    subscriber.subscribe('serversCounter');

    subscriber.on("message", function(channel, message) {

        if ( message === "setServerIpToRedis" ) {
            setIpToRedis(Config.ipAddress);

            setTimeout( getGenaratorIpAndBroadcast, 5); /// 5 sec
        }

        else if( message && /generatorIp/.test(message) ) {

            let ip = message.split('=')[1];

            if( ip === Config.ipAddress ) {

                global.eventEmiter.emit('setGeneratorMode');
            }
            else{
                global.eventEmiter.emit('setMessageHandlerMode');
            }
        }

    });
}


GeneratorChooser.prototype.choseAndNotyfyNewGenerator = function() {

    publisher.publish("serversCounter", "setServerIpToRedis");
}



let generatorChooser = null;
module.exports.GeneratorChooser = function() {

    if( generatorChooser === null ) generatorChooser = new GeneratorChooser();

    return generatorChooser;
}



