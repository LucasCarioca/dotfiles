define(["require","exports","vkbeautify","wsdl","xml","Wsse"],function(e,t,r,s,n,o){var a=function(){function e(e,t){this.xml=(new DOMParser).parseFromString(e,"text/xml"),this.ns=t||{}}return e.prototype.qname=function(e,t){var r=e.split(":");if(1==r.length)var s=t,o=r[0];else var s=this.ns[r[0]]||r[0],o=r[1];return new n.QName(o,s)},e.prototype.element=function(e){return e.namespace?this.xml.createElementNS(e.namespace,e.localName):this.xml.createElement(e.localName)},e.prototype.setAttribute=function(e,t,r){t.namespace?e.setAttributeNS(t.namespace,t.localName,r):e.setAttribute(t.localName,r)},e.prototype.appendFragment=function(e,t){var r=this;return t=t||this.xml.createDocumentFragment(),"string"==typeof e?(t.appendChild(this.xml.createTextNode(e)),t):Array.isArray(e)?(e.forEach(function(e){return r.appendFragment(e,t)}),t):(Object.keys(e).forEach(function(s){if("text()"==s)t.appendChild(r.xml.createTextNode(e[s]));else if("@"==s[0]){var n=r.qname(s.substr(1));r.setAttribute(t,n,e[s])}else{var n=r.qname(s),o=t.appendChild(r.element(n));r.appendFragment(e[s],o)}}),t)},e.prototype.replaceChild=function(e,t){for(var r=e.split("/"),s=this.xml.documentElement,n=0,o=r.length;o>n;++n){var a=this.qname(r[n],s.namespaceURI);s=s.getElementsByTagNameNS(a.namespace,a.localName)[0]||s.insertBefore(document.createElementNS(a.namespace,a.localName),s.firstChild)}s.parentNode.replaceChild(this.appendFragment(t),s)},e.prototype.toString=function(){return this.xml?(new XMLSerializer).serializeToString(this.xml):""},e}(),i=(function(){function e(){}return e}(),function(){function e(){}return e}(),function(){function e(){}return e}(),function(){function e(){}return e}(),function(){function e(){}return e}(),function(){function e(){}return e.prototype.getResource=function(e){var t=this;return e.method&&"GET"!=e.method?Promise.resolve(null):this.resources?this.resources[e.url]?Promise.resolve({text:this.resources[e.url],headers:""}):Promise.resolve(null):window.chrome&&window.chrome.runtime?new Promise(function(r,s){chrome.runtime.sendMessage({command:"resources"},function(s){return t.resources=s||{},t.resources[e.url]?void r({text:t.resources[e.url],headers:""}):r(null)})}):Promise.resolve(null)},e.prototype.ajaxOrResource=function(e){var t=this;return this.getResource(e).then(function(r){return r?Promise.resolve(r):t.ajax(e)})},e.prototype.ajax=function(e){return"file://"==e.url.substr(0,"file://".length)?new Promise(function(t,r){var s={command:"ajax",method:e.method||"GET",url:e.url,contentType:e.contentType,headers:e.headers,data:e.data};chrome.runtime.sendMessage(s,function(e){if(e.error){var s=new Error(e.error);return s.text=e.text,s.headers=e.headers,r(s)}t({text:e.text,headers:e.headers})})}):new Promise(function(t,r){var s=new XMLHttpRequest;s.open(e.method||"GET",e.url),s.onreadystatechange=function(){if(4==s.readyState){if(200===s.status||0===s.status)return t({text:s.responseText,headers:s.getAllResponseHeaders()});var e=new Error(s.statusText);return e.text=s.responseText,e.headers=s.getAllResponseHeaders(),r(e)}},e.headers&&Object.keys(e.headers).forEach(function(t){return s.setRequestHeader(t,e.headers[t])}),s.send(e.data)})},e.prototype.showRequestBody=function(){$(".nav-tabs a[href=#request]").tab("show"),this.resizeHeader($("#request-headers"))},e.prototype.showResponseBody=function(){$(".nav-tabs a[href=#response]").tab("show"),this.resizeHeader($("#response-headers"))},e.prototype.request_OnClick=function(e){e.preventDefault(),this.showRequestBody()},e.prototype.response_OnClick=function(e){e.preventDefault(),this.showResponseBody()},e.prototype.address=function(e,t){for(var r=t,s=1;e.hasOwnProperty(t);)t=r+" ("+ ++s+")";return e[t]=!0,"#/"+t},e.prototype.refreshCtxs=function(){var e=this;if(this.ctxs)return this.ctxs;var t={};for(var r in this.resources)t[r]=Promise.resolve(this.resources[r]);return this.ctxs=s.WsdlDocument.parse(this.url,this.xml,!0,t).then(function(t){var r={},s={};return t.services.forEach(function(n){n.ports.forEach(function(o){var a=t.bindings[String(o.binding)];if(a){var i=t.portTypes[String(a.type)];a.operations.forEach(function(u){var c=i.operations[String(u.name)],d=e.address(r,[n.name.localName,o.name.localName,u.name.localName].join("/"));s[d]={wsdl:t,generator:t.generator,service:n,binding:a,port:o,portType:i,portTypeOperation:c,operation:u}})}})}),s})},e.prototype.go_OnClick=function(e){var t=this;this.request.url=$("#address").val(),this.request.method=$("#method").val(),this.request.body=this.requestEditor.getSession().getValue(),this.saveState(),e.preventDefault();var s=this.getAuthentication(),n=this.request.headers,i=this.request.body;if(s.enabled)switch(s.type){case"http-basic":n.Authorization="Basic "+btoa([s.username,s.password].join(":"));break;case"wsse-passwordtext":var u=new a(i,o.NS);u.replaceChild("Header/wsse:Security/wsse:UsernameToken",{"wsse:UsernameToken":{"wsse:Username":s.username,"wsse:Password":{"@Type":o.PasswordType.text,"text()":s.password}}}),i=u.toString();break;case"wsse-passworddigest":var c=o.generateNonce(),d=new Date,u=new a(i,o.NS);u.replaceChild("Header/wsse:Security/wsse:UsernameToken",{"wsse:UsernameToken":{"wsse:Username":s.username,"wsse:Password":{"@Type":o.PasswordType.digest,"text()":o.generateDigest(c,d,s.password)},Nonce:c,"wsu:Created":d.toISOString()}}),i=u.toString()}var l,h=+new Date;Promise.resolve(null).then(function(e){return document.getElementById("status").textContent="Loading..."}).then(function(e){return t.ajax({url:t.request.url,method:t.request.method,contentType:"text/xml; charset=utf-8",headers:n,data:i})}).then(function(e){l=e;try{t.responseBody=r.xml(e.text)}catch(s){t.responseBody=e.text}t.responseEditor.getSession().setValue(t.responseBody),t.showResponseBody()}).then(function(e){return document.getElementById("status").textContent="Done ("+(+new Date-h)+" ms)."})["catch"](function(e){document.getElementById("status").textContent="Failed ("+(+new Date-h)+" ms).",l=e,t.responseBody=e.text?r.xml(e.text):e.message,t.responseEditor.getSession().setValue(t.responseBody),t.showResponseBody(),setTimeout(function(t){return alert("Failed to get response ("+e.message+").")})})["finally"](function(){$("#response-headers").val(l.headers.replace(/^\s*|\s*$/g,"")),t.resizeHeader($("#response-headers"))})},e.prototype.headers_OnClick=function(e){document.body.classList.toggle("show-headers"),this.resizeHeader($("#request-headers")),this.resizeHeader($("#response-headers")),this.saveState(),e.preventDefault()},e.prototype.headers_OnInput=function(e){this.resizeHeader($(e.target)),e.preventDefault()},e.prototype.resizeHeader=function(e){var t=e.val().split(/\r?\n/).length;e.prop("rows",t),e.height(16*t);var r=20;document.body.classList.contains("show-headers")&&(r+=16*t+14);var s=e.closest(".tab-pane").find(".editor"),n=s.get(0);n.editor.resize()},e.prototype.requestHeaders_OnChange=function(e){var t=e.target;this.request.headers=this.deserializeHeaders(t.value),this.saveState(),e.preventDefault()},e.prototype.authenticate_OnClick=function(e){document.body.classList.toggle("show-authentication"),this.saveState(),e.preventDefault()},e.prototype.auth_OnChange=function(e){this.saveState()},e.prototype.exit_OnClick=function(e){this.saveState(),e.preventDefault(),close()},e.prototype.remember_OnClick=function(e){e&&e.preventDefault(),document.body.classList.contains("remember-requests")?(document.body.classList.toggle("remember-requests",!1),this.clearState()):(document.body.classList.toggle("remember-requests",!0),this.saveState(!0))},e.prototype.reset_OnClick=function(e){var t=this;e&&e.preventDefault();var r=this.parseArgs();r.wsdl&&(document.title=r.title,this.ajaxOrResource({url:r.wsdl}).then(function(e){t.url=r.wsdl,t.addr=r.addr,t.xml=e.text,t.refreshCtxs().then(function(e){return t.open()})})["catch"](function(e){throw console.error(e),new Error("Failed to load data from url: "+r.wsdl)}))},e.prototype.clearState=function(){var e="wizdler:"+this.url+":"+this.addr;localStorage.removeItem(e)},e.prototype.saveState=function(e){var t="wizdler:"+this.url+":"+this.addr;return e||localStorage.hasOwnProperty(t)?(localStorage[t]=JSON.stringify({headers:document.body.classList.contains("show-headers"),authentication:this.getAuthentication(),request:{url:this.request.url,method:this.request.method,headers:this.request.headers,body:this.request.body}}),!0):!1},e.prototype.loadState=function(){var e,t="wizdler:"+this.url+":"+this.addr;try{e=JSON.parse(localStorage[t]||null)}catch(r){e=null}return e?(document.body.classList.toggle("remember-requests",!0),this.request=e.request,$("#address").val(this.request.url),$("#method").val(this.request.method),this.requestEditor.getSession().setValue(this.request.body),$("#request-headers").val(this.serializeHeaders(this.request.headers)),document.body.classList.toggle("show-headers",e.headers),this.resizeHeader($("#request-headers")),this.setAuthentication(e.authentication),!0):(document.body.classList.toggle("remember-requests",!1),!1)},e.prototype.getAuthentication=function(){return{enabled:document.body.classList.contains("show-authentication"),type:document.getElementById("auth-type").value,username:document.getElementById("auth-username").value,password:document.getElementById("auth-password").value}},e.prototype.setAuthentication=function(e){e=e||{},document.body.classList.toggle("show-authentication",e.enabled),document.getElementById("auth-type").value=e.type||"http-basic",document.getElementById("auth-username").value=e.username||"",document.getElementById("auth-password").value=e.password||""},e.prototype.createEditor=function(e){var t=ace.edit(e+"-editor");t.$blockScrolling=1/0,t.setTheme("ace/theme/vs"),t.renderer.setShowGutter(!1),t.getSession().setUseWrapMode(!0),t.commands.addCommands([{name:"ungotoline",bindKey:{mac:"Command-L"},exec:function(e,t){return!1},readOnly:!0}]);var r=ace.require("ace/mode/xml").Mode;return t.getSession().setMode(new r),t},e.prototype.serializeHeaders=function(e){return Object.keys(e).map(function(t){return[t,": ",e[t]].join("")}).join("\n")},e.prototype.deserializeHeaders=function(e){var t={};return e.split(/\r?\n/).forEach(function(e){var r=e.indexOf(":");-1!=r&&(t[e.substr(0,r)]=e.substr(r+1).replace(/^\s+/,""))}),t},e.prototype.open=function(){var e=this;Promise.resolve(this.ctxs).then(function(t){return t?t[e.addr]:null}).then(function(t){if(!t)throw new Error("Invalid address to open in editor: "+e.addr);e.request=s.WsdlDocument.generateRequest(t),$("#method").val(e.request.method),$("#address").val(e.request.url),$("#request-headers").val(e.serializeHeaders(e.request.headers)),e.requestEditor.getSession().setValue(e.request.body),e.showRequestBody()})},e.prototype.parseArgs=function(){var e={};return location.hash.substr(1).split("&").forEach(function(t){if(t){var r=t.split("="),s=decodeURIComponent(r[0]),n=decodeURIComponent(r[1]);e[s]=n}}),e},e.prototype.run=function(){var e=this;"Win32"==navigator.platform&&$(document.body).addClass("platform-win32"),$("#go").click(function(t){return e.go_OnClick(t)}),$("a[href=#request]").click(function(t){return e.request_OnClick(t)}),$("a[href=#response]").click(function(t){return e.response_OnClick(t)}),$("a[href=#exit]").click(function(t){return e.exit_OnClick(t)}),$("a[href=#remember]").click(function(t){return e.remember_OnClick(t)}),$("a[href=#reset]").click(function(t){return e.reset_OnClick(t)}),$("a[href=#authenticate]").click(function(t){return e.authenticate_OnClick(t)}),$("a[href=#headers]").click(function(t){return e.headers_OnClick(t)}),$("#request-headers").change(function(t){return e.requestHeaders_OnChange(t)}),$("#auth-type").change(function(t){return e.auth_OnChange(t)}),$("#auth-username").change(function(t){return e.auth_OnChange(t)}),$("#auth-password").change(function(t){return e.auth_OnChange(t)}),Array.prototype.forEach.call(document.querySelectorAll(".headers-editor"),function(t){return t.oninput=function(t){return e.headers_OnInput(t)}}),$(".dropdown-toggle").dropdown(),this.requestEditor=this.createEditor("request"),this.responseEditor=this.createEditor("response"),$("#request-editor").get(0).editor=this.requestEditor,$("#response-editor").get(0).editor=this.responseEditor;var t=this.parseArgs();this.url=t.wsdl,this.addr=t.addr,document.title=t.title,this.loadState()||this.reset_OnClick(null)},e}());(new i).run()});