//Real-time data
var rtWindSpeed;
var rtLastUpdateTime;
var rtDegrees;
var rtAlarmLevel;

//Graph data
var gYTopVal;
var gYBotVal;
var gPointsOnX;
var gXMarkings = [];
var gYMarkings = [];
var gData = [];
var gVisualData = []; //Used for initial graph animation
var gViewMode = 1;
var alarmLevelTimes = [];

//Required actions

function updatePageDataDashboard() {
  let promise = new Promise(function (resolve, reject) {
	var req = new XMLHttpRequest(); //Fetch data
	req.open('GET', 'data/?m=1&gm='+gViewMode+'&t='+Math.random(), true);
	req.onreadystatechange = function() {
		if (req.readyState==4&&req.status==200) {
			alert('data arrived');
			recieveData(req);
			resolve();
		}
	}
	req.send();
  });
  return promise;
}

function recieveData(req) {
	//Reset graph axis
	gYTopVal = 100;
	gYBotVal = 0;
	gXMarkings = [];
	gYMarkings = [20, 40, 60, 80, 100];

	jArr = JSON.parse(req.responseText);

	//Load real time data
	rtWindSpeed = jArr[0].rtWindSpeed;
	rtDegrees = jArr[0].rtDegrees;
	rtLastUpdateTime = jArr[0].rtLastUpdateTime;
	rtAlarmLevel = jArr[0].rtAlarmLevel;
	alarmLevelTimes = jArr[0].alarmLevelTimes.slice(1, -1).split(",");

	//Load graph data
	gData = jArr[1].gData.slice(1, -1).split(",");
	gVisualData = [];
	for (i=0; i<gData.length; i++) gVisualData[i] = 0; //Copy incase no animation is run
	implementDataDashboard();
}


function implementDataDashboard() {
	//Real-time module
	
	$('#rtSpeed1').html(rtWindSpeed); //Set wind speed
	
	switch (rtAlarmLevel) { //Set background color according to alarm level
		case 1: $('#rtSpeed').css('background-image', 'linear-gradient(to bottom right, rgb(100, 199, 100) 0%, rgb(3, 173, 15) 50%)'); break;
		case 2: 
			$('#rtSpeed').css('background-image', 'linear-gradient(to bottom right, rgb(247, 182, 40) 0%, rgb(255, 153, 0) 50%)');
			$('#rtSpeedIcon').css({'background-image':'url("../assets/icons/warning.svg")', 'background-size':'65%', 'background-position':'50% 50%'});
			break;
		case 3: 
			$('#rtSpeed').css('background-image', 'linear-gradient(to bottom right, rgb(247, 67, 27) 0%, rgb(220, 8, 0) 50%)');
			$('#rtSpeedIcon').css({'background-image':'url("../assets/icons/warning.svg")', 'background-size':'65%', 'background-position':'50% 50%'});
			break;
	}

	//Find diff between last update time and now and display
	var timeDiff = Math.abs(rtLastUpdateTime-Date.now());
	var hours = Math.floor(timeDiff/3600000);
	var mins = Math.floor(timeDiff/60000);
	if (hours>=1) {
		if (hours==1) $('#rtSpeed4').html(hours+" hour ago");
		else $('#rtSpeed4').html(hours+" hours ago");
	}
	else {
		if (mins==1) $('#rtSpeed4').html(mins+" min ago");
		else $('#rtSpeed4').html(mins+" mins ago");
	}

	//Display degrees
	$('#rtDir2').html(rtDegrees+"°");
	if (rtDegrees<45) $('#rtDir1').html("N");
	if (rtDegrees>=45) $('#rtDir1').html("NE");
	if (rtDegrees>=90) $('#rtDir1').html("E");
	if (rtDegrees>=135) $('#rtDir1').html("SE");
	if (rtDegrees>=180) $('#rtDir1').html("S");
	if (rtDegrees>=225) $('#rtDir1').html("SW");
	if (rtDegrees>=270) $('#rtDir1').html("W");
	if (rtDegrees>=315) $('#rtDir1').html("NW");

	//Graph module

	//Find y axis markings based on graph view mode and current time
	var ms = 1000*60*5; //Num ms in 5 minutes for rounding
	var d = Date.now();

	switch (gViewMode) {
	case 1: //Hour mode
		gPointsOnX = 12*2; //24 readings an hour - every 5 mins
		var d = Math.floor(d/ms)*ms; //Round down to nearest 5 mins
		
		for (i=0; i<13; i++) {
			date = new Date(d-((i)*300000));

			if (date.getHours()==0&&date.getMinutes()==0) { //New day so add day format
				gXMarkings[i] = date.getDate()+" "+date.toLocaleString('default', {month: 'short'});
			}
			else { //Add hour formula
				var h = date.getHours();
				if (h<10) h = '0'+h;
				var m = date.getMinutes();
				if (m<10) m = '0'+m;
				gXMarkings[i] = h+':'+m;
			}
		}
		break;

	case 2: //Day mode
		gPointsOnX = 12*24; //12 readings an hour - every 10 mins

		for (i=0; i<25; i++) {
			date = new Date(d-((i)*3600000));
			var h = date.getHours();
			if (h==0) { //New day so add day format
				gXMarkings[i] = date.getDate()+" "+date.toLocaleString('default', {month: 'short'});
			}
			else { //Add hour formula
				var t = 'am';
				if (h>12) {
					t = 'pm';
					h -= 12;
				}
				if (h==12) t = 'pm';
				if (h==0) h = 12;
				gXMarkings[i] = h+t;
			}
		}
		break;

	case 3: //Week mode
		gPointsOnX = 24*7; //24 readings a day - every 1 hour
		
		for (i=0; i<8; i++) {
			date = new Date(d-((i)*86400000));
			gXMarkings[i] = date.toLocaleDateString('default', {weekday: 'short'})+" "+date.getDate()+dateSuffix(date.getDate());
		}
		break;

	case 4: //Month mode
		gPointsOnX = 60; //2 readings a day - every 6 hours

		for (i=0; i<31; i++) {
			date = new Date(d-((i)*86400000));
			if (date.getDate()==1) gXMarkings[i] = date.toLocaleString('default', {month: 'long'})
			else gXMarkings[i] = date.getDate()+dateSuffix(date.getDate());
		}
		break;
	}

	//alert('fully loaded');
	animateGraph();
}

