const redis = require('redis');
const Config = require('./Config.json');
const redisClient = redis.createClient();

redisClient.on("error", function (err) {
    console.log("Error " + err);
});
module.exports.redisClient = redisClient;

let subscriber =  redis.createClient();
let publisher =  redis.createClient();


module.exports.subscriber = subscriber
module.exports.publisher  = publisher;


