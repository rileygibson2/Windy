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
		this.pairProgress;
	}

	//Required actions
	updatePageData() {
		var self = this;
		responseRecieved = false;

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

			//Initiate loading
			setTimeout(function() {if (!responseRecieved) insertLoading(screen.width/2, screen.height/2, false);}, loadingWait);
		});
		return promise;
	}

	recieveData(req) {
		this.units = JSON.parse(req.responseText);
		this.implementData();
	}

	implementData() {
		self = this;
		var row1 = document.getElementById('uRow1');
		var row = row1;
		
		//Figure out rows
		if (this.units.length>3) { //Will need two rows
			//Shift up old row and make new row
			row.style.marginTop = "13%";
			row = document.createElement("div");
			row.setAttribute("class", 'uRow');
			row.setAttribute("id", 'uRow2');
			$('#uCont').append(row);
			$("#uAdd").detach().appendTo('#uRow2') //Move plus button
		}

		//Add units
		for (i=this.units.length-1; i>=0; i--) {
			if ((i+1)/3<=1) {
				row = row1; //Check if this unit needs to go in new containers
			}

			//Get ip location info
			var req = new XMLHttpRequest(); //Fetch data
			req.i = i;
			req.open('GET', 'https://ipapi.co/'+this.units[i].ip+'/json/');
			req.onreadystatechange = function() {
				if (this.readyState!=4) return; 

				var jObj = undefined;
				if (this.status==200) { //Success, show location
					jObj = JSON.parse(this.responseText);
					$('#uNLocationText'+this.i).html(jObj.city+", "+jObj.country_name);
				}
				//Faliure, show ip instead
				if (this.status!=200||jObj.city==undefined||jObj.country_name==undefined) {
					$('#uNLocationText'+this.i).html(self.units[this.i].ip);
				}
				$('#uNLocationText'+this.i).css('opacity', '1');
			}
			req.send();

			//Node
			var n = document.createElement("div");
			n.setAttribute("class", 'uN');
			n.setAttribute("id", 'uN'+i);
			/*if (unitData[i][0]==1) n.style.borderBottom = "3px solid rgb(3, 220, 15)";
			else n.style.borderBottom = "3px solid rgb(220, 0, 0)";*/
			
			//Main Icon
			var d = document.createElement("div");
			d.setAttribute("class", 'uNIcon');
			n.append(d);
			//Title
			d = document.createElement("div");
			d.setAttribute("class", 'uNTitle');
			d.innerHTML = this.units[i].name;
			n.append(d);
			//Location text
			d = document.createElement("div");
			d.setAttribute("class", 'uNLocationText');
			d.setAttribute("id", 'uNLocationText'+i);
			n.append(d);
			//Version
			d = document.createElement("div");
			d.setAttribute("class", 'uNText');
			d.innerHTML = "Version<br>1.0.5";
			n.append(d);

			//Status icon and text
			var c = document.createElement("div");
			c.setAttribute("class", 'uNStatusCont');
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
			c.append(d);
			c.append(t);
			n.append(c);

			//Battery icon and text
			c = document.createElement("div");
			c.setAttribute("class", 'uNBatteryCont');
			d = document.createElement("div");
			d.setAttribute("class", 'uNBatteryIcon');
			t = document.createElement("div");
			t.setAttribute("class", 'uNBatteryText');
			if (this.units[i].power==0) {
				d.style.backgroundColor = 'rgb(255, 153, 0)';
				d.style.backgroundImage = 'url("../assets/icons/power.svg")';
				t.innerHTML = "Check power";
			}
			else t.innerHTML = this.units[i].battery+"%";
			c.append(d);
			c.append(t);
			n.append(c);

			//Add click listener and add to DOM
			var addListener = function(i) {n.onmousedown = function() {self.changeUnit(i);};}
			addListener(i);
			row.prepend(n);

			//Build battery svg
			this.buildBatterySVG(this.units[i].battery, d);
		}
	}

	buildBatterySVG(level, parent) {
		var svg = document.createElementNS(nS, "svg");
		svg.setAttribute("class", 'uBatSVG');

		//SVG dimensions
		var w = parent.offsetWidth;
		var h = parent.offsetHeight;
		
		//Percent rect
		var pH = 70*(level/100);
		var rect = document.createElementNS(nS, "rect");
		rect.setAttribute("class", "uBatSVGPRect");
		rect.setAttribute("x", '30%');
		rect.setAttribute("y", (90-pH)+"%");
		rect.setAttribute("width", '40%');
		rect.setAttribute("height", pH+"%");
		rect.setAttribute("rx", 2);
		if (level<20) rect.style.fill = "rgb(255, 0, 0)";
		else if (level<40) rect.style.fill = "rgb(255, 153, 0)";
		else rect.style.fill = "rgb(3, 220, 15)";
		svg.append(rect);

		//Main rect
		var rect = document.createElementNS(nS, "rect");
		rect.setAttribute("class", "uBatSVGRect");
		rect.setAttribute("x", '30%');
		rect.setAttribute("y", '20%');
		rect.setAttribute("width", '40%');
		rect.setAttribute("height", '70%');
		rect.setAttribute("rx", 2);
		svg.append(rect);

		//Tip rect
		var rect = document.createElementNS(nS, "rect");
		rect.setAttribute("class", "uBatSVGRect");
		rect.setAttribute("x", '40%');
		rect.setAttribute("y", '10%');
		rect.setAttribute("width", '20%');
		rect.setAttribute("height", '10%');
		rect.setAttribute("rx", 0.5);
		if (level==100) rect.style.fill = "rgb(255, 255, 255)";
		svg.append(rect);

		parent.append(svg);
	}

	changeUnit(i) {
		unit = this.units[i].id;
		unitName = this.units[i].name;
		switchSections(0);
	}

	openRegisterDialog() {
		this.pairProgress = -1;
		//Animate entrance - Take stuff out
		$('#sc').css({'filter':'blur(10px)', 'opacity':'0.2'});
		$('#uCont').css({'filter':'blur(10px)', 'opacity':'0.2'});
		$('#sbCont').css({'filter':'blur(10px)', 'opacity':'0.2'});
		$('#sICont').css({'filter':'blur(10px)', 'opacity':'0.2'});
		
		//Add register container in
		$('#regCont').css("display", "block");
		$('#regCont').css("animation", "openRegister 0.3s ease-in-out forwards");
	}

	closeRegisterDialog() {
		//Animate register container out
		$('#regCont').css("animation", "closeRegister 0.4s ease-in-out forwards");
		setTimeout(function() {
			$('#regCont').remove();
		}, 500);

		//Bring stuff in
		$('#sc').css({'filter':'none', 'opacity':'1'});
		$('#uCont').css({'filter':'none', 'opacity':'1'});
		$('#sbCont').css({'filter':'none', 'opacity':'1'});
		$('#sICont').css({'filter':'none', 'opacity':'1'});
	}

	buildProgressScreen() {
		//Validate input
		var validIP = /^((25[0-5]|(2[0-4]|1\d|[1-9]|)\d)(\.(?!$)|$)){4}$/.test(new String($('#regIP').val()));
		if ($('#regIP').val()==""||!validIP) $('#regIP').css("border", "1px solid red");
		else $('#regIP').css("border", "none");
		if ($('#regKey').val()=="") $('#regKey').css("border", "1px solid red");
		else $('#regKey').css("border", "none");
		if ($('#regIP').val()==""||$('#regKey').val()==""||!validIP) return;

		//Fade everything currently in register container
		var c = $('#regCont').children();
		for (var i=0; i<c.length; i++) c.eq(i).css("animation", "closeRegister 0.5s ease-in-out forwards");
		var self = this;

		//Build progress screen
		setTimeout(function() {
			$('#regCont').empty();

			//Decriptive text
			var t = document.createElement("div");
			t.setAttribute("id", "progText");
			t.innerHTML = "Getting ready...";
			$('#regCont').append(t);
			setTimeout(function() {$('#progText').css("opacity", "1");}, 100);

			//SVG container and gradient defs
			var svg = document.createElementNS(nS, "svg");
			svg.setAttribute("id", 'progSVG');
			svg.innerHTML = '<defs><linearGradient id="progGrad" x1="0" x2="1" y1="0" y2="0"><stop id="stop1" offset="50%"/><stop id="stop2" offset="100%"/></linearGradient><linearGradient id="windPatternGrad" x1="0" x2="1" y1="0" y2="0"><stop id="stop3" offset="0%"/><stop id="stop4" offset="50%"/><stop id="stop3" offset="100%"/></linearGradient></defs>';
			svg.innerHTML = svg.innerHTML+'</defs>';
			$('#regCont').append(svg);

			var w = parseFloat($('#progSVG').css("width"));
			var h = parseFloat($('#progSVG').css("height"));
			var x = w*0.2;

			//Wind animation
			for (var i=0; i<20; i++) {
				var x1 = Math.random()*(w*0.9-w*0.1)+w*0.1;
				var y1 = Math.random()*(h*0.9-h*0.1)+h*0.1; 
				var path = document.createElementNS(nS, "path");
				var d = "M "+x1+" "+y1+" L "+(x1+w*0.3)+" "+y1+" L" +(x1+w*0.3)+" "+(y1+1);
				path.setAttribute("class", "progWindPattern");
				path.setAttribute("d", d);
				svg.append(path);
				var delay = Math.random()*(2-0)+0; 
				path.style.animation = "windPattern 3s ease-in-out "+delay+"s infinite forwards";
			}

			//Build line
			var rect = document.createElementNS(nS, "rect");
			rect.setAttribute("id", "progLine");
			rect.setAttribute("x", x);
			rect.setAttribute("y", h*0.42);
			rect.setAttribute("width", 0);
			rect.setAttribute("height", h*0.01);
			rect.setAttribute("rx", 5);
			svg.append(rect);

			//Build circles and icons
			for (var i=0; i<3; i++) {
				var circle = document.createElementNS(nS, "circle");
				circle.setAttribute("class", "progCircle");
				circle.setAttribute("id", "progCircle"+i);
				circle.setAttribute("cx", x);
				circle.setAttribute("cy", h*0.42);
				svg.append(circle);

				var div = document.createElement("div");
				div.setAttribute("class", "progCircleIcon");
				div.setAttribute("id", "progCircleIcon"+i);
				div.style.marginLeft = 18+(27*i)+"%";
				$('#regCont').prepend(div);
				x += (w*0.6)/2;
			}
			$('#progCircleIcon0').css('background-image', 'url("../assets/icons/ip.svg');
			$('#progCircleIcon1').css('background-image', 'url("../assets/icons/key.svg');
			$('#progCircleIcon2').css('background-image', 'url("../assets/icons/user.svg');

			//Animate
			setTimeout(function() {self.increaseProgressBar();}, 2000);
			setTimeout(function() {self.increaseProgressBar();}, 5000);
			setTimeout(function() {self.increaseProgressBar();}, 8000);
			setTimeout(function() {self.increaseProgressBar();}, 11000);
		}, 500);
	}

	increaseProgressBar() {
		//At initial stage so show elements
		if (this.pairProgress==-1) {
			$("#progLine").css("opacity", "1");
			$(".progCircle").css("opacity", "1");
			$('.progCircleIcon').css("opacity", "1");
			$('.progWindPattern').css("opacity", "0.2");
			this.pairProgress++;
		}

		//Deal with circles and text
		for (var i=0; i<3; i++) {
			if (i==this.pairProgress) {
				$("#progCircle"+i).css("fill", "white");
				$("#progCircle"+i).css("r", "7%");
				if (i==2) $("#progCircleIcon"+i).css({"background-size":"55%", "filter":"invert(70%)"});
				else $("#progCircleIcon"+i).css({"background-size":"68%", "filter":"invert(70%)"});
			}
			else {
				$("#progCircle"+i).css("fill", "rgb(50, 50, 50)");
				$("#progCircle"+i).css("r", "4%");
				$("#progCircleIcon"+i).css({"background-size":"30%", "filter":"invert(20%)"});
			}
		}

		//Deal with descriptive text
		switch (this.pairProgress) {
			case 0: $('#progText').html("Contacting device..."); break;
			case 1: $('#progText').html("Checking credentials..."); break;
			case 2: $('#progText').html("Attaching to user..."); break;
			case 3: 
				$('#progText').html("Finishing...");
				//Close dialog
				self = this;
				setTimeout(function() {self.closeRegisterDialog();}, 1000);
				break;
		}

		//Deal with progress line
		if (this.pairProgress<3) {
			var w = parseFloat($('#progSVG').css("width"));
			$("#progLine").css("width", this.pairProgress*(w*0.3));
		}
		this.pairProgress++;
	}

	openRegisterHelp() {
		var message = "The new unit's ip address is located on the back of the SIM card.<br><br>The hardcoded pairing key can be found in the front of the setup guide or on a sticker inside the unit itself.";
		openHelp($('#regInfo').offset().left+($('#regInfo').width()/2), $('#regInfo').offset().top, message);
	}

	/*makeWindPath(x, y, w, h) {
		/*Remember - bezier curves in svg
		Q Control1 MidPoint T EndPoint (Control2 is implied)*/
		/*var d = "M "+(x-w)+" "+(y+h);
		d += " L "+(x+w*0.5)+" "+(y+h); //Start outside of box to add tail

		//Do semicircles for smaller and smaller radius's
		for (var i=0; i<1; i++) {
			//Do right semicircle on even and left semicircle on odd
			if (i%2==0) d += " Q "+(x+w)+" "+(y+h)+" "+(x+w)+" "+(y+h/2)+" T "+(x+w/2)+" "+y;
			else d += " Q "+x+" "+y+" "+x+" "+(y+h/2)+" T "+(x+w*0.5)+" "+(y+h);
			
			//Shrink only on even, before left circle
			if (i%2!=0) {
				x += w*0.4;
				y += h*0.4;
			}
			w *= 0.6;
			h *= 0.6;
		}
		return d;
	}*/

	animateEntrance(start) {
		setTimeout(removeLoading, start);
		var c = $('#uCont').children();

		for (var i=0; i<c.length; i++) {
			var c1 = c.eq(i).children();
			for (var z=0; z<c1.length; z++) {
				setTimeout(fadeIn, start, c1.eq(z));
				start += 50;
			}
		}
	}
}