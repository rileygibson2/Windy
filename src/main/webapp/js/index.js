//Global
var nS = "http://www.w3.org/2000/svg";
var activeSection; //Which side bar section we are on
var alertMessageShown = false; //Whether a high wind speed alert message has been shown

var animatingOut;
var animatingIn;

var page;

function load() {
	//insertLoading(screen.width/2, screen.height/2, true);
	//setTimeout(switchSections, 0, 1);

	openLogin();
}

function switchSections(i) {
	if (animatingOut||activeSection==i) {
		if (animatingOut) alert('transitioning');
		if (activeSection==i) alert('same section');
		return;
	}
	activeSection = i;

	switch (activeSection) {
		case 0: page = new DashboardPage("dashboard"); break;
		case 1: page = new UnitsPage("units"); break;
		case 2: page = new HistoryPage("history"); break;
		case 3: page = new DashboardPage("dashboard"); break;
	}	

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
	$('.sbN').eq(i).css('opacity', '1');
	for (z=0; z<4; z++) {
		if (i!=z) {
			$('.sbN').eq(z).css('opacity', '0.4');
		}
	}
}

function unhoverSB() {
	for (z=0; z<4; z++) {
		$('.sbN').eq(z).css('opacity', '1');
	}
}

function selectSB(obj, i) {
	unhoverSB();
	//Move the tab indicator
	var a = document.getElementById("sbCont").getBoundingClientRect().top;
	$('#sbS').css("top", obj.getBoundingClientRect().top-a);
	switchSections(i);
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
	d.setAttribute("id", 'lUnit');
	d.placeholder = "Unit ID";
	d.style.marginTop = "4vh";
	c.append(d);
	//Password Icon
	d = document.createElement("div");
	d.setAttribute("class", 'lInputIcon');
	d.setAttribute("id", 'lPasswordIcon');
	d.style.backgroundImage = 'url("../assets/icons/lock.svg")';
	c.append(d);
	//Password
	d = document.createElement("input");
	d.setAttribute("class", 'lInput');
	d.setAttribute("id", 'lPassword');
	d.type = "password";
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
		closeLogin();
	});
	document.getElementById('lButton').addEventListener('mouseover', (event) => {
		$('#lButton').css('opacity', '1');
		$('#lButtonT').css('opacity', '1');
	});
	document.getElementById('lButton').addEventListener('mouseout', (event) => {
		$('#lButton').css('opacity', '0.8');
		$('#lButtonT').css('opacity', '0.8');
	});
	document.getElementById('lPassword').addEventListener("keydown", event => {
    	validateLogin(event);
	});
}

function closeLogin() {
	$('#lCont').css('opacity', '0');
	setTimeout(function() {$('#lCont').remove()}, 500);
	setTimeout(switchSections, 0, 0);
}

function validateLogin(event) {
	if (event.key!=="Enter") return;
	$('#lPassword').css("animation", "shake 0.3s forwards");
	$('#lPasswordIcon').css("animation", "shake 0.3s forwards");
	setTimeout(function() {
		$('#lPassword').css("animation", "none");
		$('#lPasswordIcon').css("animation", "none");
	}, 300);
	event.preventDefault();
}


//Generic functions

function fadeIn(obj) {obj.css("animation", "fadeIn 0.8s ease-out forwards");}

function fadeOut(obj) {obj.css("animation", "fadeOut 0.5s ease-in forwards");}

function refreshParent(p) {$(p).html($(p).html());}

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









