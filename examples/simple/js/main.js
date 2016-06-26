function addSalEvts()
{
	window.addEventListener('sal.mainProgress', function(e){
		console.log(e.detail.totalProgress + "%");
		// the params are
		// actionProgress -> percentage of the current step (really always 100% but the reqProgress)
		// stepProgress -> percentage of the current loading
		// totalProgress -> percentage of all the loadings
		// eventProgress -> a string defining the current event in progress (see below) 
		if(e.detail.eventProgress === "end")
		{
			// do something when the loading events are ended
		}
		// the events are
		// end -> called when ALL the loading events are ended
		// reqStart -> called when a new request is about to start
		// reqProgress -> called when a request is in progress
		// reqEnd -> called when a request has received an answer
		// reqError -> called when a request receive a status code 
	});
	window.addEventListener('sal.loadingsStart', function(e){
		// do something when loading starts
	});
	window.addEventListener('sal.loadingsEnd', function(e){
		var targetArray = e.detail.target.getElements();
		// do something when ALL loading ends
		document.title = stateObj.title;
	});
}

//function called before loading an element. ensure a element to replace with that id exists!
function loadUrlBeforeCallback(url, targetId, options, next)
{
	var target = sal.getTargetByAttr("id", targetId);
	if(targetId.indexOf("main") === 0)
	{
		next();
	}
	if(targetId.indexOf("content-") === 0)
	{
		next();
	}
	if(targetId.indexOf("subcontent-") === 0)
	{
		next();
	}
}

//function called after loading an element.
//Do all the fun stuff here e.g. animations appending code etc...
function loadUrlAfterCallback(url, targetId, options, response, next)
{
	var target = sal.getTargetByAttr("id", targetId);
	var targetArray = target.getElements();
	var eResponse = document.createElement("div");
	eResponse.innerHTML = response;
	
	for(var key in targetArray)
	{
		var elem = targetArray[key];
		var objToReplace = eResponse.querySelectorAll(".ajaxContent[assetid=" + target.id + "]")[0]
							.cloneNode(true);
		elem.parentNode.replaceChild(objToReplace, elem); 
	}
	
	// remember to update history! this function will do it if necessary... (options.doPushState)
	sal.updateHistory(url, target, options, eResponse);
	
	if(targetId.indexOf("main") === 0)
	{
		next();
	}
	if(targetId.indexOf("content-") === 0)
	{
		next();
	}
	if(targetId.indexOf("subcontent-") === 0)
	{
		next();
	}
}

function setupTriggers(parent)
{
	var collection = Array.from((parent || document).querySelectorAll(".ajaxLoad"));
	if(!collection) return;
	collection.filter(function(elm, index, array) {
		return typeof elm.sal === "undefined" || !elm.sal.init;
	}).forEach(function(elm, index, array){
		sal.addTrigger(elm);
	});	
}

function setupTargets(parent)
{
	var collection = Array.from((parent || document).querySelectorAll(".ajaxContent"));
	if(!collection) return;
	collection.forEach(function(elm, index, array){
		var parentTargetid = "";
		var assetid = elm.getAttribute("assetid");
		var asseturl = elm.getAttribute("asseturl");
		
		if(assetid === "main")
			parentTargetid = "root";
		if(!assetid.indexOf("content-"))
			parentTargetid = "main";
		if(!assetid.indexOf("subcontent-"))
			parentTargetid = "content-" + assetid.match(/-(.*)-/)[1];
		
		sal.addTarget(assetid, asseturl, parentTargetid);
	});
}

document.addEventListener('DOMContentLoaded', DOMContentLoaded, false);
function DOMContentLoaded()
{
	sal.init(); // setup targets root and history manager
	sal.setLoadUrlBeforeCallback(loadUrlBeforeCallback);
	sal.setLoadUrlAfterCallback(loadUrlAfterCallback);
	addSalEvts(); // setup events actions
	setupTargets();
	setupTriggers();
	// set current state from URL.
	// the current selected target MUST be existing and pushed! see setupTargets()
	sal.setHistoryHierarchyFromUrl(); 
}