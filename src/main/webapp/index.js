//Global
var nS = "http://www.w3.org/2000/svg";
var activeSection; //Which side bar section we are on
var alertMessageShown = false; //Whether a high wind speed alert message has been shown
var transitioning = false; //Whether we are currently transitioning between sections

function load() {
	insertLoading(screen.width/2, screen.height/2, true);
	/*updatePageData();
	animateEntrance(1, 1000);*/

	setTimeout(switchSections, 1000, 0);
}

function switchSections(i) {
	if (transitioning||activeSection==i) {
		if (transitioning) alert('transitioning');
		if (activeSection==i) alert('same section');
		return;
	}

	transitioning = true;
	activeSection = i;
	var time = animateExit(0);
	
	//Make request for content
	var req = new XMLHttpRequest();
	req.open('GET', 'dashboard.html', true);
	/*req.onreadystatechange = function() {
		if (req.readyState!=4&&req.status!=4) return;
	}*/
	req.send();

	setTimeout(function() {
		$('#effCont').empty(); //Empty container
		$('#effCont').html(req.responseText); //Load new elements into container
		updatePageData(); //Do things to make it displayable
		animateEntrance(1, 0);
		transitioning = false;
	}, time+1000);
}

function updatePageData() {
	updatePageDataDashboard();
}

function implementData() {
	implementDataDashboard();
}

//Generic functions

function fadeIn(obj) {obj.css("animation", "fadeIn 1s ease-out forwards");}

function fadeOut(obj) {obj.css("animation", "fadeOut 0.5s ease-out forwards");}

function refreshParent(p) {$(p).html($(p).html());}

function animateEntrance(i, start) {
	if (i==1) { //Dashboard animations
		moveSlider(document.getElementsByClassName('sliderN')[0], true);
		setTimeout(removeLoading, start);
		setTimeout(fadeIn, start, $("#rtSpeed"));
		setTimeout(fadeIn, start+200, $("#rtDir"));
		setTimeout(fadeIn, start+400, $("#cCont"));
		setTimeout(fadeIn, start+600, $("#graph"));
		setTimeout(fadeIn, start+800, $("#slider"));
		setTimeout(animateGraph, start+100);
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
	redAlarmAniKill = true;
	var c1 = $('#effCont').children();
	for (i=0; i<c1.length; i++) {
		var c2 = c1.eq(i).children();
		for (z=c2.length; z>=0; z--) {
			setTimeout(fadeOut, start, c2.eq(z));
			start += 40;
		}
	}
	return start;
}









