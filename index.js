"use strict";
const events         = require('events');
global.eventEmiter    = new events.EventEmitter();
const generator      = require('./Generator/Generator').createGenerator();
const errorHandler   = require('./ErrorHandler/ErrorHandler.js').createErrorHandler();
const messageHandler = require('./MessageHandler/MessageHandler.js').createMessageHandler( errorHandler );
const ApplicationMode  = require('./applicationModeHandler.js').createApplicationMode();

const Connection    = require('./Connections.js');
let publisher       = Connection.publisher;


global.eventEmiter.on('setGeneratorMode', () => {
    isGenerator = true;
    runApplication();
});

global.eventEmiter.on('setMessageHandlerMode', () => {

    isMessageHandler = true;
    runApplication();
});

global.eventEmiter.on("readMessage", () => {
    runMessageHandler();
});


global.isGeneratorMode = false;
global.isErrorMode     = false;
global.isMessageMode   = false;

ApplicationMode.getMode(( mode ) => {

    if( mode === "ErrorsMode" ) {
        
        global.isErrorMode = true;
    }
    else if( mode === "GeneratorMode" ) {

        global.isGeneratorMode = true;
    }
    else if(  mode === "MessageMode" ) {
        
        global.isMessageMode = true;
    }

    
    runApplication();
});


function generatorChecking() {

    ApplicationMode.isThisInstanceGenerator( (isGeneratorCurrentMachine) => {

        if( isGeneratorCurrentMachine === true && global.isMessageMode === true ) {
            global.isMessageMode = false;
            global.isGeneratorMode = true;
            runApplication();
        }
    });
}



setInterval( generatorChecking, 10000 )


global.intervalGeneratorMode = null;
global.intervalMessageMode   = null;

function runApplication() {


    printMode();



    if( global.isGeneratorMode === true ) intervalGeneratorMode = setInterval( runGenerator, 500);
    
    else if( global.isErrorMode === true )  errorHandler.printAllErrorsAndDelete();

    else if( global.isMessageMode === true ) {

        // not doing anything  => generator solve who will be recieve message

    }//  intervalMessageMode = setInterval( runMessageHandler, 500);
}


function runGenerator() {

    generator.generateMessageAndSetToRedis( ( result ) => {

        let ipAndPid = generator.getRandomIpAndPidOfClient();

        if( !ipAndPid ) return false;

        publisher.publish("serversExchangeMesssage", "getMessage=" + ipAndPid);

    });
}

function runMessageHandler() {
    messageHandler.getMessageAndCheckOnError( ( err ) => {

        if( err === "messageNotExists" ) {
            console.log('message not exists');
        }
        else if( err ) {
            console.log('error in messageHandler.getMessageAndCheckOnError()', err);
        }
        else {
           // console.log('ok')
        }
    });
}

function printMode() {

    let mode = "";

    if( global.isGeneratorMode === true )       mode = "GeneratorMode";

    else if( global.isErrorMode === true )      mode = "ErrorMode";

    else if( global.isMessageMode === true )    mode = "MessageMode";

    console.log('application run in  ', mode);
}
