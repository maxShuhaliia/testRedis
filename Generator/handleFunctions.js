const Connection    = require('../Connections.js');

const redisClient   = Connection.redisClient;
let subscriber      = Connection.subscriber
let publisher       = Connection.publisher;


function hDel( key1, keys ) {

    redisClient.hdel(key1, keys, function (err, data) {
        if (err) {
            console.log("error in redisClient.set qps ", err);
            return false;
        }
    });
    
}


function getAllServerMessageHandlers( callback ) {

    publisher.publish("serversExchangeMesssage", "setOwnIpAndPidMessageHandlersToRedis");

    setTimeout( getAllClients, 3000 );

    function getAllClients() {

            let key  = "messageHandler";
        
            redisClient.hkeys(key, function (err, data) {
                if (err) {
                    console.log("error in redisClient.set qps ", err);
                    callback(null)
                    return false;
                }

                if( data && data.length > 0 )  hDel("messageHandler", data);


                return callback(data);
            });
    }
    
}
module.exports.getAllServerMessageHandlers = getAllServerMessageHandlers;







