setTimeout(function(){function e(){switch(document.documentElement.namespaceURI){case r.wsdl:return(new XMLSerializer).serializeToString(document);case r.xhtml:var e;if(e=document.getElementById("webkit-xml-viewer-source-xml"))return e.innerHTML;if(e=document.querySelector("body>pre")){if(!e.nextSibling&&!e.previousSibling){for(var t=!0,n=0,o=e.childNodes.length;o>n;++n)if(3!=e.childNodes[n].nodeType){t=!1;break}if(t)return e.textContent}}else if(e=document.querySelector("body>#tree"))return e.textContent}return null}function t(e,t){var n=document.createElementNS(r.xhtml,"a");n.download=e,n.href=t;var o=document.createEvent("MouseEvents");o.initEvent("click",!0,!0),n.dispatchEvent(o)}function n(e,n,r){switch(e.command){case"getXml":r(o);break;case"download":t(e.name,e.data),r();break;default:r()}}var r={wsdl:"http://schemas.xmlsoap.org/wsdl/",xhtml:"http://www.w3.org/1999/xhtml"},o=e();if(o){var i=new DOMParser,a=i.parseFromString(o,"text/xml"),c=a.documentElement;c.namespaceURI==r.wsdl&&"definitions"==c.localName&&chrome.runtime&&(chrome.runtime.onMessage.addListener(n),chrome.runtime.sendMessage({command:"showPageAction"}))}},200);