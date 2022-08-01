class DashboardPage extends Page {

	constructor(contentName) {
		super(contentName);
		
		//Add styles
		var link = document.createElement('link');
		link.setAttribute('rel', 'stylesheet');
		link.setAttribute('href', '../styles/dashboard.css');
		document.head.appendChild(link);

		//Class vars

		//Real-time data
		this.rtWindSpeed;
		this.rtLastUpdateTime;
		this.rtDegrees;
		this.rtAlarmLevel;

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
	}

	//Required actions

	updatePageData() {
		var self = this;

		let promise = new Promise(function (resolve, reject) {
			var req = new XMLHttpRequest(); //Fetch data
			req.open('GET', 'data/?sK='+sessionKey+'&m=1&gm='+self.gViewMode+'&t='+Math.random(), true);
			req.onreadystatechange = function() {
				if (checkResponse(req)) {
					self.recieveData(req);
					//setTimeout(resolve, 2000);
					resolve();
				}
			}
			req.send();
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
		this.alarmLevelTimes = jArr[0].alarmLevelTimes.slice(1, -1).split(",");

		//Load graph data
		this.gData = jArr[1].gData.slice(1, -1).split(",");
		this.gVisualData = [];
		for (i=0; i<this.gData.length; i++) this.gVisualData[i] = 0; //Copy incase no animation is run
		this.implementData();
	}


	implementData() {
		//Real-time module
		
		$('#rtSpeed1').html(this.rtWindSpeed); //Set wind speed
		
		//Set wind speed module background color according to alarm level
		switch (this.rtAlarmLevel) {
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
		var timeDiff = Math.abs(this.rtLastUpdateTime-Date.now());
		var days = Math.floor(timeDiff/8.64e+7);
		var hours = Math.floor(timeDiff/3600000);
		var mins = Math.floor(timeDiff/60000);
		
		if (days>=1) {
			if (days==1) $('#rtSpeed4').html(days+" day ago");
			else $('#rtSpeed4').html(days+" hours ago");
		}
		else if (hours>=1) {
			if (hours==1) $('#rtSpeed4').html(hours+" hour ago");
			else $('#rtSpeed4').html(hours+" hours ago");
		}
		else {
			if (mins==1) $('#rtSpeed4').html(mins+" min ago");
			else $('#rtSpeed4').html(mins+" mins ago");
		}

		//Display degrees
		$('#rtDir2').html(this.rtDegrees+"°");
		if (this.rtDegrees<45) $('#rtDir1').html("N");
		if (this.rtDegrees>=45) $('#rtDir1').html("NE");
		if (this.rtDegrees>=90) $('#rtDir1').html("E");
		if (this.rtDegrees>=135) $('#rtDir1').html("SE");
		if (this.rtDegrees>=180) $('#rtDir1').html("S");
		if (this.rtDegrees>=225) $('#rtDir1').html("SW");
		if (this.rtDegrees>=270) $('#rtDir1').html("W");
		if (this.rtDegrees>=315) $('#rtDir1').html("NW");

		//Graph module

		//Find y axis markings based on graph view mode and current time
		var ms = 1000*60*5; //Num ms in 5 minutes for rounding
		var d = Date.now();

		switch (this.gViewMode) {
		case 1: //Hour mode
			this.gPointsOnX = 12; //12 readings an hour - every 5 mins
			var d = Math.floor(d/ms)*ms; //Round down to nearest 5 mins
			
			for (i=0; i<13; i++) {
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
			this.gPointsOnX = 2*24; //2 readings an hour - every 30 mins

			for (i=0; i<25; i++) {
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
			this.gPointsOnX = 24*7; //24 readings a day - every 1 hour
			
			for (i=0; i<8; i++) {
				var date = new Date(d-((i)*86400000));
				this.gXMarkings[i] = date.toLocaleDateString('default', {weekday: 'short'})+" "+date.getDate()+this.dateSuffix(date.getDate());
			}
			break;

		case 4: //Month mode
			this.gPointsOnX = 60; //2 readings a day - every 6 hours

			for (i=0; i<31; i++) {
				var date = new Date(d-((i)*86400000));
				if (date.getDate()==1) this.gXMarkings[i] = date.toLocaleString('default', {month: 'long'})
				else this.gXMarkings[i] = date.getDate()+this.dateSuffix(date.getDate());
			}
			break;
		}

		this.animateGraph();
	}

	animateEntrance(start) {
		this.moveSlider(document.getElementsByClassName('sliderN')[0], true);
		setTimeout(removeLoading, start);
		setTimeout(fadeIn, start, $("#rtSpeed"));
		setTimeout(fadeIn, start+50, $("#rtDir"));
		setTimeout(fadeIn, start+100, $("#cCont"));
		setTimeout(fadeIn, start+150, $("#graph"));
		setTimeout(fadeIn, start+200, $("#slider"));
		setTimeout(() => {this.animateDirection();}, start+2000);
		setTimeout(() => {this.animateCircleGraphs();}, start+600);
		setTimeout(() => {
			if (this.rtAlarmLevel==3) this.initiateRedAlarm(); 
			if (this.rtAlarmLevel==2) this.initiateAmberAlarm(); 
		}, 4000);
	}

	//Real-time module actions

	animateDirection() {
		//Animate direction arrow spinning to value
		$('#rtDirIndicator').css('transform', 'rotate('+this.rtDegrees+'deg');
	}

	//Graph module slider actions

	lastObj;

	moveSlider(obj, updated) {
		var a = document.getElementById("slider").getBoundingClientRect().left;
		$('#sliderS').css("left", obj.getBoundingClientRect().left-a);
		
		if (this.lastObj!=null) this.lastObj.classList.remove("sliderNF");
		obj.classList.add("sliderNF");
		this.lastObj = obj;

		if (obj.innerHTML=="Hour") this.gViewMode = 1;
		if (obj.innerHTML=="Day") this.gViewMode = 2;
		if (obj.innerHTML=="Week") this.gViewMode = 3;
		if (obj.innerHTML=="Month") this.gViewMode = 4;

		//Get new data and reload graph
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
		var split = (gRight-gLeft)/(this.gXMarkings.length-1);
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

		//Data line
		var ySplit = (gBot-gTop)/(this.gYTopVal-this.gYBotVal);
		var xSplit = (gRight-gLeft)/this.gPointsOnX;

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
		}
	}

	animateGraph() {
		//Bypass
		for (i=0; i<this.gVisualData.length; i++) {
			this.gVisualData[i] = this.gData[i];
		}
		this.buildGraph();
		return;

		//Reset visual data
		for (i=0; i<this.gVisualData.length; i++) {
			//gVisualData[i] = gData[i]/4;
			if (this.gVisualData[i]<0) this.gVisualData[i] = 0;
		}

		//Animate points on graph sliding up
		let slide = setInterval(function() {
			if (graphSlideFinished()) {
				clearInterval(slide);
			}
			else {
				for (i=0; i<this.gVisualData.length; i++) {
					if (this.gVisualData[i]<this.gData[i]) this.gVisualData[i]++;
				}
				this.buildGraph();
			}
		}, 15);
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
		var c = 2*Math.PI*r;
		var v = this.alarmLevelTimes[i];
		if (v>100) v = 100;

		//Fudge a zero value to avoid weird looking circle
		if (v==0) $('#cSVGC'+(i+1)).css("stroke-dasharray", '0, 100000');
		else $('#cSVGC'+(i+1)).css("stroke-dasharray", (v*(c/100))+', '+c);
		//Update text
		$('#cTB'+(i+1)).html(this.alarmLevelTimes[i]);
		$('#cT'+(i+1)).css("opacity", 1);
	}

	animateCircleGraphs() {
		setTimeout(() => {this.updateCircleGraph(0)}, 200);
		setTimeout(() => {this.updateCircleGraph(1)}, 400);
		setTimeout(() => {this.updateCircleGraph(2)}, 600);
	}

	//General functions

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
		this.redAlarmAniKill = false;
		this.redAlarmAniOp = 100;
	 	this.redAlarmAniDir = -1;

		if (!alertMessageShown) {
				insertMessage("Warning - Extremely high wind speeds", 0);
				alertMessageShown = true;
		}

		var self = this;
		let flash = setInterval(function() {
			if (self.redAlarmAniKill) clearInterval(flash);
			else {
				if (self.redAlarmAniOp>=100) self.redAlarmAniDir = -2;
				if (self.redAlarmAniOp<=1) self.redAlarmAniDir = 2;
				
				self.redAlarmAniOp += self.redAlarmAniDir;
				$('#rtSpeed').css('background-image', 'linear-gradient(to bottom right, rgb(247, 67, 27, '+(self.redAlarmAniOp/100)+') 0%, rgb(220, 8, 0, '+(self.redAlarmAniOp/100)+') 50%)');
			}
		}, 16);
	}

	initiateAmberAlarm() {
		if (!alertMessageShown) {
			insertMessage("Caution - Wind speeds are higher than normal", 0);
			alertMessageShown = true;
		}
	}
}