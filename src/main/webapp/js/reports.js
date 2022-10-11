class ReportsPage extends Page {

	constructor(contentName) {
		super(contentName);

		//Add styles
		var link = document.createElement('link');
		link.setAttribute('rel', 'stylesheet');
		link.setAttribute('href', '../styles/reports.css');
		document.head.appendChild(link);
	}

	//Required actions
	updatePageData() {
		this.setupCalenders();
		var self = this;
		responseRecieved = false;

		let promise = new Promise(function (resolve, reject) {
			resolve();
		});
		return promise;
	}

	setupCalenders() {
		var elem1 = document.getElementById("rpDate1");
		var elem2 = document.getElementById("rpDate2");
		var parent = this;
		this.c1 = new Calender(elem1, $('#rpCont'), page.updateDateText1);
		this.c2 = new Calender(elem2, $('#rpCont'), page.updateDateText2);

		elem1.addEventListener('click', function() {parent.c1.openCalander();});
		elem2.addEventListener('click', function() {parent.c2.openCalander();});
	}

	updateDateText1(date) {
		if (date==undefined) return;
		$("#rpDateText1").html(date.getDate()+" "+date.toLocaleString('default', {month: 'short'})+" "+date.toLocaleString('default', {year: 'numeric'}));
	}

	updateDateText2(date) {
		if (date==undefined) return;
		$("#rpDateText2").html(date.getDate()+" "+date.toLocaleString('default', {month: 'short'})+" "+date.toLocaleString('default', {year: 'numeric'}));
	}

	animateEntrance(start) {
		setTimeout(removeLoading, start);
		setTimeout(fadeIn, start, $("#rpCont"));
	}

}