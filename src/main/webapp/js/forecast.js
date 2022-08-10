class ForecastPage extends Page {

	constructor(contentName) {
		super(contentName);

		//Add styles
		var link = document.createElement('link');
		link.setAttribute('rel', 'stylesheet');
		link.setAttribute('href', '../styles/forecast.css');
		document.head.appendChild(link);
	}

	//Required actions
	updatePageData() {
		var self = this;
		responseRecieved = false;

		let promise = new Promise(function (resolve, reject) {
			/*var req = new XMLHttpRequest(); //Fetch data
			req.open('GET', 'data/?sK='+sessionKey+'&m=3&u='+unit+'&t='+Math.random(), true);
			req.onreadystatechange = function() {
				if (checkResponse(req)) {
					self.recieveData(req);
					resolve();
				}
			}
			req.send();

			//Initiate loading
			setTimeout(function() {if (!responseRecieved) insertLoading(screen.width/2, screen.height/2, false);}, loadingWait);
			*/
			resolve();
		});
		return promise;
	}

	recieveData(req) {
		
	}

	implementData() {
	}

	animateEntrance(start) {
		setTimeout(removeLoading, start);
		setTimeout(fadeIn, start, $("#fTempM"));
		setTimeout(fadeIn, start+100, $("#fWindM"));
		setTimeout(fadeIn, start+100, $("#fRainM"));
		setTimeout(fadeIn, start+100, $("#fSnowM"));
		setTimeout(fadeIn, start+100, $("#fPrecipM"));
	}

}