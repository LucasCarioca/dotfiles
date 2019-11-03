"use strict";

/* Keep an eye on the DOM to see if anyone's adding plugin content using Javascript */
var observer = new MutationObserver( function(changes) {
    changes.forEach(function(change) {
        if(change.addedNodes)
        {
            for(var i = 0; i < change.addedNodes.length; i++)
            {
                if(change.addedNodes.item(i).tagName == "EMBED")
                {
                    CheckReplaceEmbed(change.addedNodes.item(i));
                }
                else if(change.addedNodes.item(i).tagName == "OBJECT")
                {
                    CheckReplaceObject(change.addedNodes.item(i));
                }
            }
        }
    });
});

observer.observe(document.body, {childList: true, subtree: true});

/* Check a page to see if it has any references to the TestGen NPAPI plugin.
 * If it does, replace them with plugin proxy iframes.
 *
 * Objects are checked before embeds because an <object> tag is allowed to enclose an <embed> tag, and
 * if the object refers to plugin content, replacing it will remove the embed.
 */
var objects = document.body.getElementsByTagName("object");
var embeds = document.body.getElementsByTagName("embed");

for(var i = objects.length - 1; i >= 0; i--) // Iterating backwards, because we might remove elements from the list during iteration
{
    CheckReplaceObject(objects[i]);
}

for(var i = embeds.length - 1; i >= 0; i--) // Iterating backwards, because we might remove elements from the list during iteration
{
	CheckReplaceEmbed(embeds[i]);
}


/* NOTE: This violates the HTML spec for handling of <object> tags in that we do a blind replacement of 
 * the object with the plugin iframe.  The HTML spec calls for an extended series of steps to determine
 * if the <object> should display the plugin content (and if so, which plugin should be used), or if it
 * should display the HTML contents of the tag, most of which deals with edge cases.
 *
 * The only common case where a blind replacement is the wrong thing to do is when the server would return
 * an error when fetching the plugin content.  The other common case, that the plugin isn't installed, we
 * know probably isn't happening because the Chrome extension is present (unfortunately, Google's insistence
 * that all Chrome extensions be distributed through the Web Store means that it's theoretically possible
 * for someone to wind up with the extension but not the plugin).
 *
 * In some cases, a blind replacement will actually improve compatibility, as some web servers will serve up
 * plugin content with the incorrect type "application/zip" rather than the correct "application/x-tst-file"
 * or the generic "application/octet-stream", preventing the plugin selection algorithm from working properly.
 */
function CheckReplaceObject(object)
{
    if(/application\/x-tst-file/i.test(object.getAttribute("type")) ||
	   /application\/x-wtk-file/i.test(object.getAttribute("type")) ||
	   /\.tst$/i.test(object.getAttribute("data")) ||
	   /\.wtk$/i.test(object.getAttribute("data")) ||
	   object.getAttribute("classid").toUpperCase() == "clsid:76D6D117-DC56-47FE-9758-71AF8348A9C1" ||
	   object.getAttribute("classid").toUpperCase() == "clsid:1A65F0C5-AC05-11D5-AF77-00E02998142A")
	{
		var proxyFrameWidth = object.getAttribute("width");
		var proxyFrameHeight = object.getAttribute("height");
		var proxyFrame = document.createElement("iframe");
		var proxyParent = object.parentElement;

        var params = object.getElementsByTagName("param");

        var embedParamList = [];
        
        var mimeTypeFound = false;
        var source = "";
        
		for (var j = 0; j < object.attributes.length; j++)
		{
		    if(object.attributes.item(j).name.toLowerCase() == 'data')
		    {
		        /* Fully resolve the "data" attribute here, because the iframe doesn't have the information needed to do so itself
		         * The other path-like parameters are resolved by the plugin binary using its own arcane rules, so don't touch them. */
		        embedParamList.push("src=" + encodeURIComponent(QualifyURL(object.attributes.item(j).value)));
		        source = object.attributes.item(j).value;
		    }
		    else if(object.attributes.item(j).name.toLowerCase() == 'type')
		    {
		        embedParamList.push("mimetype=" + encodeURIComponent(object.attributes.item(j).value));
		        mimeTypeFound = true;
		    }
		    else if(object.attributes.item(j).name.toLowerCase() == 'doneurl')
		    {
		        embedParamList.push("doneurl=" + encodeURIComponent(QualifyURL(object.attributes.item(j).value)));
		    }
		    else
		    {
		        embedParamList.push(encodeURIComponent(object.attributes.item(j).name) + "=" + encodeURIComponent(object.attributes.item(j).value));
		    }
		}
		for (var j = 0; j < params.length; j++)
		{
		    if(params[j].getAttribute("name").toLowerCase() == 'src')
		    {
		        embedParamList.push("src=" + encodeURIComponent(QualifyURL(params[j].getAttribute("value"))));
		        source = QualifyURL(params[j].getAttribute("value"));
		    }
		    else if(params[j].getAttribute("name").toLowerCase() == 'doneurl')
		    {
		        embedParamList.push("doneurl=" + encodeURIComponent(QualifyURL(params[j].getAttribute("value"))));
		    }
		    else
		    {
		        if(params[j].getAttribute("name").toLowerCase() == 'mimetype')
		        {
		            mimeTypeFound = true;
		        }
		        embedParamList.push(encodeURIComponent(params[j].getAttribute("name")) + "=" + encodeURIComponent(params[j].getAttribute("value")));
		    }
		}
		
		if(!mimeTypeFound)
		{
		    if(/\.tst$/i.test(source))
		    {
		        embedParamList.push(encodeURIComponent("mimetype=application/x-tst-file"));
		    }
		    else if(/\.wtk$/i.test(source))
		    {
		        embedParamList.push(encodeURIComponent("mimetype=application/x-wtk-file"));
		    }
		    /* Else, we can't deduce the type, and need to depend on the server getting it correct */
		}
		
		var embedParams = embedParamList.join("&");
		
		proxyFrame.setAttribute("WIDTH", proxyFrameWidth);
		proxyFrame.setAttribute("HEIGHT", proxyFrameHeight);
		proxyFrame.setAttribute("SRC", chrome.extension.getURL("tgproxyframe.html") + "?" + embedParams);
		proxyFrame.setAttribute("style", "border:none");
		proxyParent.replaceChild(proxyFrame, object);
	}
}

