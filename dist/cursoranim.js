/*!
 * CursorAnim.js
 * https://github.com/TeKrop/cursoranim
 *
 * Copyright 2015 Valentin PORCHET
 * Released under the MIT license
 */

// override jquery simulate functions to prevent the drag simulated
// event to trigger "mouseup" events, and create drop event instead
// that triggers "mouseup" events
function findCenter(t){'use strict';var e,o=$(t.ownerDocument);return t=$(t),e=t.offset(),{x:e.left+t.outerWidth()/2-o.scrollLeft(),y:e.top+t.outerHeight()/2-o.scrollTop()};}
function findCorner(o){'use strict';var r,e=$(o.ownerDocument);return o=$(o),r=o.offset(),{x:r.left-e.scrollLeft(),y:r.top-e.scrollTop()};}
$.extend( $.simulate.prototype, {
    simulateDrag: function() {
        'use strict';
        var i = 0,
            target = this.target,
            eventDoc = target.ownerDocument,
            options = this.options,
            center = options.handle === 'corner' ? findCorner( target ) : findCenter( target ),
            x = Math.floor( center.x ),
            y = Math.floor( center.y ),
            coord = { clientX: x, clientY: y },
            dx = options.dx || ( options.x !== undefined ? options.x - x : 0 ),
            dy = options.dy || ( options.y !== undefined ? options.y - y : 0 ),
            moves = options.moves || 3;

        this.simulateEvent( target, 'mousedown', coord );

        for ( ; i < moves ; i++ ) {
            x += dx / moves;
            y += dy / moves;

            coord = {
                clientX: Math.round( x ),
                clientY: Math.round( y )
            };

            this.simulateEvent( eventDoc, 'mousemove', coord );
        }

        if ( $.contains( eventDoc, target ) ) {
            this.simulateEvent( target, 'click', coord );
        }
    },
    simulateDrop: function() {
        'use strict';
        var i = 0,
            target = this.target,
            eventDoc = target.ownerDocument,
            options = this.options,
            center = options.handle === 'corner' ? findCorner( target ) : findCenter( target ),
            x = Math.floor( center.x ),
            y = Math.floor( center.y ),
            coord = { clientX: x, clientY: y },
            dx = options.dx || ( options.x !== undefined ? options.x - x : 0 ),
            dy = options.dy || ( options.y !== undefined ? options.y - y : 0 ),
            moves = options.moves || 3;

        this.simulateEvent( target, 'mousedown', coord );

        for ( ; i < moves ; i++ ) {
            x += dx / moves;
            y += dy / moves;

            coord = {
                clientX: Math.round( x ),
                clientY: Math.round( y )
            };

            this.simulateEvent( eventDoc, 'mousemove', coord );
        }

        if ( $.contains( eventDoc, target ) ) {
            this.simulateEvent( target, 'mouseup', coord );
            this.simulateEvent( target, 'click', coord );
        } else {
            this.simulateEvent( eventDoc, 'mouseup', coord );
        }
    }
});
// main code of CursorAnim
var CursorAnim = (function() {
    'use strict';
    // private methods and attributes
    var mousePosition = {x: 0, y: 0}; // we track mouse position all the time
    var isDragging = false; // true when dragging an object
    var draggedElement = null; // identifier for the dragged element
    var lastTargettedElement = null; // using this for clicking last element we moved on
    var animating = false; // true when animation is ongoing
    var correctEvents = ['move', 'click', 'drag', 'drop', 'wait', 'type']; // list of correct events
    var cursor = null; // we will target the fake cursor here
    var overlay = null; // we will target the newly created overlay here
    var animationDuration = 1000; // by default, all animations take 1s
    var animationEasing = 'easeInOutCubic'; // by default, this is the easing
    var animationCursor = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAATCAYAAACk9eypAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH3wcFCgwPm9//MwAAAB1pVFh0Q29tbWVudAAAAAAAQ3JlYXRlZCB3aXRoIEdJTVBkLmUHAAACcElEQVQoz22Sb09TdxTHvy2XFEyMbkozK50GNaTdjIbEByQ+MgGZFKOYQJbtyXwlxvfhE81eAOHhttCEjjYCRjSoI2CFjSWkEaz33vb23vv7fXxQKP47yUnOg/M533NOvsoNDlEpLwlLO0FBEAjYT/NRjXT61HkmCpOUFxb1bs9LHEDWWoVh+EkzIA2c/YGN9S0mb0/z8sV6BwrD+ItmQDo/cBEsvKluM3l7mvLCorCoXndlzJeg0ifPYGLAwsb6FhOFycObvqaQzeZwXReAOI6pVjcZHR377BGRLKEgagMAjUYDgCgy7O6+Y+x6oQPFJhAYxXHYBowxADSbzX0ly/Z/OxTGb1Gar3TW8TyvDURRBIC1tqOyt+tSff0vN366SaXyWL7fPLzhIIwx+H6TIAgxMXhuwPLSCqMj41TKy8J+BHie15ler7u475tsbf6P77WoLKzw8/Rd/vqzpEQ2m2Nt7Yl6enpkjNHeXl29vb2KQiPHcVSr1WRiRzs7O7p//54cSXIcR3Ecy/M8RVHU3pWkpqamlEqlJHpkrZExRvo+e4FGMyJoGf5Zq3Iqc4YHD36nVnO5dq3AzMwfAmRM24TqP32OVmh5urLK8W/6KFeWdenyFba331IqLTE0dJUDM7ZaLSWTSWl19blGRkY0NzeXyOVyyufzKhaLSqfT6u/PaHZ2VolEQl1dXdLNiTv0pb+j9HdZYWRkQUvLz/TjxSGePX/F/Pwiw8PDNBoNAXIePXqYOHrsiOLYynGSkqR8PqdMJiPf9/XtieNKpVLq7u6WJAmLDFZB2JLBqhXGCiMjvxFq4Nwgv/z6G8VisWOPD8bOS8l4Tfm3AAAAAElFTkSuQmCC';
    var animationCallback = null; // callback function to call at the end of the animation
    var events = null; // initializing list of events
    var currentPosition = {x: 0, y: 0}; // starting position for dragging

    // function to update the real mouse position
    $(document).on('mousemove', function(event) {
        // event.relatedTarget is null when we move the mouse
        // is equals to html when triggered with simulate
        // works on Chrome and Firefox, check on other browsers...
        if (event.relatedTarget === null){
            mousePosition = { x: event.pageX, y: event.pageY };
        }
    });

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

        // we load the data depending of his nature
        if (typeof data === 'string') {
            // we check if the string is jsonData or filename
            if (data.indexOf('.json', data.length - 5) !== -1){
                // we load the data
                $.ajax({
                    url: data,
                    async: false,
                    dataType: 'json',
                    mimeType: 'application/json',
                    success: function(json) {
                        jsonData = json;
                    }
                });
            } else { // if it's JSON string, just parse it
                try {
                    jsonData = JSON.parse(data);
                } catch(e){
                    console.error(e.name + ' : ' + e.message);
                    throw new TypeError('Your string doesn\'t contain valid json data.');
                }
            }
        } else if (typeof data === 'object') {
            // we try to stringify it and re parse it.
            // if it works, it's JSON data
            data = JSON.parse(JSON.stringify(data));
            jsonData = data; // it's the data
        } else {
            throw new TypeError('CursorAnim data must be in json format, either by filename, string or array. You provided : ' + (typeof data));
        }

        actions = convertDataToEvents(jsonData);
        return actions;
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
        for (var i = 0; i < jsonData.length; i++) {
            // if there is an action field in jsonData, it's ok
            if ('action' in jsonData[i]) {
                // we verify that the function exists and is a correct one
                if (eval('typeof ' + jsonData[i].action + ' === "function"') && (correctEvents.indexOf(jsonData[i].action) > -1)) {
                    var functionContent = 'return CursorAnim.' + jsonData[i].action + '(';
                    // if options were provided
                    if ('options' in jsonData[i]) {
                        functionContent += JSON.stringify(jsonData[i].options) + ', ';
                    } else {
                        functionContent += '{}, ';
                    }
                    functionContent += 'callback);'; // we add the final content
                    actions.push(new Function('callback', functionContent)); // adding it in events array
                } else {
                    console.warn('The event "' + jsonData[i].action + '" doesn\'t exist. Skipping it.');
                }
            } else { // if there is no action field, incorrect event
                console.warn('Incorrect event : no action was provided. Skipping it.');
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
        // we init all values just in case
        isDragging = false;
        draggedElement = null;
        lastTargettedElement = null;
        animating = false;
        // we hide the cursor, add show the fake one and the overlay
        $('body').css({cursor: 'none'});
        $('body').append('<img id="cursorAnim" alt="cursor animation" src="' + animationCursor + '"/>');
        $('body').append('<div id="overlayCursorAnim"></div>'); // we add an overlay to prevent user from clicking

        // we disable scrolling
        var x = window.scrollX;
        var y = window.scrollY;
        window.onscroll=function(){window.scrollTo(x, y);};

        // we have to reaffect these values each time with re-append
        // the cursor and the overlay into body
        cursor = $('#cursorAnim');
        overlay = $('#overlayCursorAnim');

        // we initialize position
        cursor.css({
            'top' : mousePosition.y,
            'left': mousePosition.x
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
        // we now make the cursor appear
        $('body').css({cursor: 'auto'});
        cursor.remove();
        overlay.remove();

        // we put back the original onscroll function (enable scrolling)
        window.onscroll=function(){};

        // if something is still dragged, we drop it
        if (isDragging === true) {
            isDragging = false;
            drop({}, callback);
        } else {
            callback(); // normal callback call
        }
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
                if (fx.prop === 'left') {
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
        var customEasing = options.easing || animationEasing;

        // we will store the last left and top values for each
        // time we go into the loop, for the step function
        var lastLeft = cursor.offset().left;
        var lastTop = cursor.offset().top;
        var destinationLeft = null;
        var destinationTop = null;

        // we verify that a selector or a position was provided
        if (('selector' in options)||('position' in options)) {
            // we store the targetted element in memory (either with selector or position if no selector provided)
            if ('selector' in options) {
                lastTargettedElement = $(options.selector);

                // if the element exists
                if (lastTargettedElement.length) {
                    // cursor destination
                    destinationLeft = lastTargettedElement.offset().left + (lastTargettedElement.outerWidth() / 2);
                    destinationTop = lastTargettedElement.offset().top + (lastTargettedElement.outerHeight() / 2);
                } else {
                    showCursor(callback); // we display back the original cursor
                    throw new ReferenceError('The object ' + options.selector + ' targetted by the move function doesn\'t exists.');
                }
            } else { // position
                // if the position corresponds to an element, we assign in lastTargetted, else we keep the old value
                var temp = document.elementFromPoint(parseInt(options.position.x), parseInt(options.position.y));
                lastTargettedElement = (temp === null) ? lastTargettedElement : $(temp);
                // cursor destination
                destinationLeft = options.position.x;
                destinationTop = options.position.y;
            }

            // if we are dragging, trigger a different animation
            if (isDragging === true) {
                // we put the default values for dragged element
                // destination position
                var isClone = draggedElement.draggable('option').helper === 'clone';
                var positiveScrollTop = $(window).scrollTop() > 0;
                var draggedDestinationLeft = destinationLeft;
                var draggedDestinationTop = destinationTop;

                // depending on scroll of the page, and if the dragged element is
                // a clone, we substract the position of the cursor
                if (positiveScrollTop) {
                    draggedDestinationLeft -= cursor.position().left;
                    draggedDestinationTop -= cursor.position().top;
                } else {
                    draggedDestinationLeft -= (!isClone) ? cursor.position().left : 0;
                    draggedDestinationTop -= (!isClone) ? cursor.position().top : 0;
                }

                console.log(draggedDestinationLeft);
                console.log(draggedDestinationTop);
                // we put the initial values in starting position
                // if the page was scrolled, then we use the position
                // for initial position for clone helpers
                if (positiveScrollTop) {
                    currentPosition = {
                        x: draggedElement.position().left,
                        y: draggedElement.position().top
                    };
                } else { // else, we just use the offset
                    currentPosition = {
                        x: draggedElement.offset().left,
                        y: draggedElement.offset().top
                    };
                    // we add class draggable clone in this case, because with
                    // beginPosition defined with offset, we need the position : fixed
                    // property to be on the clone. Didn't find another way to do
                    // the job for this case, feel free to share if you have a better way
                    draggedElement.addClass('cursoranim-draggable-clone');
                }

                // if this is not a clone, we center the element on the cursor in the
                // beginning of the animation (we move it depending on his width and height)
                if (!isClone) {
                    currentPosition.x -= draggedElement.width() / 2;
                    currentPosition.y -= draggedElement.height() / 2;
                // else if this is a clone, we simulate a drag event in order to
                // create the clone and then we set the clone as the dragged element
                } else {
                    draggedElement.simulate('drag', {dx: 1, dy: 1});
                    draggedElement = $('.ui-draggable-dragging');

                    // we also update the dragged destination if the page was scrolled
                    draggedDestinationLeft += ((positiveScrollTop) ? 1 : -1) * draggedElement.width() / 2;
                    draggedDestinationTop += ((positiveScrollTop) ? 1 : -1) * draggedElement.height() / 2;
                }

                // begin the animation of the cursor
                cursor.animate({
                    left: destinationLeft,
                    top: destinationTop
                }, {
                    duration: customDuration,
                    specialEasing: {
                        left: customEasing,
                        top: customEasing
                    },
                    queue: false, // to be able to run the animation for the dragged element as well
                    complete : callback // callback for Async.js once the animation is complete
                });

                // And in the same time or the dragged element
                draggedElement.animate({
                    left: draggedDestinationLeft,
                    top: draggedDestinationTop
                }, {
                    duration: customDuration,
                    specialEasing: {
                        left: customEasing,
                        top: customEasing
                    },
                    queue: false
                });

            } else { // else we just animate the movement
                // using jQuery animate to do this
                cursor.animate({
                    left: destinationLeft,
                    top: destinationTop
                }, {
                    duration: customDuration,
                    specialEasing: {
                        left: customEasing,
                        top: customEasing
                    },
                    complete : callback // callback for Async.js once the animation is complete
                });
            }
        } else {
            // incorrect : didn't provide any selector to move on
            console.warn('Didn\'t provide CSS selector or position for cursor to move on. Skipping.');
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
        draggedElement = lastTargettedElement; // we store the draggedElement

        // if this is not a draggable element, throw an error
        if (!draggedElement.is(':data(ui-draggable)')) {
            throw new Error('The element ' + draggedElement.selector + ' is not draggable. Please use drag only on jQuery UI draggable elements.');
        }

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
        // we remove the class draggable-clone in case it has been added
        draggedElement.removeClass('cursoranim-draggable-clone');

        // in order to make the drop working, we have to trigger a moving
        // drag event ({dx: 0, dy: 0} won't work) and then trigger the
        // drop event on the targetted element
        draggedElement.simulate('drag', {dx: 1, dy: 1});
        lastTargettedElement.simulate('drop', {target: draggedElement});

        // we reinitialize the variables
        // concerning drag and drop
        isDragging = false;
        draggedElement = null;
        currentPosition = {x: 0, y: 0};
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

    /**
     * type
     * Function called to type a text into a textinput or textarea
     *
     * @param {object} options for typing (duration, text)
     * @param {function} callback callback function needed by Async.js
     */
    var type = function(options, callback) {
        // we check if the targettedElement is input or textarea
        if (lastTargettedElement.is('input') || lastTargettedElement.is('textarea')) {
            // we check that a text was provided and
            if ('strings' in options) {
                // we calculate the mean string length, to determine
                // the duration of one letter input depending on
                // animation duration
                var sum = 0;
                for (var i = 0; i < options.strings.length; i++) {
                    sum += options.strings[i].length;
                }
                var averageLength = sum / options.strings.length;
                var animationTypingSpeed = parseInt(animationDuration / averageLength);

                // focus on the input
                lastTargettedElement.simulate('focus');
                // we now use typed.js to type dynamically
                lastTargettedElement.typed({
                    strings: options.strings,
                    typeSpeed: options.typeSpeed || animationTypingSpeed,
                    startDelay: options.startDelay || 0,
                    backSpeed: options.backSpeed || animationTypingSpeed,
                    backDelay: options.backDelay || 500,
                    contentType: 'text',
                    onStringTyped: function() {
                        lastTargettedElement.trigger('propertychange');
                    },
                    callback: function(){
                        // we unfocus (blur) the text input before finishing
                        lastTargettedElement.simulate('blur');
                        // remove data from typed in case we want to run it
                        // a second time on the same element.
                        lastTargettedElement.removeData('typed');
                        callback();
                    }
                });
            } else {
                console.warn('type function was called without text. Skipping.');
                callback();
            }
        } else {
            console.warn('the targetted div isn\'t an input or textarea. Skipping.');
            callback();
        }
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
            if ((options === null)||(typeof options === 'undefined')) {
                options = {};
            }
            // if we provided an animationDuration
            if ('defaultDuration' in options) { // if it's a correct duration (int or string), we take it
                animationDuration = (!isNaN(parseInt(options.defaultDuration))) ? options.defaultDuration : animationDuration;
            }
            // if we provided an easing
            if ('defaultEasing' in options) { // if it's a correct easing
                animationEasing = ($.easing[options.defaultEasing] !== undefined) ? options.defaultEasing : animationEasing;
            }
            // if we provided a cursor custom img
            if ('cursor' in options) {
                // we put the new cursor
                animationCursor = (typeof options.cursor === 'string') ? options.cursor : animationCursor;
            }
            // if we have data in option, load it
            if ('data' in options) {
                try {
                    events = loadProcess(options.data);
                } catch(e) {
                    console.error(e.name + ' : ' + e.message);
                    events = null;
                }
            }
            // if we provided a callback function to call at the end of the animation
            if ('callback' in options) {
                animationCallback = (typeof eval(options.callback) === 'function') ? options.callback : null;
            }
        },

        /**
         * load
         * function to load new data
         *
         * @param {String/Array} data JSON file name, JSON data in string or array format
         */
        load: function(data) {
            if ((data === null)||(typeof data === 'undefined')) {
                console.warn('No data was passed, keeping the old data (null if just initialized)');
            } else {
                try {
                    events = loadProcess(data);
                } catch(e) {
                    console.error(e.name + ' : ' + e.message);
                }
            }
        },

        /**
         * start
         * Function called when we want to start the loaded animation
         */
        start: function() {
            if ((events !== null) && (events !== {})) {
                // Begin the animation
                animating = true;
                // trigger the series of async events
                async.series(events, function(err) {
                    if (err === null){
                        console.log('animation complete');
                        // if the user has set a callback, go
                        if (animationCallback !== null) {
                            console.log('callback triggered');
                            animationCallback();
                        }
                    } else {
                        console.log('Error : ' + err);
                    }
                    animating = false;
                });
            } else {
                console.warn('start was called but the list of events was empty or inexistant.');
            }
        },

        /**
         * pause
         * Function called when we want to pause an animation
         */
        pause: function() {
            //cursor.pause(); buggy, will try to implement this later
        },

        /**
         * resume
         * Function called when we want to resume an animation
         */
        resume: function() {
            //cursor.resume(); buggy, will try to implemente this later
        },

        /**
         * stop
         * Function called when we want to stop an animation
         */
        stop: function() {
            //cursor.stop(); buggy, will try to implemente this later
        },

        move: move,
        click: click,
        drag: drag,
        drop: drop,
        wait: wait,
        type: type
    };
}());