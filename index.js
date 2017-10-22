const generator      = require('./Generator/Generator').createGenerator();
const errorHandler   = require('./ErrorHandler/ErrorHandler.js').createErrorHandler();
const messageHandler = require('./MessageHandler/MessageHandler.js').createMessageHandler( errorHandler );

const GeneratorChooser = require('./serverGeneratorChooser.js').GeneratorChooser();

const events = require('events');

GeneratorChooser.subscribeOnServersMessages();

function checkIsGetErrorsMode() {

    for( let i = 0; i < process.argv.length ; i++ ) {

        let parameter = process.argv[i];
        if( parameter === 'getErrors' ) return true;
    }

    return false;
}


function runGenerator() {

    generator.generateMessageAndSetToRedis( ( result ) => {
       // console.log('result', result);
    });
}

function setUpGenerator() {
    if( intervalMessageHandler ) clearInterval(intervalMessageHandler);
    if( intervalGenerator )      clearInterval(intervalGenerator);

    GeneratorChooser.choseAndNotyfyNewGenerator();
}


function runMessageHandler() {
    messageHandler.getMessageAndCheckOnError( ( err ) => {

        if( err === "generatorGoneAway" ) {
            setUpGenerator();
        }
        else if( err ) {
            console.log('error in messageHandler.getMessageAndCheckOnError()', err);
        }
        else {
          //  console.log('ok')
        }


    });
}


let isGetErrorsMode = checkIsGetErrorsMode();

let isGenerator      = false;
let isMessageHandler = false;

let intervalMessageHandler = null;
let intervalGenerator      = null;

function printMode() {
    if( isGenerator )           console.log('Generator mode');
    if( isMessageHandler )      console.log('Message Handler mode');
    if( isGetErrorsMode )       console.log('Errors mode');
}


function runApplication() {

    // isGenerator = false;
    // isGetErrorsMode  = false;
    // isMessageHandler = true;

    printMode();

    if( isGetErrorsMode === true ) errorHandler.printAllErrorsAndDelete();

    else if( isGenerator === true ) intervalGenerator = setInterval( runGenerator, 500);

    else if( isMessageHandler === true ) intervalMessageHandler = setInterval( runMessageHandler, 500);
}


global.eventEmiter = new events.EventEmitter();

global.eventEmiter.on('setGeneratorMode', () => {
    isGenerator = true;
    runApplication();
});

global.eventEmiter.on('setMessageHandlerMode', () => {

    isMessageHandler = true;
    runApplication();
});

if( isGetErrorsMode ) {
    runApplication();
}
else {
    setUpGenerator();
}