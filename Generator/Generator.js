const Connection    = require('../Connections.js');
const Config        = require('../Config.json');
const handleFunctions = require('./handleFunctions.js');

const redisClient   = Connection.redisClient;


let generator       = null;

let redisClientsArray = [];

function setAllServerMessageHandlers () {
    handleFunctions.getAllServerMessageHandlers( ( clientsArray ) => {
        redisClientsArray = clientsArray;

        //console.log('redisClientsArray', redisClientsArray);
    });
}

setTimeout(setAllServerMessageHandlers, 7000); //7 sec
setInterval(setAllServerMessageHandlers, 20000);  // 20 sec


function Generator( redicClient ) {

    function getMessage() {

        this.cnt = this.cnt || 0;

        return this.cnt++;
    }

    getMessage.bind(this);


    function setRecordToRedis( message, doneCallback ) {

        let key    = "newMessage";
        let record =  message;

        redisClient.set(key, record, (err, status) => {
            if (err || status !== 'OK') {
                return doneCallback(err);
            }

            let ttl = Math.floor(Date.now() / 1000) + Config.redis.expireMessage;  // 5 sec

            redisClient.expireat(key, ttl, (err, status) => {
                if (err || status !== 1) {
                    return doneCallback(err);
                }
                return doneCallback(null);
            });
        });
    }

    this.generateMessageAndSetToRedis = function( doneCallback ) {

        let message = getMessage();

        setRecordToRedis( message, () => {

            doneCallback();
            // global.eventEmiter.emit('', () => {
            //
            // });

        });
    }
}

Generator.prototype.getRandomIpAndPidOfClient = function() {


    if( redisClientsArray.length === 0 ) return '';

    let randomIndex = Math.floor(Math.random() * redisClientsArray.length);


    return redisClientsArray[randomIndex];
}


module.exports.createGenerator = () => {

    if( !generator )  generator = new Generator(redisClient);

    return generator;
}
