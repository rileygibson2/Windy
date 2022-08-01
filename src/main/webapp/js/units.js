class UnitsPage extends Page {

	constructor(contentName) {
		super(contentName);

		//Add styles
		var link = document.createElement('link');
		link.setAttribute('rel', 'stylesheet');
		link.setAttribute('href', '../styles/units.css');
		document.head.appendChild(link);

		//Class vars
		this.units;
	}

	//Required actions
	updatePageData() {
		var self = this;

		let promise = new Promise(function (resolve, reject) {
			var req = new XMLHttpRequest(); //Fetch data
			req.open('GET', 'data/?sK='+sessionKey+'&m=2&t='+Math.random(), true);
			req.onreadystatechange = function() {
				if (checkResponse(req)) {
					self.recieveData(req);
					resolve();
				}
			}
			req.send();
		});
		return promise;
	}

	recieveData(req) {
		this.units = JSON.parse(req.responseText);
		this.implementData();
	}

	implementData() {
		//Add units
		for (i=this.units.length-1; i>=0; i--) {
			//Node
			var n = document.createElement("div");
			n.setAttribute("class", 'uN');
			/*if (unitData[i][0]==1) n.style.borderBottom = "3px solid rgb(3, 220, 15)";
			else n.style.borderBottom = "3px solid rgb(220, 0, 0)";*/
			
			//Status icon and text
			d = document.createElement("div");
			d.setAttribute("class", 'uNStatusIcon');
			var t = document.createElement("div");
			t.setAttribute("class", 'uNStatusText');
			if (this.units[i].status==1) {
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
			if (this.units[i].battery==1) t.innerHTML = "Healthy";
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
			d.innerHTML = this.units[i].unit;
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
		var c = $('#uCont').children();
		for (var i=c.length; i>=0; i--) {
			setTimeout(fadeIn, start, c.eq(i));
			start += 40;
		}
	}
}