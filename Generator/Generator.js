const Connection    = require('../Connections.js');
const redisClient   = Connection.redisClient;
const Config        = require('../Config.json');

let generator       = null;

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

          //  let ttl = Math.floor(Date.now() / 1000) + Config.expireMessage;  // 2 sec
            let ttl = Math.floor(Date.now() / 1000) + 100000;  // 2 sec

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

        setRecordToRedis( message, doneCallback );
    }
}

module.exports.createGenerator = () => {

    if( !generator )  generator = new Generator(redisClient);

    return generator;
}
