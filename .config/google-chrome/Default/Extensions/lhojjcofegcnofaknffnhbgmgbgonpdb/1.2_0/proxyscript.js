var port;
var embed;
var repaintNeeded;
var repaintCounter;

document.addEventListener("DOMContentLoaded", onLoadComplete);

function onLoadComplete()
{
    embed = document.getElementById("xyzzy");
    
    // Resize the div to cover the whole content area
    document.body.setAttribute("style", "border-width:0px;outline-width:0px;margin:0px;padding:0px");
    embed.setAttribute("style", "border-width:0px;outline-width:0px;margin:0px;text-align:center;font-size:250%");
    embed.style.height = getDimension("height");
    embed.style.width = getDimension("width");
    embed.style.backgroundImage = "none";
    embed.style.backgroundRepeat = "no-repeat";
    embed.style.backgroundColor = "white";
    embed.innerText = "Loading plug-in...";
        
    // Connect to the plugin host
    port = chrome.runtime.connect();
    port.onMessage.addListener(onMessage);

    // Hook mouse events
    document.body.addEventListener("mousedown", onMouseDown);
    document.body.addEventListener("mouseup", onMouseUp);
    document.body.addEventListener("mousemove", onMouseMove);
    document.body.addEventListener("wheel", onMouseWheel);

    // Hook key events
    document.body.addEventListener("keydown", onKeyDown);
    document.body.addEventListener("keyup", onKeyUp);
    document.body.addEventListener("keypress", onKeyPress);
    
    // Suppress the context menu
    document.body.addEventListener("contextmenu", function(event){event.preventDefault();});

    // Set up a redraw timer
    setInterval(doTimer, 100);
    repaintNeeded = 0;
    repaintCounter = 5;
    
    // Grab focus
    document.body.focus();
    
    // Load the plugin and send the plugin parameters off to the plugin host
    var msg = getQueryParams();
    msg.type = "connect";
    port.postMessage(msg);
    
    // Size the plugin window
    var windowMsg = {};
    windowMsg.type = "setwindow";
    windowMsg.width = document.getElementById("xyzzy").style.width;
    windowMsg.height = document.getElementById("xyzzy").style.height;
    port.postMessage(windowMsg);
    
    // Fetch the plugin content
    var tstGet = new XMLHttpRequest();
    var tstSrc = getQueryParam("src");
    tstGet.open('GET', tstSrc, true);
    tstGet.responseType = "blob";
    tstGet.onload = function(e) {
        var reader = new FileReader();
        reader.onloadend = function() {
            var msg = {};
            msg.type = "file";
            msg.nfydata = "0x0";
            msg.result = "0";
            msg.url = tstSrc;
            msg.mimetype = getQueryParam("mimetype") || tstGet.getResponseHeader("Content-Type");   /* Servers often respond with bogus MIME types for plugin data, so prefer the type specified by the embed params. */
            msg.data = reader.result;
            port.postMessage(msg);
            repaintNeeded = 3;
        };
        reader.readAsDataURL(tstGet.response);
    };
    tstGet.onreadystatechange = function() { checkUrlTimeout(tstGet, "0x0", tstSrc, getQueryParam("mimetype")); };
    tstGet.send();
}

/* Return a named parameter from the query string */
function getQueryParam(param)
{
    var query = document.location.search.substring(1);
    var pairs = query.split('&');
    
    for(var i = 0; i < pairs.length; i++)
    {
        var name_val = pairs[i].split("=");
        if(decodeURIComponent(name_val[0]).toLowerCase() == param)
        {
            return decodeURIComponent(name_val[1]);
        }
    }
    return undefined;
}

/* Return a list of all non-internal parameters */
function getQueryParams()
{
    var query = document.location.search.substring(1);
    var pairs = query.split('&');
    var params = {};
    
    for(var i = 0; i < pairs.length; i++)
    {
        var name_val = pairs[i].split("=");
        if(!/^__TGEQ__/.test(name_val[0]))
        {
            params[decodeURIComponent(name_val[0]).toLowerCase()] = decodeURIComponent(name_val[1]);
        }
    }
    return params;
}

function getDimension(name)
{
    var dimensionVal = getQueryParam(name);
    if(!(/(px|em|pt)$/i.test(dimensionVal)))
    {
        dimensionVal = dimensionVal + "px";
    }
    return dimensionVal;
}

