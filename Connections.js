const redis = require('redis');
const Config = require('./Config.json');
const redisClient = redis.createClient({host: '88.214.193.71',
                                         port: 6379});

redisClient.on("error", function (err) {
    console.log("Error " + err);
});
module.exports.redisClient = redisClient;

let subscriber =  redis.createClient({host: '88.214.193.71',
    port: 6379});
let publisher =  redis.createClient({host: '88.214.193.71',
    port: 6379});


module.exports.subscriber = subscriber
module.exports.publisher  = publisher;


