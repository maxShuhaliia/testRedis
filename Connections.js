const redis = require('redis');
const Config = require('./Config.json');
const redisClient = redis.createClient({host: Config.redis.host, port: Config.redis.port});

redisClient.on("error", function (err) {
    console.log("Error redisClient.on (err)" + err);
});
module.exports.redisClient = redisClient;

let subscriber =  redis.createClient({host: Config.redis.host, port: Config.redis.port});
subscriber.on("error", function (err) {
    console.log("Error subscriber.on (err)" + err);
});

let publisher  =  redis.createClient({host: Config.redis.host, port: Config.redis.port});

subscriber.on("error", function (err) {
    console.log("Error publisher.on (err)" + err);
});


module.exports.subscriber = subscriber
module.exports.publisher  = publisher;


