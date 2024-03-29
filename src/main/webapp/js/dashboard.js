class DashboardPage extends Page {

	constructor() {
		super("Dashboard", "dashboard");
		
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
		this.gData1 = []; //Hour data
		this.gData2 = []; //Day data
		this.gData3 = []; //Week data
		this.gData4 = []; //Month data
		this.gData; //Current data structure
		this.gVisualData; //Used to allow graph animation

		this.gYTopVal;
		this.gYBotVal;
		this.gPointsOnX;
		this.gYMarkings = [];
		this.gViewMode = 1;
		this.graphModes = ["Hour", "Day", "Week", "Month"];
		this.gXWindowStart; //Time at left edge of graph
		this.gXWindowEnd; //Time at right edge of graph
		this.gXAxisGran = 5; //X axis granularity
		this.gYAxisGran = 20; //Y axis granularity
		this.gXAxisGranModes = [1, 5, 10, 60, 360, 1440]; //Possible granularity modes in minutes
		this.gXAxisSpread; //Space between X axis nodes

		//Graph extra options
		this.gAlertLines = false;
		
		//Alert circles
		this.alarmLevelTimes = [];

		//Red alarm animation
		this.redAlarmAniKill = false;
		this.redAlarmAniOp = 100;
		this.redAlarmAniDir = -1;

		//Mobile
		this.filterOpen;
		this.caroselLoaded = false;
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
		this.gYMarkings = [20, 40, 60, 80, 100];

		var jArr = JSON.parse(req.responseText);

		//Load real time data
		this.rtWindSpeed = jArr[0].rtWindSpeed;
		this.rtDegrees = jArr[0].rtDegrees;
		this.rtLastUpdateTime = jArr[0].rtLastUpdateTime;
		this.rtAlarmLevel = jArr[0].rtAlarmLevel;

		//Load all 4 types of graph data into respective structures
		this.loadIncomingGraphData(1, jArr[1].gData1);
		this.loadIncomingGraphData(2, jArr[1].gData2);
		this.loadIncomingGraphData(3, jArr[1].gData3);
		this.loadIncomingGraphData(4, jArr[1].gData4);
		this.gData = this.gData1;

		//Load alert level circle data
		this.alarmLevelTimes = [jArr[2].l1, jArr[2].l2, jArr[2].l3];

		//Configure for mobile
		if (isMobile) page.mobileConfigure();
		else page.desktopConfigure();

		this.implementData();
	}

	loadIncomingGraphData(i, data) {
		var dataFin;
		switch (i) {
			case 1: dataFin = this.gData1; break;
			case 2: dataFin = this.gData2; break;
			case 3: dataFin = this.gData3; break;
			case 4: dataFin = this.gData4; break;
		}
		
		//Split on / to get heighest log values first
		var tmpStruct = data.split("/");
		if (tmpStruct[0]=="[]") dataFin = [];
		else {
			var tmpData = tmpStruct[0].slice(1, -1).split(",");
			for (var i=0; i<tmpData.length; i++) {
				var tmpLog = tmpData[i].slice(1, -1).split("_");
				dataFin[i] = tmpLog;
			}
			dataFin.reverse();
		}
	}

	formatVisualData() {
		if (this.gData.length==0) {
			this.gVisualData = [];
		}
		else {
			//Clone current data for visual data structure
			this.gVisualData = [];
			for (i=0; i<this.gData.length; i++) {
				var tmpLog = [];
				tmpLog[0] = this.gData[i][0];
				tmpLog[1] = 0;
				this.gVisualData[i] = tmpLog;
			}
		}
	}

	implementData() {
		//Real-time module
		this.updateLiveValues();

		//Graph module
		if (this.gViewMode==1) this.gData = this.gData1;
		if (this.gViewMode==2) this.gData = this.gData2;
		if (this.gViewMode==3) this.gData = this.gData3;
		if (this.gViewMode==4) this.gData = this.gData4;
		this.calibrateAxis();
		this.animateGraph().then(result => page.animateCircleGraphs());
		
		//Setup listeners
		$("#gSVG").mouseout(function(event) { 
			if (typeof page.unfocusGraph==="function") page.unfocusGraph();
		});
		$("#gSVG").mousemove(function(event) { 
			if (typeof page.moveOnGraph==="function") page.moveOnGraph(event);
		});
		document.getElementById('gSVG').addEventListener('mousewheel', (event) => {
			page.scrollOnGraph(event.deltaY, event.deltaX, event.pageX);
		});

		var hammertime = new Hammer(document.getElementById('gSVG'));
		hammertime.on('pinch', function(ev) {
			var scale = ev.scale;
			if (scale<1) scale = (1-scale)*4;
			else scale = -(scale-1);
			page.scrollOnGraph(scale*80, 0, ev.center.x);
		});
		hammertime.on('pan', function(ev) {
			page.scrollOnGraph(0, -ev.deltaX*0.2, 0);
		});
		hammertime.get('pinch').set({ enable: true });

		this.setupLive();
	}

	calibrateAxis() {
		//Calibrate X Axis
		switch (this.gViewMode) {
		case 1: //Hour mode
			this.gXWindowStart = new Date(Date.now()-(12*minsToMs(5)));
			this.gXWindowEnd = new Date(Date.now());
			this.gXAxisSpread = (parseFloat($("#gSVG").css("width"))*0.9)/12; //1 reading every 5 mins for an hour
			this.gXAxisGran = 5;
			break;

		case 2: //Day mode
			this.gXWindowStart = new Date(Date.now()-(24*minsToMs(60)));
			this.gXWindowEnd = new Date(Date.now());
			this.gXAxisSpread = (parseFloat($("#gSVG").css("width"))*0.9)/24; //1 reading every hour
			this.gXAxisGran = 60;
			break;

		case 3: //Week mode
			this.gXWindowStart = new Date(Date.now()-minsToMs(10080));
			this.gXWindowEnd = new Date(Date.now());
			this.gXAxisSpread = (parseFloat($("#gSVG").css("width"))*0.9)/7; //2 XAxis nodes a day
			this.gXAxisGran = 1440;
			break;

		case 4: //Month mode
			this.gXWindowStart = new Date(Date.now()-minsToMs(43800));
			this.gXWindowEnd = new Date(Date.now());
			this.gXAxisSpread = (parseFloat($("#gSVG").css("width"))*0.9)/30; //1 XAxis node a day
			this.gXAxisGran = 1440;
			break;
		}

		//Calibrate Y Axis
		if (this.gYTopVal>=80) this.gYAxisGran = 20;
		if (this.gYTopVal<80) this.gYAxisGran = 10;
		if (this.gYTopVal<=50) this.gYAxisGran = 5;
		if (this.gYTopVal<=10) this.gYAxisGran = 1;
	}

	mobileConfigure() {
		//Swap slider components
		$("#slider").remove();
		addComponent($('body'), 'mobilecomponents/filter.html');
		
		//Build carosel
		if (!this.caroselLoaded) {
			var c = new Carosel(0.9, $('#rtCaroselDotCont'));
			c.add(document.getElementById('rtSpeed'));
			c.add(document.getElementById('rtDir'));
			c.add(document.getElementById('rtGusts'));
			c.add(document.getElementById('rtCircles'));
			this.caroselLoaded = true;
		}
	}

	desktopConfigure() {
		$('#filterElemRow').remove();
		$('#filterElemGrad').remove();
		$('#filterIcon').remove();
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
        	console.log("MQTT Connection Lost:" + responseObject.errorMessage);
    	}
 	}

	animateEntrance(start) {
		this.moveSlider(document.getElementsByClassName('sliderN')[0], true);
		setTimeout(removeLoading, start);
		setTimeout(fadeIn, start, $("#rtSpeed"));
		setTimeout(fadeIn, start+50, $("#rtDir"));
		setTimeout(fadeIn, start+50, $("#rtGusts"));
		setTimeout(fadeIn, start+50, $("#rtCircles"));
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
			$("#filter").css("display", "block");

			//Lazy initialise filter checkboxes if first time open
			//CB initialisation must be done once bounding div is display:block as some browsers don't give width of unrendered block
			if (page.filterOpen==undefined) {
				var color = "rgb(180, 180, 180)";

				//View mode checkboxes
				page.vmCB = new DependantCheckBoxes(); //View mode checkboxes
				for (var i=1; i<5; i++) {
					page.vmCB.add(new CheckBox(i, "fCB"+i, color, true, page.graphModes[i-1]));
				}
				page.vmCB.get(0).toggleCheckBox();

				page.voCB = Array(3); //View options checkboxes
				page.voCB[0] = new CheckBox(5, "fCB5", color, true, "Alert lines");
				page.voCB[1] = new CheckBox(6, "fCB6", color, true, "Min speeds");
				page.voCB[2] = new CheckBox(7, "fCB7", color, true, "Gust speeds");
			}

			//Open filter
			setTimeout(function() {
				$("#filter").css("opacity", "1");
			}, 1);
			blurComponents();
			addBlocker(page.toggleFilter);
			page.filterOpen = true;
		}
		else {
			page.applyFilter();

			//Close filter
			$("#filter").css("opacity", "0");
			setTimeout(function() {
				$("#filter").css("display", "none");
			}, 300);
			unblurComponents();
			removeBlocker();
			page.filterOpen = false;
		}
	}

	addFilterElement(name) {
		var e = document.createElement("div");
		e.className = "filterElem";
		e.id = "filterElem"+name;
		e.onclick = function() {
			e.remove();
			page.applyFilter();
		};
		var l = document.createElement("div");
		l.className = "filterElemLabel";
		l.innerHTML = name;
		e.append(l);
		var c = document.createElement("div");
		c.className = "filterElemCross";
		e.append(c);
		$('#filterElemRow').append(e);
	}

	applyFilter() {
		//Reset
		$('#filterElemRow').empty();
		page.gAlertLines = false;

		//Selected view mode
		var vm = page.vmCB.getChecked();
		page.gViewMode = vm.id;
		page.addFilterElement(vm.name);
		
		//View options
		$('#filterElemRow').empty();
		page.addFilterElement(vm.name);
		for (var i in page.voCB) {
			if (page.voCB[i].isChecked) {
				var name = page.voCB[i].name;
				page.addFilterElement(page.voCB[i].name);
				if (name=="Alert lines") page.gAlertLines = true;
			}
		}

		//Update graph
		page.implementData();
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
		//if (!updated) this.updatePageData();
		this.implementData();
	}

	//Graph module actions

	scrollOnGraph(scale, swipe, x) {
		//Get mouse point relative to graph 
		var svg = $("#gSVG");
		var mX = x-svg.offset().left-parseFloat(svg.css("width"))*0.05; //Mouse x

		//Find time relative to mouse location on graph
		var axisDiff = mX/this.gXAxisSpread;
		var mTime = this.gXWindowStart.getTime()+(axisDiff*minsToMs(this.gXAxisGran));

		/*
		Update spread and if over a bound then shift granularity
		up or down. If granularity change fails then stop at bound.
		*/
		this.gXAxisSpread += -(scale/8);
		if (this.gXAxisSpread<100) {
			if (!this.changeGranularity(1)) this.gXAxisSpread = 100;
		}
		if (this.gXAxisSpread>300) {
			if (!this.changeGranularity(-1)) this.gXAxisSpread = 300;
		}

		/*
		Time at mouse pointer must stay the same (so graph expands out
		from mouse pointer), so re-calculate gXWindowStart and gXWindowEnd
		by extraploating to extremes with new spread from mouse pointer
		time.
		 */
		this.gXWindowStart = new Date(mTime-((mX/this.gXAxisSpread)*minsToMs(this.gXAxisGran)));
		this.gXWindowEnd = new Date(mTime+(((parseFloat(svg.css("width"))*0.9-mX)/this.gXAxisSpread)*minsToMs(this.gXAxisGran)));


		//Handle deal x scroll only if no y scroll
		if (scale==0&&swipe!=0) {
			var xChange = swipe*(minsToMs(this.gXAxisGran)/100);
			this.gXWindowStart = new Date(this.gXWindowStart.getTime()+xChange);
			this.gXWindowEnd = new Date(this.gXWindowEnd.getTime()+xChange);
		}
		page.buildGraph();
	}

	changeGranularity(dir) {
		//Get current granularity index
		var index;
		for (var i=0; i<this.gXAxisGranModes.length; i++) {
			if (this.gXAxisGran==this.gXAxisGranModes[i]) index = i;
		}

		if (dir==1) { //Change gran up
			if (index>=this.gXAxisGranModes.length-1) return false;
			var newGran = this.gXAxisGranModes[index+1];
			//Spread needs to change up (eg if moving from 1 to 5 then spread needs to be x5 what it was before)
			this.gXAxisSpread = this.gXAxisSpread*(newGran/this.gXAxisGran);
			this.gXAxisGran = newGran;

		}
		if (dir==-1) { //Change gran down
			if (index<=0) return false;
			var newGran = this.gXAxisGranModes[index-1];
			//Spread needs to change down (eg if moving from 5 to 1 then spread needs to be 1/5 what it was before)
			this.gXAxisSpread = this.gXAxisSpread/(this.gXAxisGran/newGran);
			this.gXAxisGran = newGran;
		}
		return true;
	}

	timeToX(time) {
		//Find how many gran units there are in diff between graph start time and given time
		var spaceDiff = (time-this.gXWindowStart.getTime())/minsToMs(this.gXAxisGran);
		return spaceDiff*this.gXAxisSpread; //X pos is that number of gran units * space of one gran unit
	}

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
		var granMS = minsToMs(this.gXAxisGran); //Round to nearest granularity unit from window start
		var t = Math.floor(this.gXWindowStart.getTime()/granMS)*granMS;

		//Find use the diff between this gran and start time to calculate starting offset
		var offX = ((t-this.gXWindowStart.getTime())/granMS)*this.gXAxisSpread;
		var i = 0;

		//Add all graph labels by counting up till window end
		while (t<this.gXWindowEnd.getTime()) {
			var label = this.formatTime(t);
			var x1 = offX+(this.gXAxisSpread*i);

			if (offX+(this.gXAxisSpread*i)>=0) { //Stops axis labels moving past left of graph
				x1 += gLeft;
				path = document.createElementNS(nS, "path");
				d = "M "+x1+" "+(gBot-(gLeft*0.1))+" L "+x1+" "+(gBot+(gLeft*0.1));
				if (isMobile) d = "M "+x1+" "+(gBot-(gRight*0.01))+" L "+x1+" "+(gBot+(gRight*0.01));
				path.setAttribute("d", d);
				path.setAttribute("class", 'gMarkingLine');
				svg.append(path);

				//Text
				var text = document.createElementNS(nS, "text");
				text.setAttribute("class", 'gMarkingText');
				//X value accounts for length of string
				text.setAttribute("x", x1-((gLeft*0.1)*(label.length/2)));
				text.setAttribute("y", (gBot*1.05));
				text.setAttribute("font-size", (w*0.01));
				if (isMobile) {
					text.setAttribute("x", x1-(label.length/0.5));
					text.setAttribute("font-size", (w*0.025));
				}
				text.textContent = label;
				svg.append(text);
			}

			t+=granMS;
			i++;
		}

		//Y Axis Markings
		var split = (gBot-gTop)/(this.gYTopVal/this.gYAxisGran);
		var i = 0;
		while (i<(this.gYTopVal/this.gYAxisGran)) {
			var y1 = (split*i)+gTop;

			//Line
			path = document.createElementNS(nS, "path");
			d = "M "+(gLeft*0.9)+" "+y1+" L "+(gLeft*1.1)+" "+y1;
			path.setAttribute("d", d);
			path.setAttribute("class", 'gMarkingLine');
			svg.append(path);
			
			//Text
			var t = String(this.gYTopVal-i*this.gYAxisGran);
			var text = document.createElementNS(nS, "text");
			text.setAttribute("class", 'gMarkingText');
			//X value accounts for length of string
			text.setAttribute("x", (gLeft*0.8)-((gLeft*0.1)*t.length));
			text.setAttribute("y", y1+(h*0.01));
			text.setAttribute("font-size", (w*0.01));

			if (isMobile) {
				text.setAttribute("x", (gLeft*0.5)-((gLeft*0.22)*t.length));
				text.setAttribute("font-size", (w*0.025));
				//if (this.gYTopVal-i*this.gYAxisGran==100) break; //Dont show '100' marking
			}
			text.textContent = t;
			svg.append(text);

			i++;
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

		//Alert lines
		if (this.gAlertLines) {
			for (i=0; i<2; i++) {
				var h = ((gBot-gTop)*(1-(alertLevels[i]/100)))+gTop;
				path = document.createElementNS(nS, "path");
				d = "M "+gLeft+" "+h+" L "+gRight+" "+h;
				path.setAttribute("d", d);
				path.id = 'gAlertLine'+(i+1);
				svg.append(path);
			}
		}

		//Data line and gradient
		if (this.gVisualData.length==0) return;
		var ySplit = (gBot-gTop)/(this.gYTopVal-this.gYBotVal);
		var xSplit = (gRight-gLeft)/this.gPointsOnX;
		var d = null;
		var xStart = null;

		var i = 0;
		while (i<this.gVisualData.length) {
			if (this.gVisualData[i][1]==0) {i++; continue;}

			//Search forward to find next non-zero data point
			var end = true;
			var next;
			for (var z=i+1; z<this.gVisualData.length; z++) {
				if (this.gVisualData[z][1]>0) {
					end = false;
					next = z;
					break;
				}
			}

			//Add data point to path
			var y = (this.gYTopVal-this.gVisualData[i][1])*ySplit+gTop;
			var x = gLeft+this.timeToX(this.gVisualData[i][0]);
			if (d==null) {
				d = "M"+x+" "+y;
				xStart = x;
			}
			
			/*Bezier curve split into 4 quadrants. Curve to
			half way between d and d+1, with control point at
			quater of way, then terminate at d+1, other control
			point will be infered.*/
			if (!end&&i<this.gVisualData.length) {
				var y1 = (this.gYTopVal-this.gVisualData[next][1])*ySplit+gTop;
				var x1 = gLeft+this.timeToX(this.gVisualData[next][0]);
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
			d +=" L "+(gLeft+this.timeToX(this.gVisualData[i][0]))+" "+gBot+" L "+xStart+" "+gBot+" Z";
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
		var self = this;
		this.formatVisualData(); //Format visual data to the same as current gData structure

		if (this.gData.length==0) {
			//Build graph once so you can see axis
			let promise = new Promise(function (resolve, reject) {
				self.buildGraph();
				resolve();
			});
			return promise;
		}

		//Reset visual data
		for (i=0; i<this.gVisualData.length; i++) {
			this.gVisualData[i][1] = this.gData[i][1]*0.8;
			if (this.gVisualData[i][1]<0) this.gVisualData[i][1] = 0;
		}

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
						//Add 1 until within 1 then jump to full (avoids inaccurate point values)
						if (self.gVisualData[i][1]<self.gData[i][1]) {
							if (self.gVisualData[i][1]>=self.gData[i][1]-1) self.gVisualData[i][1] = self.gData[i][1];
							else self.gVisualData[i][1]++;
						}
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
		/*$("#gFocusCircle").attr("cx", mX);
		$("#gFocusCircle").attr("cy", mY);

		var t = Math.floor(this.gVisualData[i])+" km/h";
		$("#gFocusText").attr("x", mX-(w*0.009)*(t.length/2));
		$("#gFocusText").attr("y", mY-(h*0.03));
		$("#gFocusText").html(t);

		var d = "M "+mX+" "+gBot+" L "+mX+" "+gTop;
		$("#gFocusLine").attr("d", d);

		$("#gFocusCircle").css("display", "block");
		$("#gFocusText").css("display", "block");
		$("#gFocusLine").css("display", "block");*/
	}

	graphSlideFinished() {
		for (i=0; i<this.gData.length; i++) {
			if (this.gVisualData[i][1]<this.gData[i][1]) return false;
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

		//$("#cSVGC1").css("stroke", "purple");
		//document.getElementById("cSVGC1").style.stroke = "purple";

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
		return;
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

	formatTime(time) {
		var mode = 1;
		if (this.gXAxisGran<=this.gXAxisGranModes[5]) mode = 4;
		if (this.gXAxisGran<=this.gXAxisGranModes[4]) mode = 3;
		if (this.gXAxisGran<=this.gXAxisGranModes[3]) mode = 2;
		if (this.gXAxisGran<=this.gXAxisGranModes[2]) mode = 1;

		var date = new Date(time);
		var h = date.getHours();
		var m = date.getMinutes();

		switch (mode) {
		case 1: //Hour:minute
			if (h==0&&m==0) { //New day so add day format
				return date.getDate()+" "+date.toLocaleString('default', {month: 'short'});
			}
			else { //Add hour formula
				if (h<10) h = '0'+h;
				if (m<10) m = '0'+m;
				return h+':'+m;
			}
		case 2: //Hour with text suffix 
			if (h==0) { //New day so day format
				return date.getDate()+" "+date.toLocaleString('default', {month: 'short'});
			}
			else { //Add hour formula
				var t = 'am';
				if (h>12) {
					t = 'pm';
					h -= 12;
				}
				if (h==12) t = 'pm';
				if (h==0) h = 12;
				return h+t;
			}
		case 3: //Day of week with hour with text suffix
			var t = 'am';
			if (h>12) {
				t = 'pm';
				h -= 12;
			}
			if (h==12) t = 'pm';
			if (h==0) h = 12;
			return h+t+" "+date.toLocaleDateString('default', {weekday: 'short'});
			
		case 4:  //Day of week with date
			date.setHours(0);
			date.setMinutes(0);
			date.setSeconds(0);
			date.setMilliseconds(0);
			return date.toLocaleDateString('default', {weekday: 'short'})+" "+date.getDate()+this.dateSuffix(date.getDate());
		case 5: //Month title and regular date
			date.setHours(0);
			date.setMinutes(0);
			date.setSeconds(0);
			date.setMilliseconds(0);
			if (date.getDate()==1) return date.toLocaleString('default', {month: 'short'})
			else return date.getDate()+this.dateSuffix(date.getDate());
		}
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