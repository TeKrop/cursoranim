/*!
 * CursorAnim.js
 * https://github.com/TeKrop/cursoranim
 *
 * Copyright 2015 Valentin PORCHET
 * Released under the MIT license
 */
var CursorAnim = (function() {
    // private methods and attributes
    var mousePosition = null; // we track mouse position all the time
    var isDragging = false; // true when dragging an object
    var elementDragged = null; // identifier for the element dragged
    var lastTargettedElement = null; // using this for clicking last element we moved on
    var animating = false; // true when animation is ongoing
    var correctEvents = ["move", "click", "drag", "drop", "wait"]; // list of correct events
    var cursor = null; // we will target the fake cursor here
    var overlay = null; // we will target the newly created overlay here
    var animationDuration = 1000; // by default, all animations take 1s   
    var animationEasing = "easeInOutCubic"; // by default, this is the easing
    var animationCursor = "cursor_default.gif"; // default cursor image       
    var events = null; // initializing list of events
    
    // Don't know where else I could put this...
    $(document).on('mousemove', function(event){
        // event.which is false when mouse really moved
        // and not triggered by code. we want to save 
        // the real position of the mouse
        if (!event.which){
            mousePosition = { x: event.pageX, y: event.pageY };
        }
    });

    /**
     * onDragCustomEvent
     * Events to attach ONLY when animation is ongoing for drag and drop
     *
     * @param {event} event jQuery UI event
     * @param {ui} ui jQuery UI ui object
     */
    var onDragCustomEvent = function( event, ui ) {
        ui.position.left = cursor.offset().left - elementDragged.width() / 2 - cursor.width();
        ui.position.top = cursor.offset().top - elementDragged.height() / 2 - cursor.height();
    };

    /**
     * loadProcess
     * Function used to load data from a JSON file, JSON string or direct json data
     *
     * @param {String/Array} data JSON file name, JSON data in string or array format
     */
    var loadProcess = function(data) {
        // Init events tab
        var actions = null;
        var jsonData = null;

        // if the data isn't undefined, and if either a string (json file) or an array of data
        if (typeof data !== undefined){
            // we load the data depending of his nature
            if (typeof data === "string"){
                // we check if the string is jsonData or filename
                if (data.indexOf(".json", data.length - 5) !== -1){
                    // we load the data
                    $.ajax({
                        url: data,
                        async: false,
                        dataType: 'json',
                        success: function(json) {
                            jsonData = json;
                        }
                    });
                } else { // if it's JSON string, just parse it
                    try {
                        jsonData = JSON.parse(data);
                    } catch(e){
                        console.error(e.name + " : " + e.message);
                        throw new TypeError("Your string doesn't contain valid json data.");
                    }
                }                
            } else if (typeof data === "Array"){             
                // FIND A WAY TO CHECK THE DATA
                jsonData = data; // it's the data                
            } else {
                console.log(typeof data);
                throw new TypeError("CursorAnim data must be in json format, either by filename, string or array.");
            }

            actions = convertDataToEvents(jsonData);
            return actions;
        }
        
        // If undefined, return the current array of events
        console.warn("No data was passed, keeping the old data (null of just initialized");
        return events;
    };

    /**
     * convertDataToEvents
     * Subfunction of loadProcess, convert JSON data into an array of event functions
     *
     * @param {object} jsonData data containing the events
     */
    var convertDataToEvents = function(jsonData) {
        // Init the tab
        var actions = [];
        // Add initial event
        actions.push(hideCursor);
        // Loop over the actions , and add
        // the corresponding functions
        for (var i = 0; i < jsonData.length; i++){
            // if there is an action field in jsonData, it's ok
            if ("action" in jsonData[i]){
                // we verify that the function exists and is a correct one
                if (eval("typeof " + jsonData[i].action + " === 'function'") && (correctEvents.indexOf(jsonData[i].action) > -1)){
                    var functionContent = "return CursorAnim." + jsonData[i].action + "(";
                    // if options were provided
                    if ("options" in jsonData[i]){
                        functionContent += JSON.stringify(jsonData[i].options) + ", ";
                    } else {
                        functionContent += "{}, ";
                    }
                    functionContent += "callback);"; // we add the final content
                    actions.push(new Function("callback", functionContent)); // adding it in events array                        
                } else {
                    console.warn("The event '" + jsonData[i].action + "' doesn't exist. Skipping it.");
                }
            } else { // if there is no action field, incorrect event
                console.warn("Incorrect event : no action was provided. Skipping it.")
            }
        }
        // Add final events
        actions.push(returnToMousePosition, showCursor);
        // Return the result
        return actions;
    };

    /**
     * hideCursor
     * Function called to hide the current cursor and show the fake one
     * 
     * @param {function} callback callback function needed by Async.js
     */
    var hideCursor = function(callback) { 
        // we hide the cursor, add show the fake one and the overlay
        $("body").css('cursor', 'none');
        $("body").append('<img id="cursorAnim" alt="cursor animation" src="' + animationCursor + '"/>');
        $("body").append('<div id="overlayCursorAnim"></div>'); // we add an overlay to prevent user from clicking

        // we have to reaffect these values each time with re-append
        // the cursor and the overlay into body
        cursor = $("#cursorAnim");
        overlay = $("#overlayCursorAnim");

        // we initialize position
        cursor.css({
            "top" : mousePosition.y, 
            "left": mousePosition.x
        });
        callback();
    };

    /**
     * showCursor
     * Function called to show back the real cursor and remove the fake one and overlay
     *
     * @param {function} callback callback function needed by Async.js
     */
    var showCursor = function(callback) {
        $("body").css({cursor: 'default'});
        cursor.remove();
        overlay.remove();
        callback();
    };

    /**
     * returnToMousePosition
     * Function called at the end of the animation, to return to move
     * the fake cursor toward the real one
     *
     * @param {function} callback callback function needed by Async.js
     */
    var returnToMousePosition = function(callback) {
        cursor.animate({
            left: mousePosition.x,
            top : mousePosition.y
        }, {
            duration: animationDuration,
            specialEasing: {
                left: animationEasing,
                top : animationEasing
            },
            // Step function to follow the cursor until the end
            // without it, cursor image will be moved in the mousePosition
            // at the beginning of the animation and therefore not
            // follow user movements during animation
            step: function(now, fx) {
                if (fx.prop === "left"){
                    fx.end = mousePosition.x;
                } else { // top
                    fx.end = mousePosition.y;
                }
            },
            complete : callback
        });
    };

    /**
     * move
     * Function called to move the cursor from it's current position to 
     * an object position, identifiable by CSS selector
     *
     * @param {object} options concerning the movement (CSS selector and duration optional)
     * @param {function} callback callback function needed by Async.js
     */
    var move = function(options, callback) {
        // duration is the provided one or the default one is not provided
        var customDuration = parseInt(options.duration) || animationDuration;
        var customEasing = parseInt(options.easing) || animationEasing;

        // we verify that a selector was provided
        if ("selector" in options){
            // we store the targeted element in memory
            lastTargettedElement = $(options.selector);
            // using jQuery animate to do this
            cursor.animate({
                left: lastTargettedElement.offset().left + (lastTargettedElement.width() / 2) + cursor.width() / 2,
                top: lastTargettedElement.offset().top + (lastTargettedElement.height() / 2) + cursor.height() / 5 // don't know why /5 works well..
            }, {
                duration: customDuration,
                specialEasing: {
                    left: customEasing,
                    top: customEasing
                },
                step: function (now, fx) {
                    // if element is being dragged, we simulate the drag to trigger associated events
                    if (isDragging === true){
                        elementDragged.simulate('drag', { dx: 0, dy: 0 });
                    }
                },
                complete : callback // callback for Async.js once the animation is complete
            });
        } else {
            // incorrect : didn't provide any selector to move on
            console.warn("Didn't provide CSS selector for cursor to move on. Skipping.");
            callback(); // for Async.js, to continue the animation
        }
    };

    /**
     * click
     * Function called to click in the current fake cursor position
     *
     * @param {object} options (useless for click)
     * @param {function} callback callback function needed by Async.js
     */
    var click = function(options, callback) {
        lastTargettedElement.click(); // we simply click on it
        callback();
    };

    /**
     * drag
     * Function called to drag the element under the current fake cursor position
     *
     * @param {object} options (useless for drag)
     * @param {function} callback callback function needed by Async.js
     */
    var drag = function(options, callback) {
        isDragging = true; // changing the state of dragging
        elementDragged = lastTargettedElement; // we store the draggedElement
        elementDragged.bind("drag", onDragCustomEvent); // we bind our custom event
        callback();
    };

    /**
     * drop
     * Function called to drop the element under the current fake cursor position
     *
     * @param {object} options (useless for drop)
     * @param {function} callback callback function needed by Async.js
     */
    var drop = function(options, callback) {
        // unbinding the custom event
        elementDragged.unbind("drag");
        isDragging = false;
        elementDragged = null;
        callback();
    };

    /**
     * wait
     * Function called to wait a certain amount of time
     *
     * @param {object} options for waiting (duration)
     * @param {function} callback callback function needed by Async.js
     */
    var wait = function(options, callback) {
        // we take the duration of waiting if provided, else default duration
        var customDuration = parseInt(options.duration) || animationDuration;      
        setTimeout(callback, customDuration);
    };

    // public methods and attributes
    return {
        /**
         * setOptions
         * set custom options for the cursor animation
         *
         * @param {object} general options of CursorAnim
         */  
        setOptions: function(options) {
            // using Module Pattern 
            if ((options === null)||(typeof options === "undefined")){
                options = {};
            }
            // if we provided an animationDuration
            if ("animDuration" in options){ // if it's a correct duration (int or string), we take it
                animationDuration = (parseInt(options.animDuration) !== NaN) ? options.animDuration : animationDuration;
            }
            // if we provided an easing
            if ("animEasing" in options){ // if it's a correct easing
                animationEasing = ($.easing[options.animEasing] !== undefined) ? options.animEasing : animationEasing; 
            }
            // if we provided a cursor custom img
            if ("animCursor" in options){
                // we check if the image exists and is correct
                var img = new Image();
                img.src = options.animCursor;        
                animationCursor = (img.height != 0) ? options.animCursor : animationCursor;
            }            
            // if we have data in option, load it
            if ("data" in options){
                try {
                    events = loadProcess(options.data);
                } catch(e) {
                    console.error(e.name + " : " + e.message);
                    events = null;
                }
            }
        },

        /**
         * start
         * Function called when we want to start the loaded animation
         */
        start: function() {
            if ((events !== null) && (events !== {})){
                // Begin the animation
                animating = true;
                // trigger the series of async events
                async.series(events, function(err) {
                    if (err === null){
                        console.log('animation complete');
                    } else {
                        console.log("Error : " + err);
                    }
                    animating = false;
                });
            } else {
                console.warn("start was called but the list of events was empty or inexistant.")
            }
        },

        /**
         * pause
         * Function called when we want to pause an animation
         */
        pause: function() {
            cursor.pause();
        },

        /**
         * resume
         * Function called when we want to resume an animation
         */
        resume: function() {
            cursor.resume();
        },

        /**
         * stop
         * Function called when we want to stop an animation
         */
        stop: function() {
            cursor.stop();
        },

        move: move,
        click: click,
        drag: drag,
        drop: drop,
        wait: wait
    };
}());