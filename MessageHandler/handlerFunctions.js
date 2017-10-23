function getMessage( callback, redisClient ) {

    let key    = "newMessage";

    redisClient.get( key, (err, message ) => {
        if (err) {
            return callback( err );
        }

        return callback( null, message );
    });
}

function getArrayWaterfallFunctions( redisClient ) {
    let arrayFunctions = [];

    /// get message
    arrayFunctions.push(

        function ( callback ) {

            return getMessage( callback, redisClient );
        });


    arrayFunctions.push(

        function ( message, callback ) {


            //  if record not exists in redis => generator gone away
            if( message === null ) return callback(null, "messageNotExists");

            // check on error message
            return eventHandler( message, callback )
        }
    );

    return arrayFunctions;
}
module.exports.getArrayWaterfallFunctions = getArrayWaterfallFunctions;


function eventHandler(msg, callback){

    function onComplete(){

        var error = Math.random() > 0.85;
        callback(error, msg);
    }
// processing takes time...
    setTimeout(onComplete, Math.floor(Math.random()*1000));
}