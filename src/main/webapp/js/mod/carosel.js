class Carosel {

	constructor(scale, dotCont, start) {
		this.elements = [];
		this.current = 0;
		if (start!=undefined) this.current = start;
		this.scale = scale;
		this.dotCont = dotCont;
	}

	add(elem) {
		//Add element
		this.elements[this.elements.length] = elem;
		if (this.elements.length-1!=this.current) elem.style.transform = "scale("+this.scale+")";

		//Add dot
		if (this.dotCont!=undefined) {
			var d = document.createElement('div');
			d.className = 'caroselCircle';
			if (this.elements.length-1==this.current) d.className += " caroselCircleSelected";
			this.dotCont.append(d);
		}

		//Swipe listener
		var hammertime = new Hammer(elem);
		var parent = this;
		hammertime.on('swipe', function handler(ev) {
			parent.moveCarosel(ev, parent);
		});
	}

	moveCarosel(ev, c) {
		var dir = 0
		if (ev.direction==4) { //Swiped right
			if (c.current-1<0) return;
			dir = -1;
			
		}
		else if (ev.direction==2) { //Swiped left
			if (c.current+1>=c.elements.length) return;
			dir = 1;	
		}

		//Scaling
		c.elements[c.current].style.transform = "scale("+this.scale+")";
		c.elements[c.current+dir].style.transform = "scale(1)";
		
		//Shift all right
		var w = c.elements[c.current].offsetWidth;
		for (var i in c.elements) {
			var l = $('#'+c.elements[i].id).css("left");
			l = parseFloat(l.substr(0, l.length-2));
			$('#'+c.elements[i].id).css("left", (l+(w*-dir))+"px");
		}

		//Update dots
		c.dotCont.children().eq(c.current).removeClass('caroselCircleSelected');
		c.dotCont.children().eq(c.current+dir).addClass('caroselCircleSelected');

		c.current += dir;
	}
	
}