//Global
var loadingWait = 500; //Time to delay a loading screen for

function setupLogin() {
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

function gotoWebApp(sessionKey) {
	//Add url param if have to
	if (document.cookie=="") window.location.replace("/webapp?s="+sessionKey);
	else window.location.replace("/webapp");
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
					//Set session key
					sessionKey = req1.responseText;
					//Add cookie
					var d = new Date();
					d.setTime(d.getTime()+3.6e+6);
					document.cookie = "wTXsK="+sessionKey+"; expires="+d.toGMTString()+"; path=/";
					//Finish up
					gotoWebApp(sessionKey);
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

function badLogin() {
	//Let user know by shaking the password box
	$('#lPass').css("animation", "shake 0.3s forwards");
	$('#lPassIcon').css("animation", "shake 0.3s forwards");
	setTimeout(function() {
		$('#lPass').css("animation", "none");
		$('#lPassIcon').css("animation", "none");
	}, 300);
}

function hash(message, salt) {
	var hash = sha256.create();
	hash.update(salt+message);
	return hash.hex();
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

//Add login elements
	//Container
	/*var c = document.createElement("div");
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

	$('body').append(c);*/