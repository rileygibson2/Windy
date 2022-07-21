//Global
var nS = "http://www.w3.org/2000/svg";
var activeSection; //Which side bar section we are on
var alertMessageShown = false; //Whether a high wind speed alert message has been shown

var animatingOut;
var animatingIn;

function load() {
	//insertLoading(screen.width/2, screen.height/2, true);
	setTimeout(switchSections, 0, 0);
}

function switchSections(i) {
	if (animatingOut||activeSection==i) {
		if (animatingOut) alert('transitioning');
		if (activeSection==i) alert('same section');
		return;
	}
	activeSection = i;

	animateExit(0).then(function() {
		$('#effCont').empty(); //Empty container
			
		//Make request for content
		var req = new XMLHttpRequest();
		req.open('GET', 'dashboard.html', true);
		req.onreadystatechange = function() {
			if (req.readyState!=4&&req.status!=4) return;
			alert('content arrived');
			$('#effCont').html(req.responseText); //Load new elements into container
			updatePageData().then(result => animateEntrance(activeSection, 0));
		}

		req.send();
	});
}

function updatePageData() {
	return updatePageDataDashboard();
}

function implementData() {
	implementDataDashboard();
}

//Generic functions

function fadeIn(obj) {obj.css("animation", "fadeIn 1s ease-out forwards");}

function fadeOut(obj) {obj.css("animation", "fadeOut 0.5s ease-out forwards");}

function refreshParent(p) {$(p).html($(p).html());}

function animateEntrance(i, start) {
	if (true) { //Dashboard animations
		moveSlider(document.getElementsByClassName('sliderN')[0], true);
		setTimeout(removeLoading, start);
		setTimeout(fadeIn, start, $("#rtSpeed"));
		setTimeout(fadeIn, start+200, $("#rtDir"));
		setTimeout(fadeIn, start+400, $("#cCont"));
		setTimeout(fadeIn, start+600, $("#graph"));
		setTimeout(fadeIn, start+800, $("#slider"));
		setTimeout(animateDirection, start+2000);
		setTimeout(animateCircleGraphs, start+600);
		setTimeout(function() {
			if (rtAlarmLevel==3) initiateRedAlarm(); 
			if (rtAlarmLevel==2) initiateAmberAlarm(); 
		}, 4000);
	}
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
		setTimeout(resolve, start);
		animatingOut = false;
	});
	return promise;
}









