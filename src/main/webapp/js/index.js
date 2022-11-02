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

function load() {
	//deleteCookie();

	//Check cookies for stored session keys
	var cookie = getCookie("wTXsK");
	if (cookie=="") openLogin(); //No stored session key
	else { //Check to see if stored key is still a valid key
		sessionKey = cookie;
		responseRecieved = false;
		var req = new XMLHttpRequest();
		req.open('GET', 'data/?sK='+sessionKey+'&m=7&t='+Math.random(), true);
		req.onreadystatechange = function() {
			if (req.readyState!=4) return;
			responseRecieved = true;
			removeLoading();
			if (req.status==200) { //Key is still valid
				unit = req.responseText;
				setTimeout(switchSections, 0, 0);
			}
			else openLogin(); //Key is not still valid
		}
		req.send();

		//Initiate loading
		setTimeout(function() {if (!responseRecieved) insertLoading(screen.width/2, screen.height/2, true);}, loadingWait);
	}
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

//Login actions

function openLogin() {
	//Add login elements
	//Container
	var c = document.createElement("div");
	c.setAttribute("id", 'lCont');
	//Logo
	var d = document.createElement("div");
	d.setAttribute("id", 'lLogo');
	c.append(d);
	//Username Icon
	d = document.createElement("div");
	d.setAttribute("class", 'lInputIcon');
	d.setAttribute("id", 'lUnitIcon');
	d.style.backgroundImage = 'url("../assets/icons/device.svg")';
	d.style.marginTop = "4vh";
	c.append(d);
	//Username
	d = document.createElement("input");
	d.setAttribute("class", 'lInput');
	d.setAttribute("id", 'lUID');
	d.placeholder = "Unit ID";
	d.style.marginTop = "4vh";
	c.append(d);
	//Password Icon
	d = document.createElement("div");
	d.setAttribute("class", 'lInputIcon');
	d.setAttribute("id", 'lPassIcon');
	d.style.backgroundImage = 'url("../assets/icons/lock.svg")';
	c.append(d);
	//Password
	d = document.createElement("input");
	d.setAttribute("class", 'lInput');
	d.setAttribute("id", 'lPass');
	//d.type = "password";
	d.placeholder = "Password";
	c.append(d);
	//Login button
	d = document.createElement("div");
	d.setAttribute("id", 'lButton');
	//Login button text
	var t = document.createElement("div");
	t.setAttribute("id", 'lButtonT');
	t.innerHTML = "Login";
	d.append(t);
	c.append(d);

	$('body').append(c);
	
	//Listeners
	document.getElementById('lButton').addEventListener('mousedown', (event) => {
		validateLogin();
	});
	document.getElementById('lButton').addEventListener('mouseover', (event) => {
		$('#lButton').css('opacity', '1');
		$('#lButtonT').css('opacity', '1');
	});
	document.getElementById('lButton').addEventListener('mouseout', (event) => {
		$('#lButton').css('opacity', '0.9');
		$('#lButtonT').css('opacity', '0.9');
	});
	document.getElementById('lPass').addEventListener("keyup", event => {
    	loginKeyPress(event);
	});

	//Input focus style listeners
	$('#lUID').on("focus", function() {
		$('#lUnitIcon').css("background-color", "rgb(100, 100, 100)");
	});
	$('#lUID').on("focusout", function() {
		$('#lUnitIcon').css("background-color", "rgb(60, 60, 60)");
	});
	$('#lPass').on("focus", function() {
		$('#lPassIcon').css("background-color", "rgb(100, 100, 100)");
	});
	$('#lPass').on("focusout", function() {
		$('#lPassIcon').css("background-color", "rgb(60, 60, 60)");
	});
}

function closeLogin() {
	$('#lCont').css('opacity', '0');
	setTimeout(function() {$('#lCont').remove()}, 500);
	setTimeout(switchSections, 0, 0);
}

function validateLogin() {
	//Check inputs are filled
	if ($('#lUID').val()=="") $('#lUID').css('border-color', 'rgb(255, 20, 20)');
	else $('#lUID').css('border-color', 'rgb(60, 60, 60)');
	if ($('#lPass').val()=="") $('#lPass').css('border-color', 'rgb(255, 20, 20)');
	else $('#lPass').css('border-color', 'rgb(60, 60, 60)');
	if ($('#lUID').val()==""||$('#lPass').val()=="") return;


	//Create authentication session on server and get salts
	responseRecieved = false;
	var req = new XMLHttpRequest();
	req.open('GET', 'data/?m=8&user='+$('#lUID').val()+'&t='+Math.random(), true);
	req.onreadystatechange = function() {
		if (req.readyState!=4) return;
		responseRecieved = true;
		if (req.status==500) serverErrorResp();
		if (req.status==400) clientErrorResp();
		if (req.status==401) badLogin();
		if (req.status==200) { //Successfully retrieved an authorisation session
			var authSesh = JSON.parse(req.responseText);
			
			//Hash password with both auth salts
			var p = hash(passwordField, authSesh.s1);
			p = hash(p, authSesh.s2);

			responseRecieved = false;
			var req1 = new XMLHttpRequest();
			req1.open('GET', 'data/?m=5&user='+$('#lUID').val()+'&p='+p+'&asID='+authSesh.id+'&t='+Math.random(), true);
			req1.onreadystatechange = function() {
				if (req1.readyState!=4) return;
				responseRecieved = true;
				removeLoading();
				if (req1.status==200) { //Success
					//Set session key and default unit
					var jObj = JSON.parse(req1.responseText);
					sessionKey = jObj.sK;
					unit = jObj.defunit;
					//Add cookie
					var d = new Date();
					d.setTime(d.getTime()+3.6e+6);
					document.cookie = "wTXsK="+sessionKey+"; expires="+d.toGMTString()+"; path=/";
					//Finish up
					closeLogin();
				}
				else badLogin(); //Fail
			}
			req1.send();
		}
	}
	req.send();

	//Initiate loading
	setTimeout(function() {if (!responseRecieved) insertLoading(screen.width/2, screen.height/2, true);}, loadingWait);
}

var passwordField = "";

function loginKeyPress(event) {
	//Simulate password field style value hiding
	if (event.key=="Backspace") passwordField = passwordField.substring(0, passwordField.length-1);
	else if (event.key.length==1) passwordField+=event.key;
	var bullets = "";
	for (i=0; i<passwordField.length; i++) bullets += '\u2022';
	$('#lPass').val(bullets);

	if (event.key!=="Enter") return;
	validateLogin();
}

function logout() {
	closeSettings();
	$('#effCont').empty();
	sessionKey = null;
	activeSection = null;
	passwordField = "";
	deleteCookie();
	openLogin();
}

function badLogin() {
	//Let user know by shaking the password box
	$('#lPass').css("animation", "shake 0.3s forwards");
	$('#lPassIcon').css("animation", "shake 0.3s forwards");
	setTimeout(function() {
		$('#lPass').css("animation", "none");
		$('#lPassIcon').css("animation", "none");
	}, 300);
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









