class HistoryPage extends Page {

	constructor(contentName) {
		super(contentName);

		//Add styles
		var link = document.createElement('link');
		link.setAttribute('rel', 'stylesheet');
		link.setAttribute('href', '../styles/history.css');
		document.head.appendChild(link);

		//Class vars
		this.offset = 0; //Amount timeline has been offset by scrolls
		this.historyData; //Data which shows overview of records over time
		this.focussedRecords; //Individual records of a specific requested period of time
	}

	//Required actions
	updatePageData() {
		var self = this;
		responseRecieved = false;

		let promise = new Promise(function (resolve, reject) {
			var req = new XMLHttpRequest(); //Fetch data
			req.open('GET', 'data/?sK='+sessionKey+'&m=3&t='+Math.random(), true);
			req.onreadystatechange = function() {
				if (checkResponse(req)) {
					self.recieveData(req);
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
		var jArr = JSON.parse(req.responseText);
		this.historyData = eval(jArr[0].data);
		this.implementData();
	}

	implementData() {
		//Set up listeners
		document.getElementById('vHCont').addEventListener('mousewheel', (event) => {
			this.vHOnScroll(event);
		});
		document.getElementById('vHCont').addEventListener("mouseover", (event) => {
			this.vHOnHover(event);
		});
		document.getElementById('vHCont').addEventListener("mouseout", (event) => {
			this.vHOnUnHover(event);
		});
		document.getElementById('vHCont').addEventListener("mousedown", (event) => {
			this.vHOnClick(event);
		});

		this.buildVisualHistory();
	}

	animateEntrance(start) {
		setTimeout(removeLoading, start);
		setTimeout(fadeIn, start, $("#vHCont"));
	}

	//Visual History actions

	resetVHOffset() {
		var self = this;
		var i = 0;
		var oldOffset = this.offset;
		let slide = setInterval(function() {
			if (self.offset<=0) {
				self.offset = 0;
				self.buildVisualHistory();
				clearInterval(slide);
			}
			else { //Parabolic descent
				self.offset = parseInt(-0.8*Math.pow(i, 2)+oldOffset)
				self.buildVisualHistory();
			}
			i++;
		}, 15);
	}

	buildVisualHistory() {
		//Adjust reset button and arrows
		if (this.offset!=0) {
			$('#vHReset').css('opacity', '1');
			$('#vHArrow').css('opacity', '0');
		}
		else {
			$('#vHReset').css('opacity', '0');
			$('#vHArrow').css('opacity', '0.9');
		}

		var svg = $("#vHSVG");
		svg.empty();

		//SVG dimensions
		var w = parseFloat(svg.css("width"));
		var h = parseFloat(svg.css("height"));

		//Centering vars
		var midY = h*0.5;
		var midX = w*0.5;
		var incrX = w/12;

		//Make groups for z indexing
		var gOver = document.createElementNS(nS, "g");
		var gUnder = document.createElementNS(nS, "g");

		//Main timeline lines
		var path = document.createElementNS(nS, "path");
		var d = "M "+0+" "+midY+" L "+w+" "+midY;
		path.setAttribute("d", d);
		path.setAttribute("id", 'vHTimeLine');
		gOver.append(path);

		//Main stuff
		var x = midX+this.offset;
		var d = Date.now();

		//Start so that doesnt have to continue through values offscreen to the right
		var start = Math.floor((this.offset-(w/2))/incrX)+1;
		if (start<0) start = 0;
		
		var i = start;
		x -= start*incrX; //Adjust x based on start
		var dI = 0; //Data pointer

		while (true) {
			if (x<0) break; //No more will be visible
			if (x>w) { //Just a failsafe incase the start offset thing didnt work
				x -= incrX; i++; continue;
			}

			var month = new Date(d-((i)*2.628e+9));
			//Get timecode for first second of that month
			month = new Date(month.getFullYear(), month.getMonth(), 1);
			var mT = month.toLocaleString('default', {month: 'short'});
			
			//Do year
			if (mT=='Jan') {
				this.makeCircle('vHNodeCInnerL', null, x, midY, gOver);
				this.makeCircle('vHNodeCOuterL', null, x, midY, gOver);
				this.makeText('vHNodeTextL', String(month.getFullYear()), x, midY*1.18, w*0.03, gOver);
				//x -= incrX;
			}
			else {
				//Do month
				this.makeCircle('vHNodeCS', 'vHNodeCS'+i, x, midY, gOver);
				this.makeText('vHNodeTextS', mT, x, midY*1.08, w*0.011, gOver);
			}

			//Do data - look forward through data until match is found
			while (dI<this.historyData.length) {
				var tS = new Date(this.historyData[dI][0]); //Evaluate data timestamp
				//If record is behind current
				if (tS<month) {dI++; break;}
				//If record is more than a month ahead
				if (tS>(month.getTime()+2.628e+9)) {dI++; continue;}

				//Record is within desired month
				var day = tS.getDate();
				this.makeRect('vHNodeDR', x+((incrX/31)*day), midY-(this.historyData[dI][1]/2), (incrX/31)*0.8, (this.historyData[dI][1]/2), gUnder);
				this.makeRect('vHNodeDRR', x+((incrX/31)*day), midY, (incrX/31)*0.8, (this.historyData[dI][1]/2), gUnder);
				dI++;
			}

			x -= incrX;
			i++;
		}

		svg.append(gUnder);
		svg.append(gOver);
	}

	makeCircle(cName, idName, cx, cy, parent) {
		var circle = document.createElementNS(nS, "circle");
		circle.setAttribute("class", cName);
		if (idName!=null) circle.setAttribute("id", idName);
		circle.setAttribute("cx", cx);
		circle.setAttribute("cy", cy);
		parent.append(circle);
		return circle;
	}

	makeRect(cName, x, y, w, h, parent) {
		var rect = document.createElementNS(nS, "rect");
		rect.setAttribute("class", cName);
		rect.setAttribute("x", x);
		rect.setAttribute("y", y);
		rect.setAttribute("width", w);
		rect.setAttribute("height", h);
		rect.setAttribute("rx", 2);
		parent.append(rect);
	}

	makeText(cName, t, x, y, fSize, parent) {
		var text = document.createElementNS(nS, "text");
		text.setAttribute("class", cName);
		text.setAttribute("x", x-((fSize/2)*(t.length/2))); //X value accounts for length of string
		text.setAttribute("y", y);
		text.setAttribute("font-size", fSize);
		text.textContent = t;
		parent.append(text);
	}

	//Event actions

	vHOnScroll(event) {
		this.offset += -event.deltaX;
		if (this.offset<0) this.offset = 0;
		this.buildVisualHistory();
	}

	vHOnHover(event) {
		if (event==undefined) return;
		//Get probable node index
		var w = parseFloat($("#vHSVG").css("width"));
		var incrX = w/12;
		var i = -Math.floor((event.clientX-(w*0.5)-this.offset-(incrX/2))/incrX);
	
		$('.vHNodeCS').each(function(i, obj) {$(obj).css("r", "7px");});
		if (i>=0) $('#vHNodeCS'+i).css("r", "12px");
	}

	vHOnUnHover(event) {
		$('.vHNodeCS').each(function(i, obj) {$(obj).css("r", "7px");});
		if (event==undefined) return;
	}

	vHOnClick(event) {
		if (event==undefined) return;
		//Get probable node index
		var w = parseFloat($("#vHSVG").css("width"));
		var incrX = w/12;
		var i = -Math.floor((event.clientX-(w*0.5)-this.offset-(incrX/2))/incrX);
		if (i<0) return;

		var start = new Date(Date.now()-(2.628e+9*i));
		start = new Date(start.getFullYear(), start.getMonth(), 1);

		var end = new Date(Date.now()-(2.628e+9*(i-1)));
		end = new Date(end.getFullYear(), end.getMonth(), 1);

		//alert(i+" s: "+start+" e: "+end);
		var self = this;
		responseRecieved = false;
		var req = new XMLHttpRequest(); //Fetch data
		req.open('GET', 'data/?sK='+sessionKey+'&m=4&rS='+start.getTime()+'&rE='+end.getTime()+'&t='+Math.random(), true);
		req.onreadystatechange = function() {
			if (checkResponse(req)) {
				self.focussedRecords = eval(JSON.parse(req.responseText)[0].data);
				self.buildFocussedRecords(start, end);
			}
		}
		req.send();

		//Initiate loading
		setTimeout(function() {if (!responseRecieved) insertLoading(screen.width/2, screen.height/2, false);}, loadingWait);
	}

	buildFocussedRecords(start, end) {
		$('#fRCont').empty();

		//Make title and close button
		var fRT = document.createElement("div");
		fRT.setAttribute('id', 'fRTitle');
		fRT.innerHTML = "Records from <b>"+start.toLocaleDateString("en-UK", {year:'numeric', month:'long', day:'numeric'});
		fRT.innerHTML += "</b> to <b>"+end.toLocaleDateString("en-UK", {year:'numeric', month:'long', day:'numeric'})+"</b>";
		fRT.innerHTML += " - "+this.focussedRecords.length+" records";
		var fRC = document.createElement("div");
		fRC.setAttribute('id', 'fRClose');
		fRC.addEventListener('mousedown', (event) => {
			this.closeFocussedRecords();
		});
		
		fRT.append(fRC);
		$('#fRCont').append(fRT);

		//Make records
		for (i=0; i<this.focussedRecords.length; i++) {
			if (i>200) break; //Laggy after this many records

			var fR = document.createElement("div");
			fR.setAttribute('class', 'fRecord');
			if (i==0) fR.style.marginTop = '7%';

			//Icon
			var ic = document.createElement("div");
			ic.setAttribute('class', 'fRecordIcon');
			//Icon alert level styling
			switch (this.focussedRecords[i][3]) {
			case 1: 
				ic.style.backgroundColor = 'rgb(3, 200, 15)';
				break;
			case 2:
				ic.style.backgroundColor = 'rgb(247, 182, 40)'; //'rgb(255, 153, 0)'
				ic.style.backgroundImage = 'url("../assets/icons/warning.svg")';
				break;
			case 3:
				ic.style.backgroundColor = 'rgb(247, 67, 27)' //'rgb(220, 8, 0)'
				ic.style.backgroundImage = 'url("../assets/icons/warning.svg")';
			}

			//Text
			var rT = document.createElement("p");
			rT.setAttribute('class', 'fRecordT');
			rT.innerHTML = "<b>Speed:</b> "+this.focussedRecords[i][1]+"km/h";
			rT.innerHTML += "\u00A0\u00A0\u00A0\u00A0\u00A0<b>Direction:</b> "+this.focussedRecords[i][2]+" degrees";
			rT.innerHTML += "\u00A0\u00A0\u00A0\u00A0\u00A0<b>Alert: </b>Level "+this.focussedRecords[i][3];


			var tS = new Date(this.focussedRecords[i][0]);
			//alert(tS);
			rT.innerHTML += "\u00A0\u00A0\u00A0\u00A0\u00A0<b>Log Time: </b>"+tS.toLocaleDateString([], {year:'numeric', month:'long', day:'numeric'});
			rT.innerHTML += " "+tS.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

			fR.append(ic);
			fR.append(rT);
			$('#fRCont').append(fR);
		}

		//Animate container entrance
		$('#hTitle').css("opacity", "0");
		$('#vHCont').css("margin-top", "-30vh");
		$('#fRCont').css("display", "block");
		$('#fRCont').css("animation", "fRContEntrance 0.8s ease forwards");
	}

	closeFocussedRecords() {
		$('#hTitle').css("opacity", "1");
		$('#vHCont').css("margin-top", "0vh");
		$('#fRCont').css("animation", "fRContExit 1s ease forwards");
		setTimeout(function() {
			$('#fRCont').css("display", "none");
		}, 1000);
	}






}