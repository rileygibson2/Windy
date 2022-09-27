function openCalander(elem, cont) {
	//Container
	var c = document.createElement("div");
	c.setAttribute("class", 'calCont');
	var elemL = (elem.getBoundingClientRect().left-cont.offset().left);
	var vw = window.innerWidth/100;
	c.style.left = elemL-(7.5*vw)+(elem.offsetWidth/2)+"px";
	c.style.top = (elem.getBoundingClientRect().top-cont.offset().top+elem.offsetHeight)+"px";
	cont.append(c);

	var w = 15*vw;
	var date = new Date();

	//Month year label;
	var myL = document.createElement("div");
	myL.setAttribute("id", 'calMonYearLabel');
	myL.value = 0;
	myL.innerHTML = date.toLocaleString('default', {month: 'long'})+" "+date.toLocaleString('default', {year: 'numeric'});
	myL.style.left = 0.06*w+"px";
	myL.style.top = 0.06*w+"px";
	c.append(myL);

	//Arrows
	var lArrow = document.createElement("div");
	lArrow.setAttribute("class", 'calArrow');
	lArrow.style.left = 0.75*w+"px";
	lArrow.style.top = 0.06*w+"px";
	lArrow.style.backgroundImage = "url('../assets/icons/leftarrow.svg')";
	lArrow.addEventListener('click', function() {
		$('#calMonYearLabel').val(parseInt($('#calMonYearLabel').val())-1);
		updateCalander();
	});
	c.append(lArrow);

	var rArrow = document.createElement("div");
	rArrow.setAttribute("class", 'calArrow');
	rArrow.style.left = 0.85*w+"px";
	rArrow.style.top = 0.06*w+"px";
	rArrow.style.backgroundImage = "url('../assets/icons/rightarrow.svg')";
	rArrow.addEventListener('click', function() {
		$('#calMonYearLabel').val(parseInt($('#calMonYearLabel').val())+1);
		updateCalander();
	});
	c.append(rArrow);

	//Day labels
	var days = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]
	for (var i=0; i<days.length; i++) {
		var dL = document.createElement("div");
		dL.setAttribute("class", 'calDayLabel');
		dL.innerHTML = days[i];
		dL.style.width = 0.128*w+"px";
		dL.style.left = (0.05*w)+i*(0.128*w+1)+"px";
		dL.style.top = 0.19*w+"px";
		c.append(dL);
	}

	//Days
	var count = 0;
	var row = 0;
	for (var i=1; i<=30; i++, count++) {
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
		d.addEventListener('click', function() {selectDayElem(this);});
		c.append(d);
	}

	//Add selected circle
	var svg = document.createElementNS(nS, "svg");
	svg.setAttribute("id", "calSelectSVG");
	svg.style.width = 0.128*w+"px";
	svg.style.height = 0.128*w+"px";
	var circle = document.createElementNS(nS, "circle");
	circle.setAttribute("id", "calSelectCircle");
	circle.setAttribute("r", 0.06*w+"px");
	circle.setAttribute("cx", "50%");
	circle.setAttribute("cy", "50%");
	svg.append(circle);
	c.append(svg);

	selectDayElem(document.getElementById("calDay"+new Date().getDate()));	
}

function selectDayElem(elem) {
	$('#calSelectSVG').css("left", elem.offsetLeft+"px");
	$('#calSelectSVG').css("top", (elem.offsetTop-(elem.offsetTop*0.04))+"px");
	//svg.style.top = 0.18*w+(row*(0.13*w))-(0.03*w)+"px";
}

function updateCalander() {
	alert($('#calMonYearLabel').val());
	var date = new Date();
	date.setMonth(date.getMonth()+$('#calMonYearLabel').val());
	$("#calMonYearLabel").html(date.toLocaleString('default', {month: 'long'})+" "+date.toLocaleString('default', {year: 'numeric'}));
}







