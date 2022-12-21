//Global
var nS = "http://www.w3.org/2000/svg";
var page;
var activeSection; //Which side bar section we are on
var descriptions = ["Real time data and stats", "Check status and add/remove units", "See historical records", "Formatted information for different events", "Predicted wind and weather data"];
var persComps = ["sc", "effCont", "sICont", "sbCont"]; //Persistant components
var alertLevels = [50, 80];

//Synchronisation booleans
var animatingOut;
var animatingIn;

//Request
var unit;
var unitName;
var sessionKey;
var responseRecieved; //Used for delayed fuse loading screens after requests
var loadingWait = 500; //Time to delay a loading screen for

//Mobile
var isMobile;
var sideBarOpen;


function load() {
	//Configure for mobile first
	if (screen.width<600) mobileConfiguration();

	//deleteCookie();
	hideAllComponents(); //Hide to avoid component flash

	//Check cookies and params for stored session keys
	var cookie = getCookie("wTXsK");
	var urlParam = new URLSearchParams(window.location.search).get('s');
	if (cookie==""&&urlParam==null) gotoLogin(0); //No stored session key
 	if (urlParam!=null) sessionKey = urlParam;
 	if (cookie!="") sessionKey = cookie;

 	//Check to see if stored key is still a valid key
	responseRecieved = false;
	var req = new XMLHttpRequest();
	req.open('GET', 'data/?sK='+sessionKey+'&m=7&t='+Math.random(), true);
	req.onreadystatechange = function() {
		if (req.readyState!=4) return;
		responseRecieved = true;
		removeLoading();
		if (req.status==200) { //Key is still valid
			showAllComponents();
			unit = req.responseText;
			setTimeout(switchSections, 0, 0);
		}
		else gotoLogin(0); //Key is not still valid
	}
	req.send();

	//Initiate loading
	setTimeout(function() {if (!responseRecieved) insertLoading(screen.width/2, screen.height/2, true);}, loadingWait);

}

function mobileConfiguration() {
	isMobile = true;

	//Get mobile sidebar
	var req = new XMLHttpRequest();
	req.open('GET', 'mobilecomponents/sidebar.html', true);
	req.onreadystatechange = function() {
		if (!checkResponse(req)) return;
		$('#sbCont').empty(); //Empty container
		$('#sbCont').html(req.responseText); //Load new elements into container
	}
	req.send();

	//Sidebar swipe open action
	var hammertime = new Hammer(document.body);
	hammertime.on('swipe', function(ev) {
		if (ev.direction==4&&!sideBarOpen) {
			var finalX = ev.srcEvent.pageX || ev.srcEvent.screenX || 0;
  			start = finalX - ev.deltaX;

  			//Only open if swipe started in first 20% of screen
			if (start<(screen.width*0.2)) {
				toggleSideBar();
			}
		}
		if (ev.direction==2&&sideBarOpen) toggleSideBar();
	});
}

function toggleSideBar() {
	if (sideBarOpen) {
		$('#sbCont').css("margin-left", "-60vw");
		$('#sbLogo').css("opacity", "1");
		unblurComponents("sbCont");
		removeBlocker();
		sideBarOpen = false;
	}
	else {
		$('#sbCont').css("margin-left", "0vw");
		$('#sbLogo').css("opacity", "0");
		blurComponents("sbCont");
		addBlocker(toggleSideBar);
		sideBarOpen = true;
	}
}

function gotoLogin(m) {
	if (m==0) window.location.replace("/login");
	else window.location.replace("/login?m=1");
}

function preset() {
	var a = document.getElementById("sbCont").getBoundingClientRect().top;
	$('#sbS').css("top", obj.getBoundingClientRect().top-a);
}

function switchSections(i) {
	//Move the tab indicator
	unhoverSB();
	if (!isMobile) {
		var a = document.getElementById("sbCont").getBoundingClientRect().top;
		$('#sbS').css("top", document.getElementById("sbN"+(i+1)).getBoundingClientRect().top-a);
	}
	if (isMobile) {
		if (sideBarOpen) toggleSideBar(); //Close sidebar if open
		var a = $("#sbCont").offset().top;
		var t = $("#sbNCont"+(i+1)).offset().top;
		$('#sbS').css("top", t-a);
	}

	//Check sections
	if (animatingOut||animatingOut||activeSection==i) return;
	activeSection = i;

	//Exit current page
	if (page!=undefined) page.onExit();

	//Load new section
	var unitText = "";
	switch (activeSection) {
		case 0: 
			if (unitName!=undefined) var titleOverride = unitName;
			page = new DashboardPage();
			break;
		case 1: page = new UnitsPage(); break;
		case 2: page = new HistoryPage();break;
		case 3: page = new ReportsPage(); break;
		case 4: page = new ForecastPage(); break;
	}

	//Run page mobile configuration
	if (screen.width<600&&typeof page.mobileConfiguration==="function") page.mobileConfiguration();

	//Swap section indicator elements
	$("#sICont").css("animation", "none");
	setTimeout(function() {
		if (titleOverride!=undefined) $("#sITitle").html(titleOverride);
		else $("#sITitle").html(page.title);
		$("#sIText").html(descriptions[activeSection]);
		$("#sIUnit").html(unitText);
		$("#sICont").css("animation", "sIMoveIn 0.5s ease-in forwards");
	}, 100);

	animateExit(0).then(function() {
		$('#effCont').empty(); //Empty container

		//Make request for content
		var req = new XMLHttpRequest();
		var location = page.contentName+'.html';
		if (isMobile&&page.hasMobileContent) location = "mobilecomponents/"+page.contentName+'.html';
		req.open('GET', location, true);
		req.onreadystatechange = function() {
			if (!checkResponse(req)) return;
			$('#effCont').html(req.responseText); //Load new elements into container
			page.updatePageData().then(result => page.animateEntrance(0));
		}
		req.send();
	});
}

