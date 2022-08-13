class ForecastPage extends Page {

	constructor(contentName) {
		super(contentName);

		//Add styles
		var link = document.createElement('link');
		link.setAttribute('rel', 'stylesheet');
		link.setAttribute('href', '../styles/forecast.css');
		document.head.appendChild(link);

		//Class vars
		this.gYTopVal;
		this.gYBotVal;
		this.gPointsOnX;
		this.gXMarkings = [];
		this.gYMarkings = [];
		this.gData = [];
		this.gVisualDataWind = [];
		this.gVisualDataTemp = [];
		this.gVisualDataRain = [];
		this.gVisualDataSnow = [];
		this.gVisualDataPercip = [];
		this.gVisualDataHumidity = [];
		this.gVisualDataUV = [];
		this.gVisualDataVis= [];
		this.precipCircleData = [];

		this.lat = -41.29308669049167;
		this.lon = 174.77142509064475;
		this.apiKey = 'a75f5e9f41e254fc40ed3651792e58bc';
	}

	//Required actions
	updatePageData() {
		var self = this;
		responseRecieved = false;

		let promise = new Promise(function (resolve, reject) {
			var req = new XMLHttpRequest(); //Fetch data
			//req.open('GET', 'https://api.openweathermap.org/data/3.0/onecall?lat='+self.lat+'&lon='+self.lon+'&exclude=minutely&appid='+self.apiKey, true);
			req.open('GET', 'https://api.openweathermap.org/data/2.5/forecast?lat='+self.lat+'&lon='+self.lon+'&appid='+self.apiKey, true);
			req.onreadystatechange = function() {
				if (checkResponse(req)) {
					self.recieveData(req);
					resolve();
				}
			}
			req.send();

			//Initiate loading
			setTimeout(function() {if (!responseRecieved) insertLoading(screen.width/2, screen.height/2, false);}, loadingWait);

			self.recieveData();
			resolve();
		});
		return promise;
	}

	recieveData(req) {
		//Get weather data
		alert(req.responseText);


		//Reset graph axis
		this.gYTopVal = 100;
		this.gYBotVal = 0;
		this.gPointsOnX = 8;
		this.gXMarkings = ["2pm", "3pm", "4pm", "5pm", "6pm", "7pm", "8pm", "9pm"];
		this.gYMarkings = [20, 40, 60, 80, 100];

		this.implementData();
	}

	implementData() {
		this.gVisualDataWind = [10, 20, 30, 40, 10, 50, 75, 20];
		this.gVisualDataTemp = [8, 50, 30, 40, 90, 20, 4, 65];
		this.gVisualDataRain = [80, 40, 2, 55, 74, 93, 22, 52];
		this.gVisualDataSnow = [5, 10, 20, 25, 45, 60, 75, 90];
		this.gVisualDataPercip = [73, 32, 49, 68, 12, 1, 12, 30];
		this.gVisualDataHumidity = [5, 10, 20, 25, 45, 60, 75, 90];
		this.gVisualDataUV = [56, 45, 32, 20, 12, 2, 88, 53];
		this.gVisualDataVis = [32, 8, 64, 55, 87, 24, 95, 100];

		this.precipCircleData = [50, 30, 40];
		this.buildGraph(1, true, false);
		this.buildGraph(2, false, false);
		this.buildGraph(3, false, false);
		this.buildGraph(4, false, false);
		this.buildGraph(5, false, true);
		this.buildGraph(6, false, true);
		this.buildGraph(7, false, true);
		this.buildGraph(8, false, true);
		this.updateCircleGraph(1);
		this.updateCircleGraph(2);
		this.updateCircleGraph(3);
	}

	buildGraph(id, wide, small) {
		var gVisualData = [];
		switch (id) {
			case 1: gVisualData = this.gVisualDataWind; break;
			case 2: gVisualData = this.gVisualDataTemp; break;
			case 3: gVisualData = this.gVisualDataRain; break;
			case 4: gVisualData = this.gVisualDataSnow; break;
			case 5: gVisualData = this.gVisualDataPercip; break;
			case 6: gVisualData = this.gVisualDataHumidity; break;
			case 7: gVisualData = this.gVisualDataUV; break;
			case 8: gVisualData = this.gVisualDataVis; break;
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
		var numThin = this.gYMarkings.length;
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
				text.setAttribute("y", (gBot*1.1));
				if (wide) text.setAttribute("font-size", (w*0.016));
				else text.setAttribute("font-size", (w*0.021));
				text.textContent = t;
				svg.append(text);
			}
		}
		

		//Data line and gradient
		var ySplit = (gBot-gTop)/(this.gYTopVal-this.gYBotVal);
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
			var y = (this.gYTopVal-gVisualData[i])*ySplit+gTop;
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
				var y1 = (this.gYTopVal-gVisualData[next])*ySplit+gTop;
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
	}

}