// scalar ajax library

var sal = (function(){
	"use strict";
	
	// *** sal core ***
	
	var Target = function(data)
	{
		this.self = this;
		this.children = [];
		this.parent = data.parent || undefined;
		this.id = data.id || undefined;
		this.url = data.url || undefined;
	};
	
	Target.prototype.pushChild = function(data){
		data.parent = this.self;
		var target = new Target(data);
		this.children.push(target);
	};
	
	Target.prototype.getElements = function()
	{
		return Array.from(document.querySelectorAll("*[assetid=" + this.id + "]"));
	}
	
	var triggers = [];
	var targets = [];
	var loadUrlBeforeCallback = null;
	var loadUrlAfterCallback = null;
	
	function dispatchEvt(_detail, evtName)
	{
		var event = new CustomEvent("sal." + evtName, {
			detail: _detail
		});
		window.dispatchEvent(new CustomEvent("sal." + evtName, event));
	}
	
	function updateHistory(url, target, options, elm)
	{
		if(!setStateObjFromElement(elm, target)) return;
		
		if(options.doPushState){
	  		history.pushState(stateObj, "", url);
	  	}
	}
	
	function getTotalProgress(value, curStep, totalStep)
	{
		return (100 / totalStep * (curStep - 1)) + ((100 / totalStep) * value / 100);
	}
	
	function loadUrlDone(url, target, options, response, curStep, totalStep, next)
	{
		var targetElm = getTargetByAttr("id", target);
		targetElm.children = [];
		targetElm.url = url;  	
	  	
	  	function end()
	  	{	  		
	 	  	dispatchEvt({
	 	  		originalEvent: null,
				eventProgress: "end",
				actionProgress: 100,
				stepProgress: 100,
				totalProgress: getTotalProgress(100, curStep, totalStep)
			}, "mainProgress");
	 	  	next();
	  	}
	  	
	  	loadUrlAfterCallback(url, target, options, response, end);
	}
	
	function doLoadUrl(url, target, options, curStep, totalStep, next)
	{
		dispatchEvt({
			originalEvent: null,
			eventProgress: "reqStart",
			actionProgress: 100,
			stepProgress: 25,
			totalProgress: getTotalProgress(25, curStep, totalStep)
		}, "mainProgress");
		
		var xhttp = new window.XMLHttpRequest();
		xhttp.addEventListener('progress', function(e) {
        	if(e.lengthComputable)
        	{
    			//loading goes from 25% to 75% of the total.
        		var actionProgress = e.loaded / e.total * 100;
        		dispatchEvt({
        			originalEvent: e,
        			eventProgress: "reqProgress",
        			actionProgress: actionProgress,
        			stepProgress: 25 + actionProgress / 2,
    				totalProgress: getTotalProgress(25 + actionProgress / 2, curStep, totalStep)
        		}, "mainProgress");
			}
        });
		xhttp.onreadystatechange = function() {
			if(xhttp.readyState == 4)
			{
				if (xhttp.status >= 200 && xhttp.status < 300) {
					dispatchEvt({
						originalEvent: null,
						eventProgress: "reqEnd",
						actionProgress: 100,
						stepProgress: 90,
						totalProgress: getTotalProgress(90, curStep, totalStep)
					}, "mainProgress");
					loadUrlDone(url, target, options, xhttp.responseText, curStep, totalStep, next);
				}
				else
				{
					dispatchEvt({
			    		originalEvent: null,
						eventProgress: "reqError",
						actionProgress: 100,
						stepProgress: 0,
						totalProgress: getTotalProgress(0, curStep, totalStep)
			 	    }, "mainProgress");
				}
			}
		};
		xhttp.open("GET", url + "?ajax=true", true);
		xhttp.send();
	}
	
	function loadUrl(url, target, options, curStep, totalStep, next)
	{
		options.doPushState =
			typeof options.doPushState !== 'undefined' ? options.doPushState : false;
		
		options.animate =
			typeof options.animate !== 'undefined' ? options.animate : true;
		
		next =
			typeof next !== 'undefined' ? next : function(){};
		
		var _next = function(){ doLoadUrl(url, target, options, curStep, totalStep, next); };
		loadUrlBeforeCallback(url, target, options, _next);
	}
	
	function setStateObjFromElement(elm, target)
	{
		var salhistory = elm.querySelectorAll("salHistory");
		if(!salhistory.length) return false;
		eval(salhistory[0].innerHTML);
	  	setHistoryHierarchy(target);
		return true;
	}
	
	function init()
	{
		targets.push(new Target({id: "root", children: []}));
		setupHistoryManager();
	}
	
	function loadingsEnd(targetId)
	{
		dispatchEvt({
			target: getTargetByAttr("id", targetId)
		}, "loadingsEnd");
	}
	
	function loadingsStart()
	{
		dispatchEvt({
		}, "loadingsStart");
	}
	
	function loadElement(trigger)
	{
		loadingsStart();
		loadUrl(trigger.url, trigger.target.id, {
					doPushState: true
				}, 1, 1, function(){
					loadingsEnd(trigger.target.id);
				});
	}

	function getTargetByAttr(attr, value, node)
	{
		if(typeof node === "undefined") node = targets[0];
		if(node[attr] === value)
			return node;
		for(var key in node.children)
		{
			var childNode = getTargetByAttr(attr, value, node.children[key]);
			if(childNode) return childNode;
		}
		return false;
	}
	
	//TODO: check if we can remove url from params and use just attribute asseturl
	function addTarget(targetid, url, parentTarget)
	{
		if(getTargetByAttr("id", targetid)) return; //already present
		
		if(typeof parentTarget === "undefined") parentTarget = targets[0];
		if(typeof parentTarget === "string") parentTarget = getTargetByAttr("id", parentTarget);
		
		parentTarget.pushChild(new Target({id: targetid, url: url}));
	}
	
	function addTrigger(elm)
	{
		// remove non HTML elms and already init
		/*elms.filter(function(val){
			return val instanceof HTMLElement && typeof elms.sal === undefined;
		});*/
		
		elm.sal = elm.sal || {};
		
		if(!(elm instanceof HTMLElement && typeof elm.sal.init === "undefined")) return;		
		
		var trigger = {};
		
		(function(trigger){
			trigger.clickEvent = function(e){
				e.preventDefault();
				loadElement(trigger);
			}
		})(trigger);
		elm.addEventListener("click", trigger.clickEvent);
		
		trigger.url = elm.getAttribute("href");
		trigger.target = getTargetByAttr("id", elm.getAttribute("targetid"));
		
		triggers.push(trigger);
		
		elm.sal.init = true;
	}
	
	function getHistoryHierarchy(target)
	{
		var curTarget = target;
		var hierarchy = null;
		while(curTarget.id != "root")
		{
			hierarchy = {
					id: curTarget.id,
					url: curTarget.url,
					child: hierarchy
			};
			curTarget = curTarget.parent;
		}
		return hierarchy;
	}
	
	function setHistoryHierarchyFromUrl()
	{		
		var target = getTargetByAttr("url", window.location.pathname);
		if(target)
			if(setStateObjFromElement(document, target))
				history.replaceState(stateObj, null, null);
			else
				console.error("can't find a salhistory tag");
		else
			console.error("can't get a target with current url status");
	}
	
	function setHistoryHierarchy(target)
	{
		stateObj.historyHierarchy = getHistoryHierarchy(target);
	}
	
	function setLoadUrlBeforeCallback(_loadUrlBeforeCallback)
	{
		loadUrlBeforeCallback = _loadUrlBeforeCallback;
	}
	
	function setLoadUrlAfterCallback(_loadUrlAfterCallback)
	{
		loadUrlAfterCallback = _loadUrlAfterCallback;		
	}
	
	// *** History Management ***
	
	var historyQueueCallbacks = [];
	var queueCallbacksTimeout = null;
	var historyQueue = [];
	var _isManagingHistory = false;
	var missingTargetCallback = null;
	
	function getHistoryObjs(state, stateObj)
	{
		var historyObjs = {};
		var hNew = state.historyHierarchy;
		var hCur = stateObj.historyHierarchy; //replace history on load new; *** NO PUSH ***
		var loadUrlArray = [];
		var newTarget = hNew;
		
		while(hNew){
			if(loadUrlArray.length || hNew.url !== hCur.url)
			{				
				(function(hNew){
					var index = loadUrlArray.length;
					var callback = (hNew.child)?
						function(){
							loadUrlArray[index + 1]();
						} :
						function(){
							_isManagingHistory = false;
							loadingsEnd(hNew.id);
						};
					loadUrlArray.push(function(){
						loadUrl(hNew.url, hNew.id, {
							// history events *** MUST NOT *** push a new state
							// on top of the history stack!
							doPushState: false
						}, index + 1, loadUrlArray.length, callback);
					});
				})(hNew);
			}
			
			hNew = hNew.child;
			if(hNew) newTarget = hNew;
		}
		
		historyObjs.loadUrlArray = loadUrlArray;
		historyObjs.leafTarget = getTargetByAttr("id", newTarget.id);
		
		return historyObjs;
	}
	
	function manageHistory(state, stateObj)
	{
		var target = null;
		var historyObjs = getHistoryObjs(state, stateObj);
		// loadUrlArray 0 -> secondary to primary
		// loadUrlArray 1 -> secondary to secondary same primary
		if(historyObjs.loadUrlArray.length <= 1 &&
		   historyObjs.leafTarget && historyObjs.leafTarget.url == state.contentUrl)
		{
			loadingsEnd(historyObjs.leafTarget.id);
			_isManagingHistory = false;
		}
		else
		{
			loadingsStart();
			historyObjs.loadUrlArray[0]();
		}
	}
	
	function setupPopstateEvt()
	{
		window.addEventListener("popstate", function(e){
			//Ignore inital popstate that some browsers fire on page load
			//var initialPop = !popped && location.href == initialURL;
			//popped = true;
			e.preventDefault();
			var state = e.state;
			_isManagingHistory = true;
			clearTimeout(queueCallbacksTimeout);
			historyQueueCallbacks = [];
			(function(state, stateObj){
				historyQueueCallbacks.push(
					function(){ manageHistory(state, stateObj); }
				);
			})(state, stateObj);
			startProcessCallbacksQueueTimeout();
		});
	}
	
	function processCallbacksQueue()
	{
		for(var i = 0; i < historyQueueCallbacks.length; i++)
		{
			historyQueueCallbacks[i]();
		}
		historyQueueCallbacks = [];
	}
	
	//avoid spamming history evts executing the queque every 200ms
	function startProcessCallbacksQueueTimeout()
	{
		queueCallbacksTimeout = setTimeout(function(){
			clearTimeout(queueCallbacksTimeout);
			processCallbacksQueue();
		}, 200);
	}
	
	function setupHistoryManager()
	{
		if(!(window.history && history.pushState)) return;
		if ('scrollRestoration' in history) {
			history.scrollRestoration = 'manual';
		}
		
		setupPopstateEvt();
	}
	
	function isManagingHistory()
	{
		return _isManagingHistory;
	}
	
	return {
		init: init,
		addTrigger: addTrigger,
		addTarget: addTarget,
		triggers: triggers,
		targets: targets,
		loadUrl: loadUrl,
		getTargetByAttr: getTargetByAttr,
		setLoadUrlBeforeCallback: setLoadUrlBeforeCallback,
		setLoadUrlAfterCallback: setLoadUrlAfterCallback,
		getHistoryHierarchy: getHistoryHierarchy,
		setHistoryHierarchy: setHistoryHierarchy,
		setHistoryHierarchyFromUrl: setHistoryHierarchyFromUrl,
		updateHistory: updateHistory,
		isManagingHistory: isManagingHistory
	};
})();