/* Replace an <embed> element with a proxy iframe */
function CheckReplaceEmbed(embed)
{
	if(/application\/x-tst-file/i.test(embeds[i].getAttribute("mimetype")) ||
	   /application\/x-wtk-file/i.test(embeds[i].getAttribute("mimetype")) ||
       /application\/x-tst-file/i.test(embeds[i].getAttribute("type")) ||
	   /application\/x-wtk-file/i.test(embeds[i].getAttribute("type")) ||
	   /\.tst$/i.test(embeds[i].getAttribute("src")) ||
	   /\.wtk$/i.test(embeds[i].getAttribute("src")))
	{
	    var proxyFrameWidth = embed.getAttribute("width");
	    var proxyFrameHeight = embed.getAttribute("height");
	    var proxyFrame = document.createElement("iframe");
	    var proxyParent = embed.parentElement;
    	
	    var mimeTypeFound = false;
    	
	    var embedParamList = [];
	    for (var j = 0; j < embed.attributes.length; j++)
	    {
	        if(embed.attributes.item(j).name.toLowerCase() == 'src')
	        {
	            /* Fully resolve the "src" attribute here, because the iframe doesn't have the information needed to do so itself.
	             * The other path-like parameters are resolved by the plugin binary using its own arcane rules, so don't touch them. */
	            embedParamList.push(encodeURIComponent(embed.attributes.item(j).name) + "=" + encodeURIComponent(QualifyURL(embed.attributes.item(j).value)));
	        }
	        else if(embed.attributes.item(j).name.toLowerCase() == 'doneurl')
	        {
	            /* Fully resolve the "doneurl" attribute here, because the iframe doesn't have the information needed to do so itself.
	             * The other path-like parameters are resolved by the plugin binary using its own arcane rules, so don't touch them. */
	            embedParamList.push(encodeURIComponent(embed.attributes.item(j).name) + "=" + encodeURIComponent(QualifyURL(embed.attributes.item(j).value)));
	        }
	        else if(embed.attributes.item(j).name.toLowerCase() == 'type' || embed.attributes.item(j).name.toLowerCase() == 'mimetype')
	        {
	            if(!mimeTypeFound)
	            {
	                embedParamList.push("mimetype=" + encodeURIComponent(embed.attributes.item(j).value));
	                mimeTypeFound = true;
	            }
	        }
	        else
	        {
	            embedParamList.push(encodeURIComponent(embed.attributes.item(j).name) + "=" + encodeURIComponent(embed.attributes.item(j).value));
	        }
	    }
    			
	    var embedParams = embedParamList.join("&");
    	
	    proxyFrame.setAttribute("WIDTH", proxyFrameWidth);
	    proxyFrame.setAttribute("HEIGHT", proxyFrameHeight);
	    proxyFrame.setAttribute("SRC", chrome.extension.getURL("tgproxyframe.html") + "?" + embedParams);
	    proxyFrame.setAttribute("style", "border:none");
	    proxyParent.replaceChild(proxyFrame, embed);
	}
}

/* Turn a URL of unknown type (absolute, document-relative, whatever) into a fully-resolved URL.
 * Based on a trick mentioned on StackOverflow.  Apparently this doesn't work with IE, but we only
 * care about Chrome.
 */
function QualifyURL(url)
{
    var a = document.createElement('a');
    a.href = url;
    return a.href;
}