function onMouseDown(event)
{
    var msg = {};
    msg.x = event.clientX;
    msg.y = event.clientY;
    msg.ctrl = event.ctrlKey;
    msg.shift = event.shiftKey;
    if(event.which == 1)
    {
        msg.type = "lbuttondown";
    }
    else if(event.which == 3)
    {
        msg.type = "rbuttondown";
    }
    else if(event.which == 2)
    {
        msg.type = "mbuttondown";
    }
    else
    {
        return;
    }
    port.postMessage(msg);
    repaintNeeded = 1;
}

function onMouseUp(event)
{
    var msg = {};
    msg.x = event.clientX;
    msg.y = event.clientY;
    msg.ctrl = event.ctrlKey;
    msg.shift = event.shiftKey;
    if(event.which == 1)
    {
        msg.type = "lbuttonup";
    }
    else if(event.which == 3)
    {
        msg.type = "rbuttonup";
    }
    else if(event.which == 2)
    {
        msg.type = "mbuttonup";
    }
    else
    {
        return;
    }
    port.postMessage(msg);
    repaintNeeded = 1;
}

function onMouseMove(event)
{
    var msg = {};
    msg.x = event.clientX;
    msg.y = event.clientY;
    msg.ctrl = event.ctrlKey;
    msg.shift = event.shiftKey;
    msg.type = "mousemove";
    
    port.postMessage(msg);
    repaintNeeded = 1;
}

function onMouseWheel(event)
{
    var msg = {};
    msg.type = "mousewheel";
    msg.delta = -event.deltaY;
    msg.x = event.clientX;
    msg.y = event.clientY;
    
    event.stopPropagation();
    event.preventDefault();

    port.postMessage(msg);
    repaintNeeded = 1;    
    return false;
}

function onKeyDown(event)
{
    /* Redirect key events that would generate a WM_KEYDOWN but not a WM_CHAR on
     * a Windows application */
    if(event.keyCode == 8 ||    // Backspace
       event.keyCode == 27 ||   // Escape
       event.keyCode == 9 ||    // Tab
       event.keyCode == 37 ||   // Left arrow
       event.keyCode == 38 ||   // Up arrow
       event.keyCode == 39 ||   // Right arrow
       event.keyCode == 40 ||   // Down arrow
       event.keyCode == 45 ||   // Insert
       event.keyCode == 46 ||   // Delete
       event.keyCode == 36 ||   // Home
       event.keyCode == 35 ||   // End
       event.keyCode == 33 ||   // Page Up
       event.keyCode == 34)     // Page down
    {
        event.stopPropagation();
        event.preventDefault();
        
        var msg = {};
        msg.key = event.keyCode;
        msg.type = "keydown";
        port.postMessage(msg);
        repaintNeeded = 1;
    }
}

function onKeyUp(event)
{
    /* Redirect key events that would generate a WM_KEYDOWN but not a WM_CHAR on
     * a Windows application */
    if(event.keyCode == 8 ||    // Backspace
       event.keyCode == 27 ||   // Escape
       event.keyCode == 9 ||    // Tab
       event.keyCode == 37 ||   // Left arrow
       event.keyCode == 38 ||   // Up arrow
       event.keyCode == 39 ||   // Right arrow
       event.keyCode == 40 ||   // Down arrow
       event.keyCode == 45 ||   // Insert
       event.keyCode == 46 ||   // Delete
       event.keyCode == 36 ||   // Home
       event.keyCode == 35 ||   // End
       event.keyCode == 33 ||   // Page Up
       event.keyCode == 34)     // Page down
    {
        event.stopPropagation();
        event.preventDefault();
        
        var msg = {};
        msg.key = event.keyCode;
        msg.type = "keyup";
        port.postMessage(msg);
        repaintNeeded = 1;
    }
}

function onKeyPress(event)
{
    /* Redirect key events corresponding to a WM_CHAR in a Windows application */
    var msg = {};
    msg.key = event.keyCode;
    msg.type = "keypress";
    port.postMessage(msg);
    repaintNeeded = 1;
}

