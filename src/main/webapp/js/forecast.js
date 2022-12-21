class ForecastPage extends Page {

	constructor() {
		super("Forecast", "forecast", true);

		//Add styles
		var link = document.createElement('link');
		link.setAttribute('rel', 'stylesheet');
		if (isMobile) link.setAttribute('href', '../styles/mobile/forecast.css');
		else link.setAttribute('href', '../styles/forecast.css');
		document.head.appendChild(link);

		//Class vars
		this.gYBotVal;
		this.gPointsOnX = 13;
		this.gXMarkings = new Array(this.gPointsOnX);
		this.gVisualDataWind = new Array(this.gPointsOnX);
		this.gVisualDataTemp = new Array(this.gPointsOnX);
		this.gVisualDataRain = new Array(this.gPointsOnX);
		this.gVisualDataSnow = new Array(this.gPointsOnX);
		this.gVisualDataPercip = new Array(this.gPointsOnX);
		this.gVisualDataHumidity = new Array(this.gPointsOnX);
		this.gVisualDataUV = new Array(this.gPointsOnX);
		this.gVisualDataSoil= new Array(this.gPointsOnX);
		this.precipCircleData = new Array(this.gPointsOnX);
		this.sunTimes = [];
		this.weekModuleData = new Array(5);

		this.lat = -41.29308669049167;
		this.lon = 174.77142509064475;
	}

	//Required actions
	updatePageData() {
		var self = this;
		responseRecieved = false;

		let promise = new Promise(function (resolve, reject) {
			var req = new XMLHttpRequest(); //Fetch data
			req.open('GET', 'https://api.open-meteo.com/v1/forecast?latitude=-41.2865&longitude=174.7762&hourly=temperature_2m,relativehumidity_2m,dewpoint_2m,apparent_temperature,surface_pressure,precipitation,rain,showers,snowfall,snow_depth,freezinglevel_height,cloudcover,direct_radiation,windspeed_10m,winddirection_10m,windgusts_10m,soil_moisture_3_9cm&daily=weathercode,temperature_2m_max,temperature_2m_min,sunrise,sunset&timezone=auto', true);
			//req.open('GET', 'data/?sK='+sessionKey+'&m=9&t='+Math.random(), true);
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
		//Recieve weather data
		var jArr = JSON.parse(req.responseText);
		this.sunTimes = [jArr.daily.sunrise[0], jArr.daily.sunset[0]];

		var start = new Date().getHours(); //Start at current hour
		for (var i=start; i<jArr.hourly.rain.length; i++) {
			if (i>=start+this.gPointsOnX) break;

			//Time stamp
			var hours = new Date(jArr.hourly.time[i]).getHours();
			if (hours>12) this.gXMarkings[i-start] = (hours-12)+"pm";
			else this.gXMarkings[i-start] = hours+"am";
			if (this.gXMarkings[i-start]=="12am") this.gXMarkings[i-start] = "Midday";
			if (this.gXMarkings[i-start]=="0am") this.gXMarkings[i-start] = "12pm";
		
			//Load different weather components into corrosponding graph data
			this.gVisualDataTemp[i-start] = jArr.hourly.temperature_2m[i];
			this.gVisualDataWind[i-start] = jArr.hourly.windspeed_10m[i];
			this.gVisualDataRain[i-start] = jArr.hourly.rain[i];
			this.gVisualDataSnow[i-start] = jArr.hourly.snowfall[i];
			this.gVisualDataPercip[i-start] = jArr.hourly.precipitation[i];
			this.gVisualDataHumidity[i-start] = jArr.hourly.relativehumidity_2m[i];
			this.gVisualDataUV[i-start] = jArr.hourly.direct_radiation[i];
			this.gVisualDataSoil[i-start] = jArr.hourly.soil_moisture_3_9cm[i];
		}

		//Week module data
		for (var i=0; i<jArr.daily.time.length; i++) {
			if (i>=5) break; //Only take five days
			var n = new Date(jArr.daily.time[i]).toLocaleDateString('default', {weekday: 'short'});
			this.weekModuleData[i] = [n, jArr.daily.temperature_2m_max[i], jArr.daily.temperature_2m_min[i], jArr.daily.weathercode[i]];
		}

		//Graph formatting
		this.gYBotVal = 0;
		this.implementData();
	}

	mobileConfigure() {
		//Build carosel
		var c = new Carosel(0.8, $('#fCaroselDotCont'));
		c.add(document.getElementById('fWindM'));
		c.add(document.getElementById('fTempM'));
		c.add(document.getElementById('fRainM'));
		c.add(document.getElementById('fSnowM'));
		c.add(document.getElementById('fPrecipM'));
		c.add(document.getElementById('fSunsetM'));
	}

	implementData() {
		if (isMobile) page.mobileConfigure();


		//Update DOM text elements for different modules
		var d = new Date(this.sunTimes[0]);
		var mins = d.getMinutes();
		if (mins<10) mins = "0"+mins;
		$('#fMSunriseText').html(d.getHours()+":"+mins+" am");
		d = new Date(this.sunTimes[1]);
		mins = d.getMinutes();
		if (mins<10) mins = "0"+mins;
		$('#fMSunsetText').html((d.getHours()-12)+":"+mins+" pm");

		$('#fMWindText').html(this.gVisualDataWind[0]+"km/h");
		$('#fMTempText').html(this.gVisualDataTemp[0]+"°");
		$('#fMRainText').html(this.gVisualDataRain[0]+"mm");
		$('#fMSnowText').html(this.gVisualDataSnow[0]+"mm"); 

		//Week module
		for (var i=0; i<this.weekModuleData.length; i++) {
			$('#fDNT'+(i+1)).html(this.weekModuleData[i][0]);
			$('#fDNTempHi'+(i+1)).html(this.weekModuleData[i][1]+"°");
			$('#fDNTempLo'+(i+1)).html(this.weekModuleData[i][2]+"°");

			var wCode = this.weekModuleData[i][3];
			if (wCode<3) $('#fDNIcon'+(i+1)).css("background-image", "url('../assets/icons/sun.svg')");
			if (wCode>=3&&wCode<20) $('#fDNIcon'+(i+1)).css("background-image", "url('../assets/icons/cloudsfilled.svg')");
			if (wCode>=20&&wCode<40) $('#fDNIcon'+(i+1)).css("background-image", "url('../assets/icons/sleet.svg')");
			if (wCode>=40&&wCode<50) $('#fDNIcon'+(i+1)).css("background-image", "url('../assets/icons/fog.svg')");
			if (wCode>=50&&wCode<70) $('#fDNIcon'+(i+1)).css("background-image", "url('../assets/icons/rain.svg')");
			if (wCode>=70&&wCode<80) $('#fDNIcon'+(i+1)).css("background-image", "url('../assets/icons/snow.svg')");
			if (wCode>=80&&wCode<95) $('#fDNIcon'+(i+1)).css("background-image", "url('../assets/icons/rain.svg')");
			if (wCode>=95||wCode==29) $('#fDNIcon'+(i+1)).css("background-image", "url('../assets/icons/storm.svg')");
		}

		//Build graphs
		this.buildGraph(1, true, false);
		this.buildGraph(2, false, false);
		this.buildGraph(3, false, false);
		this.buildGraph(4, false, false);
		this.buildGraph(5, false, true);
		this.buildGraph(6, false, true);
		this.buildGraph(7, false, true);
		this.buildGraph(8, false, true);
		/*this.updateCircleGraph(1);
		this.updateCircleGraph(2);
		this.updateCircleGraph(3);*/
	}

	buildGraph(id, wide, small) {
		//Get data specific to this graph
		var gVisualData = [];
		var gYTopVal; //Variable limits for each weather feature
		var gYMarkings = []
		switch (id) {
			case 1: 
				gVisualData = this.gVisualDataWind;
				gYTopVal = 80;
				gYMarkings = [10, 20, 30, 40, 50, 60, 70, ""];
				break;
			case 2: 
				gVisualData = this.gVisualDataTemp;
				gYTopVal = 30;
				gYMarkings = [5, 10, 15, 20, 25, ""];
				break;
			case 3: 
				gVisualData = this.gVisualDataRain;
				gYTopVal = 8;
				gYMarkings = [1, 2, 3, 4, 5, 6, 7, ""];
				break;
			case 4: 
				gVisualData = this.gVisualDataSnow;
				gYTopVal = 8;
				gYMarkings = [2, 4, 6, ""];
				break;
			case 5: 
				gVisualData = this.gVisualDataPercip;
				gYTopVal = 6;
				gYMarkings = [1, 2, 3, 4];
				break;
			case 6: 
				gVisualData = this.gVisualDataHumidity;
				gYTopVal = 100;
				gYMarkings = [20, 40, 60, 80];
				break;
			case 7: 
				gVisualData = this.gVisualDataUV;
				gYTopVal = 250;
				gYMarkings = [50, 100, 150, 200];
				break;
			case 8: 
				gVisualData = this.gVisualDataSoil;
				gYTopVal = 2;
				gYMarkings = [0.5, 1, 1.5, 2];
				break;
		}

		var svg = $("#fMSVG"+id);
		svg.empty();
		
		//Primary color
		var col = "rgb(255, 255, 255)";
		if (id==4) col = "rgb(20, 20, 20)";
		//No opacity version for gradient
		var colN1 = col.substring(0, col.length-1)+", 0.8)";
		var colN2 = col.substring(0, col.length-1)+", 0)";

		//Secondary color
		var col2 = "rgb(255, 255, 255)";
		if (id==4) col2 = col;

		svg.html('<defs><linearGradient id="gradient'+id+'" x1="0" x2="0" y1="0" y2="1"><stop style="stop-color: '+colN1+';"offset="0%"/><stop style="stop-color: '+colN2+';" offset="100%"/></linearGradient></defs>');

		//SVG dimensions
		var w = parseFloat(svg.css("width"));
		var h = parseFloat(svg.css("height"));

		//Dimensions of graph inside svg
		var gBot = h*0.86;
		var gTop = h*0.05;
		var gLeft = 0;
		var gRight = w;

		
		//Axis lines
		var path = document.createElementNS(nS, "path");
		d = "M "+gLeft+" "+gBot+" L "+gRight+" "+gBot;
		path.setAttribute("d", d);
		path.setAttribute("class", "fMGAxisLine");
		path.style.stroke = col2;
		svg.append(path);

		//Thin lines
		var numThin = gYMarkings.length;
		var split = (gBot-gTop)/numThin;
		for (i=1; i<numThin; i++) {
			var h1 = (split*i)+gTop;
			path = document.createElementNS(nS, "path");
			d = "M "+gLeft+" "+h1+" L "+gRight+" "+h1;
			path.setAttribute("d", d);
			path.setAttribute("class", 'fMGThinLine');
			path.style.stroke = col2;
			svg.append(path);
		}

		//Adjust so data is not at edges, even though lines are
		gLeft = w*0.05;
		gRight = w;

		if (!small) {
			//X Axis Markings
			var split = (gRight-gLeft)/this.gXMarkings.length;
			for (i=0; i<this.gXMarkings.length; i++) {
				var w1 = (split*i)+gLeft;
				//Line
				path = document.createElementNS(nS, "path");
				d = "M "+w1+" "+(gBot-(gLeft*0.1))+" L "+w1+" "+(gBot+(gLeft*0.1));
				path.setAttribute("d", d);
				path.setAttribute("class", 'fMGMarkingLine');
				path.style.stroke = col;
				svg.append(path);

				//Text
				var t = String(this.gXMarkings[i]);
				var text = document.createElementNS(nS, "text");
				text.setAttribute("class", 'fMGMarkingText');
				text.style.fill = col2;
				//X value accounts for length of string
				text.setAttribute("x", w1-((gLeft*0.1)*(t.length/2)));
				if (isMobile) text.setAttribute("y", (gBot*1.07));
				else text.setAttribute("y", (gBot*1.1));
				if (isMobile) text.setAttribute("font-size", (w*0.022));
				else if (wide) text.setAttribute("font-size", (w*0.016));
				else text.setAttribute("font-size", (w*0.021));
				text.textContent = t;
				svg.append(text);
			}

			//Y Axis Marking Text
			var split = (gBot-gTop)/gYMarkings.length;
			for (i=0; i<gYMarkings.length; i++) {
				var h1 = (split*i)+gTop;
				//Text
				var t = String(gYMarkings[(gYMarkings.length-1)-i]);
				var text = document.createElementNS(nS, "text");
				text.setAttribute("class", 'fMGMarkingText');
				text.style.fill = col2;
				text.style.opacity = 0.5;
				text.setAttribute("x", (gLeft*0.5)-((gLeft*0.1)*t.length));
				text.setAttribute("y", h1+(h*0.01));
				if (isMobile) text.setAttribute("font-size", (w*0.032));
				else if (wide) text.setAttribute("font-size", (w*0.016));
				else text.setAttribute("font-size", (w*0.021));
				text.textContent = t;
				svg.append(text);
			}
		}
		

		//Data line and gradient
		var ySplit = (gBot-gTop)/(gYTopVal-this.gYBotVal);
		var xSplit = (gRight-gLeft)/this.gPointsOnX;
		var d = null;
		var xStart = null;

		var i = 0;
		while (i<gVisualData.length) {
			if (gVisualData[i]==0) {i++; continue;}

			//Search forward to find next non-zero data point
			var end = true;
			var next;
			for (var z=i+1; z<gVisualData.length; z++) {
				if (gVisualData[z]>0) {
					end = false;
					next = z;
					break;
				}
			}

			//Add data point to path
			var y = (gYTopVal-gVisualData[i])*ySplit+gTop;
			var x = i*xSplit+gLeft;
			if (d==null) {
				d = "M"+x+" "+y;
				xStart = x;
			}
			
			/*Bezier curve split into 4 quadrants. Curve to
			half way between d and d+1, with control point at
			quater of way, then terminate at d+1, other control
			point will be infered.*/
			if (!end&&i<gVisualData.length) {
				var y1 = (gYTopVal-gVisualData[next])*ySplit+gTop;
				var x1 = next*xSplit+gLeft;
				var midY;
				if (y1>y) midY = y1-(y1-y)/2;
				else midY = y-(y-y1)/2;

				d += " Q"+(x+(x1-x)/4)+","+y;
				d += " "+(x+(x1-x)/2)+","+midY;
				d += " T"+x1+","+y1;
			}

			if (!small) {
				//Add circle
				var circle = document.createElementNS(nS, "circle");
				var cName = "fMGDataCircle";
				if (wide) cName = "fMGDataCircleWide";
				circle.setAttribute("class", cName);
				circle.style.fill = col;
				circle.setAttribute("cx", x);
				circle.setAttribute("cy", y);
				svg.append(circle);
			}

			i = next;
			if (end) break;
		}

		if (xStart!=null) { //Add elements to svg
			//Data line
			path = document.createElementNS(nS, "path");
			if (small) path.setAttribute("class", 'fMGDataLine fMGDataLineSmall');
			else path.setAttribute("class", 'fMGDataLine');
			path.style.stroke = col;
			path.setAttribute("d", d);
			svg.append(path);

			//Close gradient path back to start of path
			d +=" L "+(i*xSplit+gLeft)+" "+gBot+" L "+xStart+" "+gBot+" Z";
			//Gradient
			path = document.createElementNS(nS, "path");
			path.setAttribute("class", 'fMGDataGrad');
			path.style.fill = "url(#gradient"+id+")";
			path.setAttribute("d", d);
			svg.append(path);
		}
	}

	updateCircleGraph(i) {
		var svg = $('#fMcSVG');
		var r = parseFloat(svg.css('width'))*0.5;	
		var c = 2*Math.PI*(r+10);
		var v = this.precipCircleData[i-1];
		//Fudge a zero value to avoid weird looking circle
		if (v==0) $('#fMcSVGC'+i).css("stroke-dasharray", '0, 100000');
		else $('#fMcSVGC'+i).css("stroke-dasharray", (v*(c/100))+', '+c);

		//Update smaller text with units
		/*var s = "mins";
		v = this.precipCircleData[i];
		if (v>60) {
			s = "hours";
			v = Math.floor(v/60);
			if (v>=24) {
				s = "days"
				v = Math.floor(v/24)
			}
		}
		if (i==0) s += " at green";
		if (i==1) s += " at amber";
		if (i==2) s += " at red";
		$('#fMcTS'+(i+1)).html(s);

		//Update text with number
		$('#fMcTB'+(i+1)).html(v);
		$('#fMcT'+(i+1)).css("opacity", 1);*/
	}

	animateEntrance(start) {
		setTimeout(removeLoading, start);
		setTimeout(fadeIn, start, $("#fTempM"));
		setTimeout(fadeIn, start+100, $("#fWindM"));
		setTimeout(fadeIn, start+100, $("#fRainM"));
		setTimeout(fadeIn, start+100, $("#fSnowM"));
		setTimeout(fadeIn, start+100, $("#fPrecipM"));
		setTimeout(fadeIn, start+100, $("#fSunsetM"));
		setTimeout(fadeIn, start+100, $("#fDailyM"));
		setTimeout(fadeIn, start+100, $("#fPoweredBy"));
	}

}