//Sidebar actions

function hoverSB(i) {
	$('.sbN').eq(i).css('opacity', '1');
	if (i!=activeSection) $('#sbS').css('opacity', '0.2');
	for (z=0; z<4; z++) {
		if (i!=z) $('.sbN').eq(z).css('opacity', '0.4');
	}
}

function unhoverSB() {
	$('#sbS').css('opacity', '1');
	for (z=0; z<4; z++) $('.sbN').eq(z).css('opacity', '1');
}

function selectSB(obj, i) {
	unhoverSB();
	//Move the tab indicator
	var a = document.getElementById("sbCont").getBoundingClientRect().top;
	$('#sbS').css("top", obj.getBoundingClientRect().top-a);
	switchSections(i);
}

//Real-time module actions

function animateDirection() {
	//Animate direction arrow spinning to value
	$('#rtDirIndicator').css('transform', 'rotate('+rtDegrees+'deg');
}

//Graph module slider actions

var lastObj;

function moveSlider(obj, updated) {
	var a = document.getElementById("slider").getBoundingClientRect().left;
	$('#sliderS').css("left", obj.getBoundingClientRect().left-a);
	
	if (lastObj!=null) lastObj.classList.remove("sliderNF");
	obj.classList.add("sliderNF");
	lastObj = obj;

	if (obj.innerHTML=="Hour") gViewMode = 1;
	if (obj.innerHTML=="Day") gViewMode = 2;
	if (obj.innerHTML=="Week") gViewMode = 3;
	if (obj.innerHTML=="Month") gViewMode = 4;

	//Get new data and reload graph
	if (!updated) updatePageData();
}

//Graph module actions

