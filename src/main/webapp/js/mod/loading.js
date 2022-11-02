var lW = 100;
var r1 = lW/2;
var r2 = lW/3;
var fS;

function insertLoading(x, y, fullscreen) {
	fS = fullscreen;
	if (fS) { //Add screen blocker if fullscreen
		var blocker = document.createElement("div");
		blocker.id = "loadingBlocker";
		$('body').append(blocker);
	}

	//Initialise svg
	var svg = document.createElementNS(nS, "svg");
	svg.id = 'loadingSVG';
	svg.style.width = lW+'px';
	svg.style.height = lW+'px';
	svg.style.marginLeft = (x-(lW/2))+'px';
	svg.style.marginTop = (y-(lW/2))+'px';

	//Outer circle
	var circle = document.createElementNS(nS, "circle");
	circle.setAttribute('class', 'circle');
	circle.setAttribute('r', r1);
	circle.setAttribute('cx', lW/2);
	circle.setAttribute('cy', lW/2);
	circle.setAttribute('stroke-width', lW*0.05);
	circle.setAttribute('stroke-dashoffset', lW*8);
	circle.setAttribute('stroke-dasharray', lW*0.8);
	circle.style.animation = 'rotate1 1.6s linear forwards infinite';
	svg.appendChild(circle);

	//Inner circle
	var circle = document.createElementNS(nS, "circle");
	circle.setAttribute('class', 'circle');
	circle.setAttribute('r', r2);
	circle.setAttribute('cx', lW/2);
	circle.setAttribute('cy', lW/2);
	circle.setAttribute('stroke-width', lW*0.05);
	circle.setAttribute('stroke-dashoffset', lW*8.5);
	circle.setAttribute('stroke-dasharray', lW*2);
	circle.style.animation = 'rotate2 1s linear forwards infinite';
	svg.appendChild(circle);

	//Inner circle
	var circle = document.createElementNS(nS, "circle");
	circle.setAttribute('class', 'circle');
	circle.setAttribute('r', r2/2);
	circle.setAttribute('cx', lW/2);
	circle.setAttribute('cy', lW/2);
	circle.setAttribute('stroke-width', lW*0.05);
	circle.setAttribute('stroke-dashoffset', lW*9.2);
	circle.setAttribute('stroke-dasharray', lW*2);
	circle.style.animation = 'rotate1 1.8s linear forwards infinite';
	svg.appendChild(circle);

	//Finish
	$('body').append(svg);
}

function removeLoading() {
	$('#loadingSVG').remove();
	if (fS) $('#loadingBlocker').remove();
}