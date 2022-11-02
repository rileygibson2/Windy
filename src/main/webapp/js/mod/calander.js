class Calender {

	constructor(e, c, uC) {
		this.elem = e;
		this.updateCallback = uC;
		this.cont = c;
		this.timeMode = 0;
		var wVW = 20;
		var vw = window.innerWidth/100;
		this.w = wVW*vw;
		this.selectedDate = new Date();
		var isOpen = false;
	}

	openCalander() {
		if (this.isOpen) return;
		this.isOpen = true;
		var wVW = 20;
		var vw = window.innerWidth/100;
		var parent = this;

		//Blocker
		var b = document.createElement("div");
		b.setAttribute("id", 'calBlocker');
		b.addEventListener('click', function() {parent.destroyCalander()});
		this.cont.append(b);

		//Container
		var c = document.createElement("div");
		c.setAttribute("id", 'calCont');
		var elemL = (this.elem.getBoundingClientRect().left-this.cont.offset().left);
		c.style.left = elemL-((wVW/2)*vw)+(this.elem.offsetWidth/2)+"px";
		c.style.top = (this.elem.getBoundingClientRect().top-this.cont.offset().top+this.elem.offsetHeight)+"px";
		c.style.width = wVW+"vw";
		c.style.height = wVW+"vw";
		this.cont.append(c);

		//Month year label;
		var myL = document.createElement("div");
		myL.setAttribute("id", 'calMonYearLabel');
		myL.value = 0;
		myL.style.left = 0.06*this.w+"px";
		myL.style.top = 0.06*this.w+"px";
		c.append(myL);

		//Arrows
		var lArrow = document.createElement("div");
		lArrow.setAttribute("class", 'calArrow');
		lArrow.style.left = 0.75*this.w+"px";
		lArrow.style.top = 0.06*this.w+"px";
		lArrow.style.backgroundImage = "url('../assets/icons/leftarrow.svg')";
		lArrow.addEventListener('click', function() {
			$('#calMonYearLabel').val(parseInt($('#calMonYearLabel').val())-1);
			parent.updateCalander();
		});
		c.append(lArrow);

		var rArrow = document.createElement("div");
		rArrow.setAttribute("class", 'calArrow');
		rArrow.style.left = 0.85*this.w+"px";
		rArrow.style.top = 0.06*this.w+"px";
		rArrow.style.backgroundImage = "url('../assets/icons/rightarrow.svg')";
		rArrow.addEventListener('click', function() {
			$('#calMonYearLabel').val(parseInt($('#calMonYearLabel').val())+1);
			parent.updateCalander();
		});
		c.append(rArrow);

		//Day labels
		var days = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]
		for (var i=0; i<days.length; i++) {
			var dL = document.createElement("div");
			dL.setAttribute("class", 'calDayLabel');
			dL.innerHTML = days[i];
			dL.style.width = 0.128*this.w+"px";
			dL.style.left = (0.05*this.w)+i*(0.128*this.w+1)+"px";
			dL.style.top = 0.19*this.w+"px";
			c.append(dL);
		}

		//Selected circle
		var svg = document.createElementNS(nS, "svg");
		svg.setAttribute("id", "calSelectSVG");
		svg.style.width = 0.128*this.w+"px";
		svg.style.height = 0.128*this.w+"px";
		var circle = document.createElementNS(nS, "circle");
		circle.setAttribute("id", "calSelectCircle");
		circle.setAttribute("r", 0.06*this.w+"px");
		circle.setAttribute("cx", "50%");
		circle.setAttribute("cy", "50%");
		svg.append(circle);
		c.append(svg);

		//Time label
		var tL = document.createElement("div");
		tL.setAttribute("class", 'calTimeLabel');
		tL.innerHTML = "Time";
		tL.style.left = 0.06*this.w+"px";
		tL.style.top = 0.87*this.w+"px";
		c.append(tL);

		//TIme cont
		var tC = document.createElement("div");
		tC.setAttribute("class", 'calTimeSliderCont');
		tC.style.left = 0.45*this.w+"px";
		tC.style.top = 0.85*this.w+"px";
		tC.style.width = 0.22*this.w+"px";
		tC.style.height = 0.11*this.w+"px";
		c.append(tC);

		//Time colon
		var tCol = document.createElement("div");
		tCol.setAttribute("class", 'calTimeColon');
		tCol.innerHTML = ":";
		tC.append(tCol);

		//Time inputs
		var hI = document.createElement("input");
		hI.setAttribute("class", 'calTimeInput');
		hI.setAttribute("id", 'calTimeHourInput');
		hI.type = "text";
		hI.value = this.selectedDate.getHours();
		if (this.selectedDate.getHours()>12) hI.value =  this.selectedDate.getHours()-12;
		if (this.selectedDate.getHours()==0) hI.value = 12;
		hI.addEventListener('focusout', function() {parent.selectTime();});
		tC.append(hI);
		var mI = document.createElement("input");
		mI.setAttribute("class", 'calTimeInput');
		mI.setAttribute("id", 'calTimeMinuteInput');
		mI.type = "text";
		mI.value = this.selectedDate.getMinutes();
		mI.addEventListener('focusout', function() {parent.selectTime();});
		tC.append(mI);

		//AM PM slider cont
		var tS = document.createElement("div");
		tS.setAttribute("class", 'calTimeSliderCont');
		tS.style.left = 0.70*this.w+"px";
		tS.style.top = 0.86*this.w+"px";
		tS.style.width = 0.25*this.w+"px";
		tS.style.height = 0.09*this.w+"px";
		c.append(tS);

		//AM PM sliding element
		var tSE = document.createElement("div");
		tSE.setAttribute("id", 'callTimeSlidingElem');
		tSE.style.left = 0.705*this.w+"px";
		tSE.style.top = 0.86*this.w+"px";
		tSE.style.width = 0.115*this.w+"px";
		tSE.style.height = 0.09*this.w+"px";
		c.append(tSE);

		//AM PM text
		var am = document.createElement("div");
		am.setAttribute("class", 'calTimeSliderText');
		am.innerHTML = "AM";
		tS.append(am);
		am.addEventListener('click', function() {parent.switchTimeMode();});
		var pm = document.createElement("div");
		pm.setAttribute("class", 'calTimeSliderText');
		pm.innerHTML = "PM";
		pm.addEventListener('click', function() {parent.switchTimeMode();});
		tS.append(pm);

		this.timeMode = 0;
		if (this.selectedDate.getHours()>12) this.switchTimeMode();
		this.updateCalander();
		this.selectDayElem(document.getElementById("calDay"+this.selectedDate.getDate()), this);	
	}

	destroyCalander() {
		$("#calCont").remove();
		$("#calBlocker").remove();
		this.isOpen = false;
	}

	selectDayElem(elem, parent) {
		//Update select svg
		$('#calSelectSVG').css("left", elem.offsetLeft+"px");
		$('#calSelectSVG').css("top", (elem.offsetTop-(elem.offsetTop*0.04))+"px");
		$("#calSelectSVG").css("display", "block");

		//Update stored date
		var newD = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
		newD.setHours(parent.selectedDate.getHours(), parent.selectedDate.getMinutes());
		newD.setMonth(parent.selectedDate.getMonth()+parseInt($('#calMonYearLabel').val()));
		newD.setDate(parseInt(elem.id.substring(6, elem.id.length)));
		parent.selectedDate = newD;

		this.updateCallback(parent.selectedDate);
	}

	selectTime() {
		//Validate input
		var h = parseInt($('#calTimeHourInput').val());
		var m = parseInt($('#calTimeMinuteInput').val());
		if (h==NaN||h>12||h<=0||$('#calTimeHourInput').val().match(/[^$,.\d]/)) {
			$('#calTimeHourInput').val('12');
			h = 12;
		}
		if (m==NaN||m<0||m>60||$('#calTimeMinuteInput').val().match(/[^$,.\d]/)) {
			$('#calTimeMinuteInput').val('00');
			m = 0;
		}
		if (this.timeMode==0&&h==12) {
			h = 0;
		}
		else if (this.timeMode==1) h += 12;

		//Add leading zeros
		if (m/10<1) $('#calTimeMinuteInput').val('0'+m);

		//Update date
		this.selectedDate.setHours(h, m);
		this.updateCallback(this.selectedDate);
	}

	updateCalander() {
		//Setup
		var vw = window.innerWidth/100;
		var w = 20*vw;
		var date = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
		date.setMonth(date.getMonth()+parseInt($('#calMonYearLabel').val()));
		
		//Update month year label
		$("#calMonYearLabel").html(date.toLocaleString('default', {month: 'long'})+" "+date.toLocaleString('default', {year: 'numeric'}));

		//Remove old days
		const days = document.querySelectorAll('.calDay');
		days.forEach(day => {day.remove();});

		//Update days
		var month = date.getMonth();
		var dIM = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

		var count = date.getDay()-1; //Day of week that is 1st of month
		if (count==-1) count = 6;
		var row = 0;
		for (var i=1; i<=dIM[month]; i++, count++) {
			if (count>=7) {
				count = 0;
				row++;
			}

			var d = document.createElement("div");
			d.setAttribute("class", 'calDay');
			d.setAttribute("id", 'calDay'+i);
			d.innerHTML = i;
			d.style.width = 0.128*w+"px";
			d.style.left = (0.05*w)+count*(0.128*w+1)+"px";
			d.style.top = 0.27*w+(row*(0.12*w))+"px";
			var parent = this;
			d.addEventListener('click', function() {parent.selectDayElem(this, parent);});
			$("#calCont").append(d);
		}

		//Update selected day
		if (this.selectedDate==undefined) return;
		if (date.getMonth()==this.selectedDate.getMonth()&&date.getFullYear()==this.selectedDate.getFullYear()) {
			$("#calSelectSVG").css("display", "block");
		}
		else $("#calSelectSVG").css("display", "none");
	}

	switchTimeMode() {
		if (this.timeMode==0) {
			this.timeMode = 1;
			$('#callTimeSlidingElem').css('left', 0.830*this.w+"px");
		}
		else {
			this.timeMode = 0;
			$('#callTimeSlidingElem').css('left', 0.705*this.w+"px");
		}
		this.selectTime();
	}
}







