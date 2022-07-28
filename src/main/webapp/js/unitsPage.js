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
		//Center elements
		for (i=0; i<this.numUnits; i++) {
			var div = document.createElement("div");
			div.setAttribute("class", 'uN');
			$('#uCont').prepend(div);
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