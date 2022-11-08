//Global
var nS = "http://www.w3.org/2000/svg";
var page;
var activeSection; //Which side bar section we are on

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
	if (cookie==""&&urlParam==null) gotoLogin(); //No stored session key
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
			setTimeout(switchSections, 0, 1);
		}
		else gotoLogin(); //Key is not still valid
	}
	req.send();

	//Initiate loading
	setTimeout(function() {if (!responseRecieved) insertLoading(screen.width/2, screen.height/2, true);}, loadingWait);

}

function mobileConfiguration() {
	isMobile = true;

	//Side bar tap open
	$("#sbLogo").click(function(event) { 
		toggleSideBar();
	});
}

function toggleSideBar() {
	if (sideBarOpen) {
		$('#sbCont').css("margin-left", "-75vw");
		sideBarOpen = false;
	}
	else {
		$('#sbCont').css("margin-left", "0vw");
		sideBarOpen = true;
	}
}

function hideAllComponents() {
	$('#effCont').css("display", "none");
	$('#sbCont').css("display", "none");
	$('#sc').css("display", "none");
	$('#sICont').css("display", "none");
}

function showAllComponents() {
	$('#effCont').css("display", "block");
	$('#sbCont').css("display", "block");
	$('#sc').css("display", "block");
	$('#sICont').css("display", "block");
}

function gotoLogin() {
	window.location.replace("/login");
}

function preset() {
	var a = document.getElementById("sbCont").getBoundingClientRect().top;
	$('#sbS').css("top", obj.getBoundingClientRect().top-a);
}

function switchSections(i) {
	//Move the tab indicator
	unhoverSB();
	var a = document.getElementById("sbCont").getBoundingClientRect().top;
	$('#sbS').css("top", document.getElementById("sbN"+(i+1)).getBoundingClientRect().top-a);

	//Close sidebar if mobile and open
	if (isMobile&&sideBarOpen) toggleSideBar();

	//Check sections
	if (animatingOut||animatingOut||activeSection==i) return;
	activeSection = i;

	//Exit current page
	if (page!=undefined) page.onExit();

	//Load new section
	var title;
	var text;
	var unitText;
	switch (activeSection) {
		case 0: 
			if (unitName==undefined) title = "Dashboard";
			else title = unitName;
			text = "Real time data and stats";
			page = new DashboardPage("dashboard");
			break;
		case 1:
			title = "Devices";
			text = "Check status and add/remove units";
			unitText = "";
			page = new UnitsPage("units");
			break;
		case 2:
			title = "Records";
			text = "See historical records";
			unitText = "";
			page = new HistoryPage("history");
			break;
		case 3:
			title = "Reports";
			text = "Professionally formatted information for different events";
			unitText = "";
			page = new ReportsPage("reports");
			break;
		case 4:
			title = "Forecast";
			text = "Predicted wind and weather data";
			unitText = "";
			page = new ForecastPage("forecast");
			break;
	}

	//Run page mobile configuration
	if (screen.width<600&&typeof page.mobileConfiguration==="function") page.mobileConfiguration();

	//Swap section indicator elements
	$("#sICont").css("animation", "none");
	setTimeout(function() {
		$("#sITitle").html(title);
		$("#sIText").html(text);
		$("#sIUnit").html(unitText);
		$("#sICont").css("animation", "sIMoveIn 0.5s ease-in forwards");
	}, 100);

	animateExit(0).then(function() {
		$('#effCont').empty(); //Empty container

		//Make request for content
		var req = new XMLHttpRequest();
		req.open('GET', page.contentName+'.html', true);
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
	gotoLogin();
}


//Generic functions

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
	insertMessage("There was an authorisation error.", 0);
}

function clientErrorResp() {
	insertMessage("There was an error on your side.", 0);
}

function serverErrorResp() {
	insertMessage("There was an error on the other end.", 0);
}









