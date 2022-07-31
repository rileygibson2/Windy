//Global
var nS = "http://www.w3.org/2000/svg";
var activeSection; //Which side bar section we are on
var alertMessageShown = false; //Whether a high wind speed alert message has been shown

var animatingOut;
var animatingIn;

var page;
var unit = "windy32b1";

function load() {
	//insertLoading(screen.width/2, screen.height/2, true);
	//setTimeout(switchSections, 0, 0);

	openLogin();
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

	//Load new section
	var title;
	var text;
	switch (activeSection) {
		case 0: 
			title = "Dashboard";
			text = "Real time data and stats";
			page = new DashboardPage("dashboard");
			break;
		case 1:
			title = "Devices";
			text = "Check status and add/remove units";
			page = new UnitsPage("units");
			break;
		case 2:
			title = "Records";
			text = "See historical records";
			page = new HistoryPage("history");
			break;
		case 3:
			title = "Reports";
			text = "Formatted reports for different events";
			page = new DashboardPage("dashboard");
			break;
	}

	//Swap section indicator elements
	$("#sICont").css("animation", "none");
	setTimeout(function() {
		$("#sITitle").html(title);
		$("#sIText").html(text);
		$("#sICont").css("animation", "sIMoveIn 0.5s ease-in forwards");
	}, 100);

	animateExit(0).then(function() {
		$('#effCont').empty(); //Empty container
		//insertLoading(screen.width/2, screen.height/2, true);
			
		//Make request for content
		var req = new XMLHttpRequest();
		req.open('GET', page.contentName+'.html', true);
		req.onreadystatechange = function() {
			if (req.readyState!=4&&req.status!=4) return;
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
	for (z=0; z<4; z++) {
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
	for (i=0; i<4; i++) {
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
	document.getElementById('lPass').addEventListener("keydown", event => {
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
	unit = $('#lUID').val();

	//Check inputs are filled
	if ($('#lUID').val()=="") $('#lUID').css('border-color', 'rgb(255, 20, 20)');
	else $('#lUID').css('border-color', 'rgb(60, 60, 60)');
	if ($('#lPass').val()=="") $('#lPass').css('border-color', 'rgb(255, 20, 20)');
	else $('#lPass').css('border-color', 'rgb(60, 60, 60)');

	var req = new XMLHttpRequest();
	req.open('GET', 'data/?m=5&uID='+$('#lUID').val()+'&p='+hash($('#lPass').val())+'&t='+Math.random(), true);
	req.onreadystatechange = function() {
		if (req.readyState!=4&&req.status!=4) return;
		if (req.responseText.trim()=="valid") closeLogin(); //Success
		else { //Fail
			$('#lPass').css("animation", "shake 0.3s forwards");
			$('#lPassIcon').css("animation", "shake 0.3s forwards");
			setTimeout(function() {
				$('#lPass').css("animation", "none");
				$('#lPassIcon').css("animation", "none");
			}, 300);
		}
	}

	req.send();
}

function loginKeyPress(event) {
	if (event.key!=="Enter") return;
	validateLogin();
	event.preventDefault();
}


//Generic functions

function fadeIn(obj) {obj.css("animation", "fadeIn 0.8s ease-out forwards");}

function fadeOut(obj) {obj.css("animation", "fadeOut 0.5s ease-in forwards");}

function refreshParent(p) {$(p).html($(p).html());}

function hash(s) {
	return s.split("").reduce(function(a,b){a=((a<<5)-a)+b.charCodeAt(0);return a&a},0);
}

function animateExit(start) {
	//Animate elements out - nested for loop used because first element is a container for visible modules
	animatingOut = true;
	redAlarmAniKill = true;
	var c1 = $('#effCont').children();
	for (i=0; i<c1.length; i++) {
		var c2 = c1.eq(i).children();
		for (z=c2.length; z>=0; z--) {
			setTimeout(fadeOut, start, c2.eq(z));
			start += 40;
		}
	}

	let promise = new Promise(function (resolve, reject) {
		setTimeout(resolve, start+500);
		animatingOut = false;
	});
	return promise;
}









