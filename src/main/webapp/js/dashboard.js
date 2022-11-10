class DashboardPage extends Page {

	constructor(contentName) {
		super(contentName);
		
		//Add styles
		var link = document.createElement('link');
		link.setAttribute('rel', 'stylesheet');
		if (isMobile) link.setAttribute('href', '../styles/mobile/dashboard.css');
		else link.setAttribute('href', '../styles/dashboard.css');
		document.head.appendChild(link);

		//Real-time data
		this.mqttClient;
		this.rtWindSpeed;
		this.rtLastUpdateTime;
		this.rtDegrees;
		this.rtAlarmLevel;
		this.alertMessageShown = false; //Whether a high wind speed alert message has been shown
		this.redFlashInterval; //Allows control of red flash animation

		//Graph data
		this.gYTopVal;
		this.gYBotVal;
		this.gPointsOnX;
		this.gXMarkings = [];
		this.gYMarkings = [];
		this.gData = [];
		this.gVisualData = []; //Used for initial graph animation
		this.gViewMode = 1;
		this.alarmLevelTimes = [];

		//Red alarm animation
		this.redAlarmAniKill = false;
		this.redAlarmAniOp = 100;
		this.redAlarmAniDir = -1;

		//Mobile
		this.filterOpen;
	}

	//Required actions

	updatePageData() {
		var self = this;
		responseRecieved = false;

		let promise = new Promise(function (resolve, reject) {
			var req = new XMLHttpRequest(); //Fetch data
			req.open('GET', 'data/?sK='+sessionKey+'&m=1&u='+unit+'&gm='+self.gViewMode+'&t='+Math.random(), true);
			req.onreadystatechange = function() {
				if (checkResponse(req)) {
					self.recieveData(req);
					//setTimeout(resolve, 2000);
					resolve();
				}
			}
			req.send();

			//Initiate loading
			setTimeout(function() {if (!responseRecieved) insertLoading(screen.width/2, screen.height/2, false);}, loadingWait);
		});
		return promise;
	}

	recieveData(req) {
		//Reset graph axis
		this.gYTopVal = 100;
		this.gYBotVal = 0;
		this.gXMarkings = [];
		this.gYMarkings = [20, 40, 60, 80, 100];

		var jArr = JSON.parse(req.responseText);

		//Load real time data
		this.rtWindSpeed = jArr[0].rtWindSpeed;
		this.rtDegrees = jArr[0].rtDegrees;
		this.rtLastUpdateTime = jArr[0].rtLastUpdateTime;
		this.rtAlarmLevel = jArr[0].rtAlarmLevel;

		//Load graph data
		this.gData = jArr[1].gData.slice(1, -1).split(",");
		this.gData.reverse();
		this.gVisualData = [];
		for (i=0; i<this.gData.length; i++) this.gVisualData[i] = 0; //Copy incase no animation is run

		//Load alert level circle data
		this.alarmLevelTimes = [jArr[2].level1, jArr[2].level2, jArr[2].level3];

		this.implementData();

		//Configure for mobile
		if (isMobile) page.mobileConfigure();
	}

	implementData() {
		//Real-time module
		this.updateLiveValues();

		//Graph module
		//Find y axis markings based on graph view mode and current time
		var ms = 1000*60*5; //Num ms in 5 minutes for rounding

		switch (this.gViewMode) {
		case 1: //Hour mode
			this.gPointsOnX = 12; //12 readings an hour - every 5 mins
			var d = Math.floor(Date.now()/ms)*ms+300000; //Round up to nearest 5 mins and add one increment
			
			for (i=0; i<12; i++) {
				var date = new Date(d-((i)*300000));

				if (date.getHours()==0&&date.getMinutes()==0) { //New day so add day format
					this.gXMarkings[i] = date.getDate()+" "+date.toLocaleString('default', {month: 'short'});
				}
				else { //Add hour formula
					var h = date.getHours();
					if (h<10) h = '0'+h;
					var m = date.getMinutes();
					if (m<10) m = '0'+m;
					this.gXMarkings[i] = h+':'+m;
				}
			}
			break;

		case 2: //Day mode
			this.gPointsOnX = 48; //2 readings an hour - every 30 mins
			var d = Date.now()+3600000; //Add one increment

			for (i=0; i<24; i++) {
				var date = new Date(d-((i)*3600000));
				var h = date.getHours();
				if (h==0) { //New day so add day format
					this.gXMarkings[i] = date.getDate()+" "+date.toLocaleString('default', {month: 'short'});
				}
				else { //Add hour formula
					var t = 'am';
					if (h>12) {
						t = 'pm';
						h -= 12;
					}
					if (h==12) t = 'pm';
					if (h==0) h = 12;
					this.gXMarkings[i] = h+t;
				}
			}
			break;

		case 3: //Week mode
			this.gPointsOnX = 168; //24 readings a day - every 1 hour
			//Round date to nearest day
			var date = new Date();
			date.setHours(0);
			date.setMinutes(0);
			date.setSeconds(0);
			date.setMilliseconds(0);
			var d = date.getTime()+3.6e+6; //Add one increment

			for (i=0; i<8; i++) {
				date = new Date(d-((i)*8.64e+7));
				this.gXMarkings[i] = date.toLocaleDateString('default', {weekday: 'short'})+" "+date.getDate()+this.dateSuffix(date.getDate());
			}
			break;

		case 4: //Month mode
			this.gPointsOnX = 60; //2 readings a day - every 6 hours
			//Round date to nearest day
			var date = new Date();
			date.setHours(0);
			date.setMinutes(0);
			date.setSeconds(0);
			date.setMilliseconds(0);
			var d = date.getTime()+4.32e+7; //Add one increment

			for (i=0; i<30; i++) {
				date = new Date(d-((i)*8.64e+7));
				if (date.getDate()==1) this.gXMarkings[i] = date.toLocaleString('default', {month: 'long'})
				else this.gXMarkings[i] = date.getDate()+this.dateSuffix(date.getDate());
			}
			break;
		}

		this.gXMarkings.reverse();
		this.animateGraph().then(result => page.animateCircleGraphs());
		
		//Other listeners to be added on this page load
		$("#gSVG").mouseout(function(event) { 
			if (typeof page.unfocusGraph==="function") page.unfocusGraph();
		});
		$("#gSVG").mousemove(function(event) { 
			if (typeof page.moveOnGraph==="function") page.moveOnGraph(event);
		});

		this.setupLive();
	}

	mobileConfigure() {
		//Swap slider components
		$("#slider").remove();
		addComponent('effCont', 'mobilecomponents/filter.html');
	}

	updateLiveValues() {
		$('#rtSpeed1').html(page.rtWindSpeed); //Set wind speed
		
		//Set wind speed module background color according to alarm level
		clearInterval(this.redFlashInterval);
		switch (page.rtAlarmLevel) {
			case 1: 
				$('#rtSpeed').css('background-image', 'linear-gradient(to bottom right, rgb(100, 199, 100) 0%, rgb(3, 173, 15) 50%)');
				$('#rtSpeedIcon').css('background-image', '');
				break;
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
		var timeDiff = Math.abs(this.rtLastUpdateTime-Date.now());
		var days = Math.floor(timeDiff/8.64e+7);
		var hours = Math.floor(timeDiff/3600000);
		var mins = Math.floor(timeDiff/60000);
		
		if (days>=1) {
			if (days==1) $('#rtSpeed4').html(days+" day ago");
			else $('#rtSpeed4').html(days+" days ago");
		}
		else if (hours>=1) {
			mins = mins-(hours*60);
			var h = " hours ";
			var m = " mins ";
			if (hours==1) h = " hour ";
			if (mins==1) m = " min ";
			if (mins==0) $('#rtSpeed4').html(hours+h+"ago");
			else $('#rtSpeed4').html(hours+h+mins+m+"ago");
		}
		else {
			if (mins==1) $('#rtSpeed4').html(mins+" min ago");
			else $('#rtSpeed4').html(mins+" mins ago");
		}

		//Display degrees
		$('#rtDir2').html(this.rtDegrees+"°");
		$('#rtDir1').html(this.getDegree(this.rtDegrees));

		//Animate
		if (this.rtAlarmLevel==3) this.initiateRedAlarm(); 
		if (this.rtAlarmLevel==2) this.initiateAmberAlarm();
		page.animateDirection();
	}

	//Set up MQTT client and subscribe to live readings
	setupLive() {
		var clientID = "WebSocketClient"+Math.random().toString().replace('.', '');
		page.mqttClient = new Paho.Client('54.203.107.18', 9876, clientID);
		page.mqttClient.connect({
			onSuccess:function() {
				page.mqttClient.subscribe('LiveReadings');
				console.log("MQTT Client Connected - (Topic) LiveReadings");
			}
		});
		page.mqttClient.onMessageArrived = function(message) {
			var mUnit = message.payloadString.split("|")[0];
			if (mUnit.trim()!=unit.trim()) return; //Check mqtt message is for currently viewed unit

			var data = message.payloadString.split("|")[1].split(",");
			page.rtWindSpeed = parseInt(data[0]);
			page.rtDegrees = parseInt(data[1]);
			page.rtAlarmLevel = 1;
			if (page.rtWindSpeed>=50) page.rtAlarmLevel = 2;
			if (page.rtWindSpeed>=80) page.rtAlarmLevel = 3;
			console.log("[MQTT Message] Unit: "+mUnit+" Speed: "+page.rtWindSpeed+" Direction: "+page.rtDegrees+" Level: "+page.rtAlarmLevel);

			//page.rtAlarmLevel = parseInt(data[2]);
			page.rtLastUpdateTime = Date.now();

			if (typeof page.updateLiveValues==="function") page.updateLiveValues();
		}
		page.mqttClient.onConnectionLost = page.onConnectionLost;
	}

	onConnectionLost(responseObject) {
    	if (responseObject.errorCode !== 0) {
        	console.log("onConnectionLost:" + responseObject.errorMessage);
    	}
 	}

	animateEntrance(start) {
		this.moveSlider(document.getElementsByClassName('sliderN')[0], true);
		setTimeout(removeLoading, start);
		setTimeout(fadeIn, start, $("#rtSpeed"));
		setTimeout(fadeIn, start+50, $("#rtDir"));
		setTimeout(fadeIn, start+100, $("#cCont"));
		setTimeout(fadeIn, start+150, $("#graph"));
		setTimeout(fadeIn, start+200, $("#slider"));
	}

	onExit() {
		clearInterval(page.redFlashInterval);
      	//page.mqttClient.disconnect();
	}

	//Real-time module actions

	animateDirection() { //Animate direction arrow spinning to value
		$('#rtDirIndicator').css('transform', 'rotate('+this.rtDegrees+'deg');
	}

	//Graph module slider and filter actions

	toggleFilter() {
		if (!page.filterOpen) {
			$("#filterContent").css("display", "block");
			//Lazy initialise filter checkboxes if first time open
			//CB initialisation must be done once bounding div is display:block as some browsers don't give width of unrendered block
			if (page.filterOpen==undefined) {
				var color = "rgb(180, 180, 180)";

				//View mode checkboxes
				page.vmCB = new DependantCheckBoxes();
				for (var i=1; i<5; i++) {
					page.vmCB.add(new CheckBox(i, "fCB"+i, color, true, "Hour"));
				}
				page.vmCB.get(0).toggleCheckBox();

				page.cb5 = new CheckBox(5, "fCB5", color, true);
				page.cb6 = new CheckBox(6, "fCB6", color, true);
				page.cb7 = new CheckBox(7, "fCB7", color, true);
				page.cb8 = new CheckBox(8, "fCB8", color, true);
			}

			$("#filter").removeClass("filterHome");
			$("#filter").addClass("filterExp");
			$("#filterHeader").addClass("filterHeaderExp");
			$("#filterArrow").addClass("filterArrowExp");
			$("#filterLabel").addClass("filterLabelExp");
			//blurComponents();
			addBlocker(page.toggleFilter);
			page.filterOpen = true;
		}
		else {
			//Update graph with chosen values
			var vm = page.vmCB.getChecked();
			page.gViewMode = vm.id;
			page.updatePageData();
			page.addFilterElement(vm.name);

			$("#filter").removeClass("filterExp");
			$("#filter").addClass("filterHome");
			$("#filterHeader").removeClass("filterHeaderExp");
			$("#filterArrow").removeClass("filterArrowExp");
			$("#filterLabel").removeClass("filterLabelExp");
			$("#filterContent").css("display", "none");
			//unblurComponents();
			removeBlocker();
			page.filterOpen = false;
		}
	}

	addFilterElement(name) {
		var e = document.createElement("div");
		e.className = "filterElem";
		var l = document.createElement("div");
		l.className = "filterElemLabel";
		l.innerHTML = name;
		e.append(l);
		$('#filterElemRowInner').append(e);
	}

	lastObj;

	moveSlider(obj, updated) {
		if (isMobile) return;

		var a = document.getElementById("slider").getBoundingClientRect().left;
		$('#sliderS').css("left", obj.getBoundingClientRect().left-a);
		
		if (this.lastObj!=null) this.lastObj.classList.remove("sliderNF");
		obj.classList.add("sliderNF");
		this.lastObj = obj;

		if (obj.innerHTML=="Hour") this.gViewMode = 1;
		if (obj.innerHTML=="Day") this.gViewMode = 2;
		if (obj.innerHTML=="Week") this.gViewMode = 3;
		if (obj.innerHTML=="Month") this.gViewMode = 4;

		//Get new data and reload graph and circle graphs
		if (!updated) this.updatePageData();
	}

	//Graph module actions

	buildGraph() {
		var svg = $("#gSVG");
		svg.empty();
		svg.html('<defs><linearGradient id="gradient" x1="0" x2="0" y1="0" y2="1"><stop class="stop1" offset="0%"/><stop class="stop2" offset="100%"/></linearGradient></defs>');

		//SVG dimensions
		var w = parseFloat(svg.css("width"));
		var h = parseFloat(svg.css("height"));

		//Dimensions of graph inside svg
		var gBot = h*0.86;
		var gTop = h*0.06;
		var gLeft = w*0.05;
		var gRight = w*0.95;
		if (isMobile) {
			gLeft = 0;
			gRight = w;
		}

		//Axis lines
		if (!isMobile) {
			var path = document.createElementNS(nS, "path");
			var d = "M "+gLeft+" "+gBot+" L "+gLeft+" "+gTop;
			path.setAttribute("d", d);
			path.setAttribute("class", 'gAxisLine');
			svg.append(path);
		}

		path = document.createElementNS(nS, "path");
		d = "M "+gLeft+" "+gBot+" L "+gRight+" "+gBot;
		path.setAttribute("d", d);
		path.setAttribute("class", 'gAxisLine');
		svg.append(path);	

		//X Axis Markings
		var split = (gRight-gLeft)/this.gXMarkings.length;
		for (i=0; i<this.gXMarkings.length; i++) {
			var w1 = (split*i)+gLeft;
			//Line
			path = document.createElementNS(nS, "path");
			d = "M "+w1+" "+(gBot-(gLeft*0.1))+" L "+w1+" "+(gBot+(gLeft*0.1));
			path.setAttribute("d", d);
			path.setAttribute("class", 'gMarkingLine');
			svg.append(path);

			//Text
			var t = String(this.gXMarkings[i]);
			var text = document.createElementNS(nS, "text");
			text.setAttribute("class", 'gMarkingText');
			//X value accounts for length of string
			text.setAttribute("x", w1-((gLeft*0.1)*(t.length/2)));
			text.setAttribute("y", (gBot*1.05));
			text.setAttribute("font-size", (w*0.01));
			
			if (isMobile) {
				text.setAttribute("x", w1-((gLeft*0.1)*(t.length/2)));
				text.setAttribute("font-size", (w*0.02));
			}
			text.textContent = t;
			svg.append(text);
		}

		//Y Axis Markings
		var split = (gBot-gTop)/this.gYMarkings.length;
		for (i=0; i<this.gYMarkings.length; i++) {
			var h1 = (split*i)+gTop;
			//Line
			path = document.createElementNS(nS, "path");
			d = "M "+(gLeft*0.9)+" "+h1+" L "+(gLeft*1.1)+" "+h1;
			path.setAttribute("d", d);
			path.setAttribute("class", 'gMarkingLine');
			svg.append(path);
			
			//Text
			var t = String(this.gYMarkings[(this.gYMarkings.length-1)-i]);
			var text = document.createElementNS(nS, "text");
			text.setAttribute("class", 'gMarkingText');
			//X value accounts for length of string
			text.setAttribute("x", (gLeft*0.8)-((gLeft*0.1)*t.length));
			text.setAttribute("y", h1+(h*0.01));
			text.setAttribute("font-size", (w*0.01));

			if (isMobile) {
				text.setAttribute("x", (gLeft*0.5)-((gLeft*0.22)*t.length));
				text.setAttribute("font-size", (w*0.025));
				if (i==0) continue; //Dont show '100' marking
			}
			text.textContent = t;
			svg.append(text);
		}

		//Thin lines
		var numThin = this.gYMarkings.length*2;
		var split = (gBot-gTop)/numThin;
		for (i=1; i<numThin; i++) {
			var h1 = (split*i)+gTop;
			path = document.createElementNS(nS, "path");
			d = "M "+gLeft+" "+h1+" L "+gRight+" "+h1;
			path.setAttribute("d", d);
			path.setAttribute("class", 'gThinLine');
			svg.append(path);
		}

		//Data line and gradient
		var ySplit = (gBot-gTop)/(this.gYTopVal-this.gYBotVal);
		var xSplit = (gRight-gLeft)/this.gPointsOnX;
		var d = null;
		var xStart = null;

		var i = 0;
		while (i<this.gVisualData.length) {
			if (this.gVisualData[i]==0) {i++; continue;}

			//Search forward to find next non-zero data point
			var end = true;
			var next;
			for (var z=i+1; z<this.gVisualData.length; z++) {
				if (this.gVisualData[z]>0) {
					end = false;
					next = z;
					break;
				}
			}

			//Add data point to path
			var y = (this.gYTopVal-this.gVisualData[i])*ySplit+gTop;
			var x = i*xSplit+gLeft;
			if (d==null) {
				d = "M"+x+" "+y;
				xStart = x;
			}
			
			/*Bezier curve split into 4 quadrants. Curve to
			half way between d and d+1, with control point at
			quater of way, then terminate at d+1, other control
			point will be infered.*/
			if (!end&&i<this.gVisualData.length) {
				var y1 = (this.gYTopVal-this.gVisualData[next])*ySplit+gTop;
				var x1 = next*xSplit+gLeft;
				var midY;
				if (y1>y) midY = y1-(y1-y)/2;
				else midY = y-(y-y1)/2;

				d += " Q"+(x+(x1-x)/4)+","+y;
				d += " "+(x+(x1-x)/2)+","+midY;
				d += " T"+x1+","+y1;
			}

			//Add circle
			var circle = document.createElementNS(nS, "circle");
			circle.setAttribute("class", 'gDataCircle');
			circle.setAttribute("cx", x);
			circle.setAttribute("cy", y);
			svg.append(circle);

			i = next;
			if (end) break;
		}

		if (xStart!=null) { //Add elements to svg
			//Data line
			path = document.createElementNS(nS, "path");
			path.setAttribute("class", 'gDataLine');
			path.setAttribute("d", d);
			svg.append(path);

			//Close gradient path back to start of path
			d +=" L "+(i*xSplit+gLeft)+" "+gBot+" L "+xStart+" "+gBot+" Z";
			//Gradient
			path = document.createElementNS(nS, "path");
			path.setAttribute("class", 'gDataGrad');
			path.setAttribute("d", d);
			svg.append(path);
		}

		//Make focus stuff
		var focusC = document.createElementNS(nS, "circle");
		focusC.setAttribute("id", "gFocusCircle");
		svg.append(focusC);

		var focusT = document.createElementNS(nS, "text");
		focusT.setAttribute("id", "gFocusText");
		svg.append(focusT);

		var focusP = document.createElementNS(nS, "path");
		focusP.setAttribute("id", 'gFocusLine');
		svg.append(focusP);
	}

	animateGraph() {
		//Reset visual data
		for (i=0; i<this.gVisualData.length; i++) {
			this.gVisualData[i] = this.gData[i]*0.8;
			if (this.gVisualData[i]<0) this.gVisualData[i] = 0;
		}

		var self = this;
		let promise = new Promise(function (resolve, reject) {
			//Animate points on graph sliding up
			let slide = setInterval(function() {
				if (self.graphSlideFinished()) {
					clearInterval(slide);
					self.buildGraph();
					resolve();
				}
				else {
					for (i=0; i<self.gVisualData.length; i++) {
						if (self.gVisualData[i]<self.gData[i]) self.gVisualData[i]++;
					}
					self.buildGraph();
				}
			}, 8);
		});
		return promise;
	}

	unfocusGraph() {
		$("#gFocusCircle").css("display", "none");
		$("#gFocusText").css("display", "none");
		$("#gFocusLine").css("display", "none");
	}

	moveOnGraph(event) {
		/*Goal is to get the exact point on the
		double bezier curve to place the focus circle*/

		//SVG dimensions
		var svg = $("#gSVG");
		var w = parseFloat(svg.css("width"));
		var h = parseFloat(svg.css("height"));

		//Dimensions of graph inside svg
		var gBot = h*0.86;
		var gTop = h*0.06;
		var gLeft = w*0.05;
		var gRight = w*0.95;
		var ySplit = (gBot-gTop)/(this.gYTopVal-this.gYBotVal);
		var xSplit = (gRight-gLeft)/this.gPointsOnX;

		//Get relative x of mouse and closest data points
		var mX = event.pageX-svg.offset().left-gLeft; //Mouse x
		var i = Math.floor(mX/xSplit); //Index in graph data
		if (i<0||i+1>=this.gVisualData.length||this.gVisualData[i]==0) {
			this.unfocusGraph();
			return;
		}

		//Find points in real space
		var p1x = i*xSplit+gLeft;
		var p1y = (this.gYTopVal-this.gVisualData[i])*ySplit+gTop;
		var p2x = (i+1)*xSplit+gLeft;
		var p2y = (this.gYTopVal-this.gVisualData[i+1])*ySplit+gTop;
		var ix = p1x+(p2x-p1x)/2;  //Intermediate point
		var iy = p1y+(p2y-p1y)/2;

		mX += gLeft; //Add back so is absolute point again
		var mY;
		var a;
		//Get point on bezier line
		if (mX>ix) {
			 //Use up curving quadratic
			a = (iy-p2y)/Math.pow((ix-p2x), 2);
			mY = a*Math.pow(mX-p2x, 2)+p2y;
		}
		else {
			//Use down curving quadratic
			a = (iy-p1y)/Math.pow((ix-p1x), 2);
			mY = a*Math.pow(mX-p1x, 2)+p1y;
		}

		//Update
		$("#gFocusCircle").attr("cx", mX);
		$("#gFocusCircle").attr("cy", mY);

		var t = Math.floor(this.gVisualData[i])+" km/h";
		$("#gFocusText").attr("x", mX-(w*0.009)*(t.length/2));
		$("#gFocusText").attr("y", mY-(h*0.03));
		$("#gFocusText").html(t);

		var d = "M "+mX+" "+gBot+" L "+mX+" "+gTop;
		$("#gFocusLine").attr("d", d);

		$("#gFocusCircle").css("display", "block");
		$("#gFocusText").css("display", "block");
		$("#gFocusLine").css("display", "block");
	}

	graphSlideFinished() {
		for (i=0; i<this.gData.length; i++) {
			if (this.gVisualData[i]<this.gData[i]) return false;
		}
		return true;
	}

	//Circle graph module actions

	updateCircleGraph(i) {
		var svg = $('#cSVG'+(i+1));
		var r = parseFloat(svg.css('width'))*0.5;	
		var c = 2*Math.PI*(r+10);
		var v = this.alarmLevelTimes[i];
		//Average off total
		v = v/(this.alarmLevelTimes[0]+this.alarmLevelTimes[1]+this.alarmLevelTimes[2]);
		v *= 100;

		//Fudge a zero value to avoid weird looking circle
		if (v==0) $('#cSVGC'+(i+1)).css("stroke-dasharray", '0, 100000');
		else $('#cSVGC'+(i+1)).css("stroke-dasharray", (v*(c/100))+', '+c);

		//Update smaller text with units
		var s = "mins";
		v = this.alarmLevelTimes[i];
		if (v>60) {
			v = Math.floor(v/60);
			if (v==1) s = "hour";
			else s = "hours";
			if (v>=24) {
				v = Math.floor(v/24);
				if (v==1) s = "day";
				else s = "days";
			}
		}

		//Update text
		$('#cTB'+(i+1)).html(v);
		if (v.toString().length==1) $('#cTB'+(i+1)).css("padding-left", "33%");
		else $('#cTB'+(i+1)).css("padding-left", "27%");
		$('#cTM'+(i+1)).html(s);
		$('#cT'+(i+1)).css("opacity", 1);
	}

	resetCircleGraphs() {
		for (var i=1; i<=3; i++) $('#cSVGC'+i).css("stroke-dasharray", '0, 100000');
	}

	animateCircleGraphs() {
		this.resetCircleGraphs();
		this.updateCircleGraph(0);
		setTimeout(() => {this.updateCircleGraph(1)}, 200);
		setTimeout(() => {this.updateCircleGraph(2)}, 400);
	}

	//General functions

	getDegree(degree) {
		var d = "";
		if (degree<45) d = "N";
		if (degree>=45) d = "NE"; 
		if (degree>=90) d = "E"; 
		if (degree>=135) d = "SE"; 
		if (degree>=180) d = "S"; 
		if (degree>=225) d = "SW"; 
		if (degree>=270) d = "W"; 
		if (degree>=315) d = "NW";
		return d; 
	}

	dateSuffix(i) {
	    if (i > 3 && i < 21) return 'th';
	    switch (i % 10) {
	    case 1:  return "st";
	    case 2:  return "nd";
	    case 3:  return "rd";
	    default: return "th";
	    }
	}

	initiateRedAlarm() {
		//Flash color on windspeed to indicate red alarm level
		this.redAlarmAniOp = 100;
	 	this.redAlarmAniDir = -1;

		if (!this.alertMessageShown) {
			insertMessage("Warning - Extremely high wind speeds", 0, 1);
			this.alertMessageShown = true;
		}

		var self = this;
		this.redFlashInterval = setInterval(function() {
			if (self.redAlarmAniOp>=100) self.redAlarmAniDir = -2;
			if (self.redAlarmAniOp<=1) self.redAlarmAniDir = 2;
			
			self.redAlarmAniOp += self.redAlarmAniDir;
			$('#rtSpeed').css('background-image', 'linear-gradient(to bottom right, rgb(247, 67, 27, '+(self.redAlarmAniOp/100)+') 0%, rgb(220, 8, 0, '+(self.redAlarmAniOp/100)+') 50%)');
		
		}, 16);
	}

	initiateAmberAlarm() {
		if (!this.alertMessageShown) {
			insertMessage("Caution - Wind speeds are higher than normal", 0, 0);
			this.alertMessageShown = true;
		}
	}
}


/*for (i=0; i<this.gVisualData.length; i++) {
			//Search forward to find end of block
			var end = i;
			while (end<this.gVisualData.length) {
				if (this.gVisualData[end]<=0) break;
				else end++;
			}
			if (end==i||end-i==1) continue;

			//Build path for block
			path = document.createElementNS(nS, "path");
			path.setAttribute("class", 'gDataLine');
			var d = '';
			
			for (var z=i; z<end; z++) {
				y1 = (this.gYTopVal-this.gVisualData[z])*ySplit+gTop;
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

		//Data shape with gradient
		//Need to build for every set of data points as there could be breaks
		for (i=0; i<this.gVisualData.length; i++) {
			//Search forward to find end of block
			var end = i;
			while (end<this.gVisualData.length) {
				if (this.gVisualData[end]<=0) break;
				else end++;
			}
			if (end==i||end-i==1) continue;

			//Build path for block
			path = document.createElementNS(nS, "path");
			path.setAttribute("class", 'gDataGrad');
			var y1 = (this.gYTopVal-this.gVisualData[i])*ySplit+gTop;
			var x1 = i*xSplit+gLeft;
			var x2;
			var d = " M "+x1+" "+y1;
			
			for (z=i+1; z<end; z++) {
				var y2 = (this.gYTopVal-this.gVisualData[z])*ySplit+gTop;
				x2 = z*xSplit+gLeft;
				d +=" L "+x2+" "+y2;
			}

			//Close path back to start of block
			d +=" L "+x2+" "+gBot+" L "+x1+" "+gBot+" Z";
			path.setAttribute("d", d);
			svg.append(path);
			i = end;
		}*/