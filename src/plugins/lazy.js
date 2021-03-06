define('lazy', {
  load: function (name, req, onload, config) {
    var lazyName = 'lazy!' + name;
    var map = config && config.map && config.map['*'] || {};
    var mappedFromName = Object.keys(map).find(function(key) {
      return map[key] === lazyName;
    });

    if(req.defined(mappedFromName)) {
      onload(req(mappedFromName));
    }
    else {
      var url = name + '.js';// req.toUrl(name) + '.js';
      load({contextName: '_'}, name, url).onload = function(event) {
        onload(name);
        // console.log(name, url);
        // req([mappedFromName], onload);
      };
    }
  },
  // normalize: function (name, normalize) {
  //   return name;
  // }
});

function createNode(config, moduleName, url) {
  var node = config.xhtml ?
    document.createElementNS('http://www.w3.org/1999/xhtml', 'html:script') :
    document.createElement('script');
  node.type = config.scriptType || 'text/javascript';
  node.charset = 'utf-8';
  node.async = true;
  return node;
};

var head = document.getElementsByTagName('head')[0];

function load(context, moduleName, url) {
  var config = (context && context.config) || {},
    node;

  //In the browser so use a script tag
  node = createNode(config, moduleName, url);

  node.setAttribute('data-requirecontext', context.contextName);
  node.setAttribute('data-requiremodule', moduleName);

  //Set up load listener. Test attachEvent first because IE9 has
  //a subtle issue in its addEventListener and script onload firings
  //that do not match the behavior of all other browsers with
  //addEventListener support, which fire the onload event for a
  //script right after the script execution. See:
  //https://connect.microsoft.com/IE/feedback/details/648057/script-onload-event-is-not-fired-immediately-after-script-execution
  //UNFORTUNATELY Opera implements attachEvent but does not follow the script
  //script execution mode.
  if (node.attachEvent &&
    //Check if node.attachEvent is artificially added by custom script or
    //natively supported by browser
    //read https://github.com/requirejs/requirejs/issues/187
    //if we can NOT find [native code] then it must NOT natively supported.
    //in IE8, node.attachEvent does not have toString()
    //Note the test for "[native code" with no closing brace, see:
    //https://github.com/requirejs/requirejs/issues/273
    !(node.attachEvent.toString && node.attachEvent.toString().indexOf('[native code') < 0) &&
    !isOpera) {
    //Probably IE. IE (at least 6-8) do not fire
    //script onload right after executing the script, so
    //we cannot tie the anonymous define call to a name.
    //However, IE reports the script as being in 'interactive'
    //readyState at the time of the define call.
    useInteractive = true;

    node.attachEvent('onreadystatechange', context.onScriptLoad);
    //It would be great to add an error handler here to catch
    //404s in IE9+. However, onreadystatechange will fire before
    //the error handler, so that does not help. If addEventListener
    //is used, then IE will fire error before load, but we cannot
    //use that pathway given the connect.microsoft.com issue
    //mentioned above about not doing the 'script execute,
    //then fire the script load event listener before execute
    //next script' that other browsers do.
    //Best hope: IE10 fixes the issues,
    //and then destroys all installs of IE 6-9.
    //node.attachEvent('onerror', context.onScriptError);
  } else {
    node.addEventListener('load', context.onScriptLoad, false);
    node.addEventListener('error', context.onScriptError, false);
  }
  node.src = url;

  //Calling onNodeCreated after all properties on the node have been
  //set, but before it is placed in the DOM.
  if (config.onNodeCreated) {
    config.onNodeCreated(node, config, moduleName, url);
  }

  //For some cache cases in IE 6-8, the script executes before the end
  //of the appendChild execution, so to tie an anonymous define
  //call to the module name (which is stored on the node), hold on
  //to a reference to this node, but clear after the DOM insertion.
  currentlyAddingScript = node;
  // if (baseElement) {
  //   head.insertBefore(node, baseElement);
  // } else {
    head.appendChild(node);
  // }
  currentlyAddingScript = null;

  return node;
}