function buildGraph() {
	$('#gSVG').empty();
	$('#gSVG').html('<defs><linearGradient id="gradient" x1="0" x2="0" y1="0" y2="1"><stop class="stop1" offset="0%"/><stop class="stop2" offset="100%"/></linearGradient></defs>');

	//SVG dimensions
	var svg = $("#gSVG");
	var w = parseFloat(svg.css("width"));
	var h = parseFloat(svg.css("height"));

	//Dimensions of graph inside svg
	var gBot = h*0.86;
	var gTop = h*0.06;
	var gLeft = w*0.05;
	var gRight = w*0.95;

	//Axis lines
	var path = document.createElementNS(nS, "path");
	var d = "M "+gLeft+" "+gBot+" L "+gLeft+" "+gTop;
	path.setAttribute("d", d);
	path.setAttribute("class", 'gAxisLine');
	svg.append(path);

	path = document.createElementNS(nS, "path");
	d = "M "+gLeft+" "+gBot+" L "+gRight+" "+gBot;
	path.setAttribute("d", d);
	path.setAttribute("class", 'gAxisLine');
	svg.append(path);	

	//X Axis Markings
	var split = (gRight-gLeft)/(gXMarkings.length-1);
	for (i=0; i<gXMarkings.length; i++) {
		var w1 = (split*i)+gLeft;
		//Line
		path = document.createElementNS(nS, "path");
		d = "M "+w1+" "+(gBot-(gLeft*0.1))+" L "+w1+" "+(gBot+(gLeft*0.1));
		path.setAttribute("d", d);
		path.setAttribute("class", 'gMarkingLine');
		svg.append(path);

		//Text
		var t = String(gXMarkings[i]);
		var text = document.createElementNS(nS, "text");
		text.setAttribute("class", 'gMarkingText');
		//X value accounts for length of string
		text.setAttribute("x", w1-((gLeft*0.1)*(t.length/2)));
		text.setAttribute("y", (gBot*1.05));
		text.setAttribute("font-size", (w*0.01));
		text.textContent = t;
		svg.append(text);
	}

	//Y Axis Markings
	var split = (gBot-gTop)/gYMarkings.length;
	for (i=0; i<gYMarkings.length; i++) {
		var h1 = (split*i)+gTop;
		//Line
		path = document.createElementNS(nS, "path");
		d = "M "+(gLeft*0.9)+" "+h1+" L "+(gLeft*1.1)+" "+h1;
		path.setAttribute("d", d);
		path.setAttribute("class", 'gMarkingLine');
		svg.append(path);

		//Text
		var t = String(gYMarkings[(gYMarkings.length-1)-i]);
		var text = document.createElementNS(nS, "text");
		text.setAttribute("class", 'gMarkingText');
		//X value accounts for length of string
		text.setAttribute("x", (gLeft*0.8)-((gLeft*0.1)*t.length));
		text.setAttribute("y", h1+(h*0.01));
		text.setAttribute("font-size", (w*0.01));
		text.textContent = t;
		svg.append(text);
	}

	//Thin lines
	var numThin = gYMarkings.length*2;
	var split = (gBot-gTop)/numThin;
	for (i=1; i<numThin; i++) {
		var h1 = (split*i)+gTop;
		path = document.createElementNS(nS, "path");
		d = "M "+gLeft+" "+h1+" L "+gRight+" "+h1;
		path.setAttribute("d", d);
		path.setAttribute("class", 'gThinLine');
		svg.append(path);
	}

	//Data line
	var ySplit = (gBot-gTop)/(gYTopVal-gYBotVal);
	var xSplit = (gRight-gLeft)/gPointsOnX;

	for (i=0; i<gVisualData.length; i++) {
		//Search forward to find end of block
		var end = i;
		while (end<gVisualData.length) {
			if (gVisualData[end]<=0) break;
			else end++;
		}
		if (end==i||end-i==1) continue;

		//Build path for block
		path = document.createElementNS(nS, "path");
		path.setAttribute("class", 'gDataLine');
		var d = '';
		
		for (z=i; z<end; z++) {
			y1 = (gYTopVal-gVisualData[z])*ySplit+gTop;
			x1 = z*xSplit+gLeft;
			
			if (z==i) d += " M "+x1+" "+y1;
			else d +=" L "+x1+" "+y1;

			var circle = document.createElementNS(nS, "circle");
			circle.setAttribute("class", 'gDataCircle');
			circle.setAttribute("cx", x1);
			circle.setAttribute("cy", y1);
			svg.append(circle);
		}

		path.setAttribute("d", d);
		svg.append(path);
	}



	/*path = document.createElementNS(nS, "path");
	path.setAttribute("class", 'gDataLine');
	d = "";
	for (i=0; i<gVisualData.length; i++) {
		var y1 = (gYTopVal-gVisualData[i])*ySplit+gTop;
		var x1 = i*xSplit+gLeft;
		if (i==0) d += "M "+x1+" "+y1;
		else d += " L "+x1+" "+y1;
	}
	path.setAttribute("d", d);
	svg.append(path);*/

	//Data shape with gradient
	//Need to build for every set of data points as there could be breaks
	for (i=0; i<gVisualData.length; i++) {
		//Search forward to find end of block
		var end = i;
		while (end<gVisualData.length) {
			if (gVisualData[end]<=0) break;
			else end++;
		}
		if (end==i||end-i==1) continue;

		//Build path for block
		path = document.createElementNS(nS, "path");
		path.setAttribute("class", 'gDataGrad');
		var y1 = (gYTopVal-gVisualData[i])*ySplit+gTop;
		var x1 = i*xSplit+gLeft;
		var x2;
		var d = " M "+x1+" "+y1;
		
		for (z=i+1; z<end; z++) {
			var y2 = (gYTopVal-gVisualData[z])*ySplit+gTop;
			x2 = z*xSplit+gLeft;
			d +=" L "+x2+" "+y2;
		}

		//Close path back to start of block
		d +=" L "+x2+" "+gBot+" L "+x1+" "+gBot+" Z";
		path.setAttribute("d", d);
		svg.append(path);
		i = end;
	}

	/*path = document.createElementNS(nS, "path");
	path.setAttribute("class", 'gDataGrad');
	//Complete path by dropping from last datapoint and returning to 0
	d += " L "+((gData.length-1)*xSplit+gLeft)+" "+gBot+" L "+gLeft+" "+gBot+" Z";
	path.setAttribute("d", d);
	svg.append(path);*/

	//alert('fin build');
}

