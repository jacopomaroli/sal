# SAL
Scalar AJAX Library (a.k.a. SAL) is a SEO friendly AJAXifier.  
With SAL you'll be able to enhance your current website to let your links load their contents right in place!

# Why should I use SAL?
* **Lightweight**  
  SAL is entirely based on vanilla JS so you won't need any framework thus no overhead will occour neither.
* **SEO Friendly**  
  Remember: SAL will *enhance* your site with js. If the client (e.g. search engine crawlers) do not use js, links will keep behaving as usual.
* **History Managed Automagically**  
  SAL will take care to update the history for you, so when you click the previous and next arrow of your browser contents will be loaded by ajax if *currently not in page* (you could for example scroll to the content).
* **No need of custom answer format**  
  you'll get a ```?ajax=true``` at the end of the request url if it's a SAL's request. Your code just need to decide if serve just the needed content or a full page accordingly
  
# How does it work?
after initialization you'll have two main actors: triggers and targets.  
The firsts are the enhanced links, the seconds are the areas that will be replaced by the contents loaded by the trigger.

triggers are a plain array of objects but targets are *hierarchical* so when you go back and forth through history SAL can load parents before loading the requested object!  
thanks to this you can rebuild all the needed page not just inserting the requested fragment.  
SAL is really smart and will recognize if a parent fragment need to be replaced or not ;)  

# Show me some code!
**client side**  
here is the typical initialization
```
document.addEventListener('DOMContentLoaded', DOMContentLoaded, false);
function DOMContentLoaded()
{
	sal.init(); // setup targets root and history manager
	sal.setLoadUrlBeforeCallback(loadUrlBeforeCallback);
	sal.setLoadUrlAfterCallback(loadUrlAfterCallback);
	sal.addTarget("main", "/");
	sal.addTarget("elem1", "/elem1", "main");
	sal.addTrigger(document.getElementById("myTrigger"));
	// set current state from URL.
	// the current selected target MUST be existing and pushed!
	sal.setHistoryHierarchyFromUrl(); 
}
```
```
loadUrlBeforeCallback(url, targetId, options, next)
```
this is a function whose main purpose is to assure that the element with the specified targetId exists, otherwise it must be created.
```
loadUrlAfterCallback(url, targetId, options, response, next)
```
this function is responsible for the replacement of the target with the response and the update of the history.

remember to call `next()` when you're set whith those callbacks.

**server side**  
every object must contain an assetid and an asseturl parameter and inside the element you must indicate the info of the asset like the following
```
<div assetid="main" asseturl="/">
	<salhistory>
		window.stateObj = {
			contentUrl: "/"
		};
	</salhistory>
	...
</div>
```
contentUrl is the only needed param but you can add those you need, like title and such, for tracking purposes, because this object will be the new history state object every time a target get loaded or the history goes back or forth

please also add
```
salhistory{display:none;}
```
to your css so the salhistory tag gets hid

# Are there some events where I can hook my code?
Sure! they are triggered on the window object and are ``` sal.loadingsStart ``` ``` sal.loadingsEnd ``` and ``` sal.mainProgress ```.  
This last will give you the status and the advancement percentage for maximum flow control and have fun with progress bars.  
in ``` e.detail ``` you'll find these params:
* actionProgress -> percentage of the current step (really always 100% but the reqProgress)
* stepProgress -> percentage of the current loading
* totalProgress -> percentage of all the loadings
* eventProgress -> a string defining the current event in progress with the following values:
 * end -> called when ALL the loading events are ended
 * reqStart -> called when a new request is about to start
 * reqProgress -> called when a request is in progress
 * reqEnd -> called when a request has received an answer
 * reqError -> called when a request receive a status code 

# Are there any example?
yes! there's an example folder with a simple example and it will get soon a new complex and more complete one.  
Also let me mention my website where you can find a real world application for SAL http://jacopomaroli.com

# APIs
```
init()
```
Init sal system. It setups targets root and history manager
```
addTrigger(elm)
```
Add a trigger  
**elm:** a DOMElement
```
addTarget(targetid, url, parentTarget)
```
Add a target. If already existing it will be ignored  
**targetid:** an unique identifier for the target  
**url:** the url of the target  
**parentTarget:** the id of the parent target  
```
triggers
```
The array of the triggers
```
targets
```
The object containing the *hierarchical* list of the targets
```
loadUrl(url, target, options, curStep, totalStep, next)
```
load an url with sal APIs  
**url:** the url to load  
**target:** the target object to load the content into  
**options:** options for loading (like doPushState)  
**curStep:** current step of loading  
**totalStep:** total step of loading  
**next:** function to be called after the url has been loaded  
```
getTargetByAttr(attr, value, node)
```
get a target through the specified attributes  
**attr:** the attribute we're looking for (could be url or id)  
**value:** the value we're looking for  
**node:** the parent node to start searching. If omitted will default to root  
```
setLoadUrlBeforeCallback(loadUrlBeforeCallback)
```
**warning:** *most likely this function will be removed because all the things done here can also be done after receiving the answer.
do you guys have any good reason to keep it around?*  
Set up the function that will be called before the the client request.  
Useful if you want to check that everything's in place before receiving the server answer.  
the callback have the following format:
```loadUrlBeforeCallback(url, targetId, options, next)```  
  **url:** the url that will be loaded  
  **targetId:** the target id whose elements will be replaced  
  **options:** options of the loading  
  **next:** function to call after you did everything to proceed with the loading. (useful in case of async code)  
**loadUrlBeforeCallback:** a function with the specifications described up here
```
setLoadUrlAfterCallback(loadUrlAfterCallback)
```
Set up the function that will be called before the the client request.  
Useful if you want to check that everything's in place before receiving the server answer.  
the callback have the following format:
```loadUrlBeforeCallback(url, targetId, options, next)```  
  **url:** the url that has been loaded  
  **targetId:** the target id whose elements will be replaced  
  **options:** options of the loading  
  **response:** the server response as a string
  **next:** function to call after you did everything to proceed with the loading. (useful in case of async code)  
**loadUrlAfterCallback:** a function with the specifications described up here
please call ```sal.updateHistory(url, target, options, eResponse);``` to update history accordingly to the server answer.  
**eResponse** is a dom element containing the salhistory DOM object
```
getHistoryHierarchy(target)
```
return a serializable hierachy of targets  
**target:** will start from this and will go upward  
```
setHistoryHierarchy(target)
```
set the history hierarchy state object  
**target:** the target to set the object according to
```
setHistoryHierarchyFromUrl()
```
Parse the url and look up for the corresponding target in the target hierarchy  
**A target hierarchy must exists before doing this**
```
updateHistory(url, target, options, elm)
```
Used to set the history state accordingly with the parameters. A history.pushState will be performed if options.doPushState is `true`.  
You should call this after you replaced the element in the loadUrlAfterCallback.  
**url:** new url  
**target:** the corresponding sal target  
**options:** the target options. Really only "options.doPushState" will be taken in account in this case  
**elm:** the element which contain the "salHistory" tag in the server answer
```
isManagingHistory()
```
return a boolean which tells us whether sal is currently managing history or not
