class CheckBox {

	constructor(id, parent, color, implementToggle, name) {
		this.id = id;
		this.parent = document.getElementById(parent);
		this.isChecked = false;
		this.color = color;
		this.implementToggle = implementToggle;
		this.name = name;
		this.buildCheckBox();
	}

	buildCheckBox(listeningElement) {
		//Make SVG
		var svg = document.createElementNS(nS, "svg");
		svg.setAttribute("class", 'cbCont');
		svg.style.width = this.parent.offsetWidth+"px";
		svg.style.height = this.parent.offsetHeight+"px";
		var p = this;
		if (this.implementToggle) {
			svg.addEventListener('click', function() {
				p.toggleCheckBox();
			});
		}
		this.parent.append(svg);

		//Make outer circle
		var outer = document.createElementNS(nS, "circle");
		outer.setAttribute("class", 'cbOuterCircle');
		outer.style.stroke = this.color;
		svg.append(outer);

		//Make inner circle
		var inner = document.createElementNS(nS, "circle");
		inner.setAttribute("class", 'cbInnerCircle');
		inner.setAttribute("id", 'cbInnerCircle'+this.id);
		inner.style.fill = this.color;
		svg.append(inner);
	}

	setDependancy(dependancy) {
		this.dependancy = dependancy;
	}

	toggleCheckBox(ignoreDependants) {
		if (this.isChecked) $("#cbInnerCircle"+this.id).css("r", "0%");
		else $("#cbInnerCircle"+this.id).css("r", "35%");
		this.isChecked = !this.isChecked;

		if (this.dependancy!=undefined&&ignoreDependants==undefined) this.dependancy.enforceDependancy(this);
	}
}