function animateGraph() {
	for (i=0; i<gVisualData.length; i++) {
		gVisualData[i] = gData[i];
	}
	buildGraph();
	return;

	//Reset visual data
	for (i=0; i<gVisualData.length; i++) {
		//gVisualData[i] = gData[i]/4;
		if (gVisualData[i]<0) gVisualData[i] = 0;
	}

	//Animate points on graph sliding up
	let slide = setInterval(function() {
		if (graphSlideFinished()) {
			clearInterval(slide);
		}
		else {
			for (i=0; i<gVisualData.length; i++) {
				if (gVisualData[i]<gData[i]) gVisualData[i]++;
			}
			buildGraph();
		}
	}, 15);
}

function graphSlideFinished() {
	for (i=0; i<gData.length; i++) {
		if (gVisualData[i]<gData[i]) return false;
	}
	return true;
}

//Circle graph module actions

function updateCircleGraph(i) {
	var svg = $('#cSVG'+(i+1));
	var r = parseFloat(svg.css('width'))*0.5;	
	var c = 2*Math.PI*r;
	var v = alarmLevelTimes[i];
	if (v>100) v = 100;

	$('#cSVGC'+(i+1)).css("stroke-dasharray", (v*(c/100))+', '+c);
	$('#cTB'+(i+1)).html(alarmLevelTimes[i]);
	$('#cT'+(i+1)).css("opacity", 1);
}

function animateCircleGraphs() {
	setTimeout(updateCircleGraph, 200, 0);
	setTimeout(updateCircleGraph, 400, 1);
	setTimeout(updateCircleGraph, 600, 2);
}

//General functions

function dateSuffix(i) {
    if (i > 3 && i < 21) return 'th';
    switch (i % 10) {
    case 1:  return "st";
    case 2:  return "nd";
    case 3:  return "rd";
    default: return "th";
    }
}

var redAlarmAniKill = false;
var redAlarmAniOp = 100;
var redAlarmAniDir = -1;

function initiateRedAlarm() {
	//Flash color on windspeed to indicate red alarm level
	redAlarmAniKill = false;
	redAlarmAniOp = 100;
 	redAlarmAniDir = -1;

	if (!alertMessageShown) {
			insertMessage("Warning - Extremely high wind speeds");
			alertMessageShown = true;
	}

	let flash = setInterval(function() {
		if (redAlarmAniKill) clearInterval(flash);
		else {
			if (redAlarmAniOp>=100) redAlarmAniDir = -2;
			if (redAlarmAniOp<=1) redAlarmAniDir = 2;
			
			redAlarmAniOp += redAlarmAniDir;
			$('#rtSpeed').css('background-image', 'linear-gradient(to bottom right, rgb(247, 67, 27, '+(redAlarmAniOp/100)+') 0%, rgb(220, 8, 0, '+(redAlarmAniOp/100)+') 50%)');
		}
	}, 16);
}

function initiateAmberAlarm() {
	if (!alertMessageShown) {
		insertMessage("Caution - Wind speeds are higher than normal");
		alertMessageShown = true;
	}
}