//Sidebar actions

function hoverSB(i) {
	if (isMobile) return; //No hover effect for mobile
	
	//Dim all others and set this to full
	$('.sbN').eq(i).css('opacity', '1');
	for (z=0; z<5; z++) {
		if (i!=z) {
			$('.sbN').eq(z).css('opacity', '0.4');
		}
	}

	//Move icon left
	$('#sbIcon'+(i+1)).css({'margin-top':'-15%', 'background-size':'50%'});
	$('#sbLabel'+(i+1)).css('opacity', '1');
}

function unhoverSB() {
	if (isMobile) return; //No hover effect for mobile

	//Reset all
	for (i=0; i<5; i++) {
		$('.sbN').eq(i).css('opacity', '1');
		$('#sbIcon'+(i+1)).css({'margin-top':'0%', 'background-size':'60%'});
		$('#sbLabel'+(i+1)).css('opacity', '0');
	}
}

function logout() {
	closeSettings();
	$('#effCont').empty();
	sessionKey = null;
	activeSection = null;
	passwordField = "";
	deleteCookie();
	//TODO need to send code to server to invalidate session
	gotoLogin(1);
}


//Generic functions

function minsToMs(mins) {
		return mins*60000;
}

function blurComponents(omit) {
	for (i=0; i<persComps.length; i++) {
		if (persComps[i]!=omit) $('#'+persComps[i]).css('filter', 'blur(10px)');
	}
}

function unblurComponents(omit) {
	for (i=0; i<persComps.length; i++) {
		if (persComps[i]!=omit) $('#'+persComps[i]).css('filter', 'none');
	}
}

function hideAllComponents() {
	for (i=0; i<persComps.length; i++) {
		$('#'+persComps[i]).css('display', 'none');
	}
}

function showAllComponents() {
	for (i=0; i<persComps.length; i++) {
		$('#'+persComps[i]).css('display', 'block');
	}
}

//Element needs to be z>300 to be above blocker
function addBlocker(callback) {
	var blocker = document.createElement("div");
	blocker.id = "genericBlocker";
	$('body').append(blocker);
	blocker.addEventListener("click", callback);
}

function removeBlocker() {
	$('#genericBlocker').css('opacity', '0');
	setTimeout(function() {
		$('#genericBlocker').remove();
	}, 200);
}

function fadeIn(obj) {obj.css("animation", "fadeIn 0.8s ease-out forwards");}

function fadeOut(obj) {obj.css("animation", "fadeOut 0.5s ease-in forwards");}

function hash(message, salt) {
	var hash = sha256.create();
	hash.update(salt+message);
	return hash.hex();
}

function getCookie(cname) {
	let name = cname + "=";
	let decodedCookie = decodeURIComponent(document.cookie);
	let ca = decodedCookie.split(';');
  	for (let i = 0; i <ca.length; i++) {
    	let c = ca[i];
   		while (c.charAt(0) == ' ') {
      		c = c.substring(1);
    	}
    	if (c.indexOf(name) == 0) {
      		return c.substring(name.length, c.length);
    	}
  }
  return "";
}

function deleteCookie() {
	document.cookie = "wTXsK=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
}

function openHelp(x, y, message) {
	$('#helpCont').html(message);
	var l = x-($('#helpCont').outerWidth()/2);
	var t = y-$('#helpCont').outerHeight();
	$('#helpCont').css({'left':l+'px', 'top':t+'px', 'display':'block', 'opacity':'0.5'});
}

function closeHelp() {
	$('#helpCont').css('opacity', '0');
	setTimeout(function() {$('#helpCont').css('display', 'none');}, 100);
}

function addComponent(container, location) {
	var req = new XMLHttpRequest();
	req.open('GET', location, true);
	req.onreadystatechange = function() {
		if (!checkResponse(req)) return;
		container.append(req.responseText); //Load new elements into container
	}
	req.send();
}

/*function getResource(location, onstatechange) {
	var req = new XMLHttpRequest();
	req.open('GET', location, true);
	req.onreadystatechange = function() {
		if (!checkResponse(req)) return;
		container.append(req.responseText); //Load new elements into container
	}
	req.send();
}*/

function animateExit(start) {
	//Animate elements out - nested for loop used because first element is a container for visible modules
	animatingOut = true;
	var c1 = $('#effCont').children();
	for (i=0; i<c1.length; i++) {
		setTimeout(fadeOut, start, c1.eq(i));
		start += 40;
	}

	let promise = new Promise(function (resolve, reject) {
		setTimeout(resolve, start+500);
		animatingOut = false;
	});
	return promise;
}

function checkResponse(req) {
	if (req.readyState!=4) return false;
	responseRecieved = true;
	removeLoading();
	if (req.status==500) serverErrorResp();
	if (req.status==400) clientErrorResp();
	if (req.status==401) unauthorisedResp();
	if (req.status==200) return true;
	return false;
}

function unauthorisedResp() {
	insertMessage("There was an authorisation error.", 0, 0);
}

function clientErrorResp() {
	insertMessage("There was an error on your side.", 0, 0);
}

function serverErrorResp() {
	insertMessage("There was an error on the other end.", 0, 0);
}









