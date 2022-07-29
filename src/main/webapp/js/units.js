class UnitsPage extends Page {

	constructor(contentName) {
		super(contentName);

		//Add styles
		var link = document.createElement('link');
		link.setAttribute('rel', 'stylesheet');
		link.setAttribute('href', '../styles/units.css');
		document.head.appendChild(link);

		//Class vars
		this.numUnits;
	}

	//Required actions
	updatePageData() {
		var self = this;

		let promise = new Promise(function (resolve, reject) {
			var req = new XMLHttpRequest(); //Fetch data
			req.open('GET', 'data/?m=2&t='+Math.random(), true);
			req.onreadystatechange = function() {
				if (req.readyState==4&&req.status==200) {
					self.recieveData(req);
					resolve();
				}
			}
			req.send();
		});
		return promise;
	}

	recieveData(req) {
		var jArr = JSON.parse(req.responseText);
		this.numUnits = jArr[0].numUnits;
		this.implementData();
	}

	implementData() {
		var unitData = [[0, 0], [1, 1], [1, 1]];

		//Add units
		for (i=0; i<unitData.length; i++) {
			//Node
			var n = document.createElement("div");
			n.setAttribute("class", 'uN');
			//n.style.borderBottom = "3px solid rgb(3, 220, 15)";
			
			//Status icon and text
			d = document.createElement("div");
			d.setAttribute("class", 'uNStatusIcon');
			var t = document.createElement("div");
			t.setAttribute("class", 'uNStatusText');
			if (unitData[i][0]==1) {
				d.style.backgroundColor = 'rgb(3, 220, 15)';
				t.innerHTML = "Online";
			}
			else {
				d.style.backgroundColor = 'rgb(255, 50, 50)';
				t.innerHTML = "Offline";
			}
			n.append(d);
			n.append(t);

			//Battery icon and text
			d = document.createElement("div");
			d.setAttribute("class", 'uNBatteryIcon');
			t = document.createElement("div");
			t.setAttribute("class", 'uNBatteryText');
			if (unitData[i][1]==1) {
				t.innerHTML = "Healthy";
			}
			else {
				d.style.backgroundColor = 'rgb(255, 153, 0)';
				t.innerHTML = "Check power";
			}
			n.append(d);
			n.append(t);

			//Main Icon
			var d = document.createElement("div");
			d.setAttribute("class", 'uNIcon');
			n.append(d);
			//Title
			d = document.createElement("div");
			d.setAttribute("class", 'uNTitle');
			d.innerHTML = "windy"+(i+3)+"c"+(i+3)*24;
			n.append(d);
			//Version
			d = document.createElement("div");
			d.setAttribute("class", 'uNText');
			d.innerHTML = "Version<br>1.0.5";
			n.append(d);

			$('#uCont').prepend(n);
		}
	}

	animateEntrance(start) {
		setTimeout(removeLoading, start);
		var c1 = $('#effCont').children();
		for (i=0; i<c1.length; i++) {
			var c2 = c1.eq(i).children();
			for (var z=c2.length; z>=0; z--) {
				setTimeout(fadeIn, start, c2.eq(z));
				start += 40;
			}
		}
	}
}