function onMessage(msg)
{
    if(msg.type == "geturl")
    {
        if(msg.target == "0x0")
        {
            /* TODO: Extract a username/password pair from the URL */
            var request = new XMLHttpRequest();
            request.open('GET', msg.url, true);
            request.responseType = "blob";
            request.onload = function(e) {
                onUrlLoad(request, msg.nfydata, msg.url);
            };
            request.send();
        }
        else
        {
            if(msg.target == "_self" || msg.target == "_current")
            {
                /* Since the extension hosts plugin content in an iframe not present in the server's view of the document
                 * layout, a request by the plugin for a target of "_self" or "_current" is really a request for "_parent"
                 *
                 * NOTE: There's a problem here, in that if the plugin requsts a target of "_parent", there's no "_grandparent"
                 * special target we can use.  I don't believe the TestGen Plugin does this.
                 */
                msg.target = "_parent";
            }
            window.open(msg.url, msg.target);
        }
    }
    else if(msg.type == "posturl")
    {
        if(msg.target == "0x0")
        {
            
            var data = atob(msg.data);
            var request = new XMLHttpRequest();
            request.open('POST', msg.url, true);
            request.responseType = "blob";

            /* Convert the data to binary */
            bindata = new Uint8Array(data.length);
            for(var i = 0; i < data.length; i++)
            {
                bindata[i] = data.charCodeAt(i);
            }
            
            
            for(var i = 0; i < msg.headers.length; i++)
            {
                var name_val = msg.headers[i].match(/(.*): (.*)/);
                name_val[2] = name_val[2].replace(/'/g, "\"");
                if(name_val[1].toLowerCase() != "content-length")   /* Chrome doesn't like it when we try to specify a content-length header */
                {
                    request.setRequestHeader(name_val[1], name_val[2]);
                }
            }
            
            request.onload = function(e) {
                onUrlLoad(request, msg.nfydata, msg.url);
            };
            request.onreadystatechange = function() {
                checkUrlTimeout(request, msg.nfydata, msg.url, "");
            };
            request.send(bindata);
        }
        else
        {
            /* We don't support POST requests with a target other than the plugin. */
        }
    }
    else if(msg.type == "draw")
    {
        embed.innerText = "";
        embed.style.backgroundImage = "url(" + msg.image + ")";
    }
    else if(msg.type == "crash")
    {
        embed.style.backgroundImage = "none";
        embed.innerText = "Plug-in crashed";
    }
    else if(msg.type == "notfound")
    {
        embed.style.backgroundImage = "none";
        embed.innerText = "Plug-in not found";
    }
}

function onUrlLoad(urlQuery, nfydata, url)
{
    var reader = new FileReader();
    reader.onloadend = function() {
        var msg = {};
        msg.type = "file";
        msg.nfydata = nfydata;
        if(urlQuery.status >= 200 && urlQuery.status < 400)
        {
            msg.result = "0";
        }
        else
        {
            msg.result = "1";
        }
        msg.url = url;
        msg.mimetype = urlQuery.getResponseHeader("Content-Type");
        msg.data = reader.result;
        port.postMessage(msg);
    };
    reader.readAsDataURL(urlQuery.response);
}

function checkUrlTimeout(urlQuery, nfydata, url, mimetype)
{
    /* Trial and error has determined that a readyState of 4 (loaded) with a HTTP status of 0
     * corresponds to a server timeout or other inability to contact the server.  This does
     * not appear to be documented anywhere.
     */
    if(urlQuery.readyState == 4 && urlQuery.status == 0)
    {
        var msg = {};
        msg.type = "file";
        msg.nfydata = nfydata;
        msg.result = "1";
        msg.url = url;
        msg.mimetype = mimetype;
        msg.data = "";
        port.postMessage(msg);
    }
}

/* Repaint the plugin every 0.5 second or as needed, no more often than once ever 0.1 second.
 * Rate determine by trial-and-error: this gives a reasonable balance of CPU usage and responsiveness
 * for all but the most pathological cases (eg. a full-screen plugin instance displaying random noise).
 */
function doTimer()
{
    if(repaintCounter <= 0)
    {
        repaintNeeded = 1;
        repaintCounter = 5;
    }
    else
    {
        repaintCounter -= 1;
    }

    if(repaintNeeded > 0)
    {
        var msg = {};
        msg.type = "repaint";
        port.postMessage(msg);
        repaintNeeded -= 1;
    }
}