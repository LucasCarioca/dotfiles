"use strict";

/* Background relay between proxy frames and plugin hosts
 */
chrome.runtime.onConnect.addListener(
    function(port) {
        var nativeClientPort;
        var isNativeClientAlive;
        var messageFragments;
        try
        {
            nativeClientPort = chrome.runtime.connectNative("com.tamarack_software.plugin_host");
            isNativeClientAlive = true;
            messageFragments = "";
        }
        catch(error)
        {
            isNativeClientAlive = false;
            var errMsg = {};
            errMsg.type = "notfound";
            port.postMessage(errMsg);
        }

        /* Handle the proxy frame unloading */
        port.onDisconnect.addListener(function(event) {
            if(isNativeClientAlive)
            {
                var msg = {};
                msg.type = "disconnect";
                nativeClientPort.postMessage(msg);
                nativeClientPort.disconnect();
            }
        });
        
        /* Relay any messages from the proxy frame to the plugin host */
        port.onMessage.addListener(function(msg) {
            //console.log(msg);
            if(isNativeClientAlive)
            {
                try
                {
                    nativeClientPort.postMessage(msg);
                }
                catch(error)
                {
                    isNativeClientAlive = false;
                    var errMsg = {};
                    errMsg.type = "crash";
                    port.postMessage(errMsg);
                }
            }
        });
        
        /* Relay any messages from the host to the proxy frame */
        nativeClientPort.onMessage.addListener(function(msg) {
            if(msg.type == "fragment")
            {
                messageFragments += atob(msg.data);
            }
            else if(msg.type == "fragend")
            {
                messageFragments += atob(msg.data);
                port.postMessage(JSON.parse(messageFragments));
                messageFragments = "";
            }
            else
            {
                port.postMessage(msg);
            }
        });
    }
);
