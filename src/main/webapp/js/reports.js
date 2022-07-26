class ReportsPage extends Page {

	constructor() {
		super("Reports", "reports");

		//Add styles
		var link = document.createElement('link');
		link.setAttribute('rel', 'stylesheet');
		link.setAttribute('href', '../styles/reports.css');
		document.head.appendChild(link);

		this.files = new Array();
		this.currentFile = 0;
	}

	//Required actions
	updatePageData() {
		this.setupCalenders();
		this.setupCheckBoxes();

		var self = this;
		responseRecieved = false;

		let promise = new Promise(function (resolve, reject) {
			resolve();
		});
		return promise;
	}

	recieveData(req) {
		var jObj = JSON.parse(req.responseText);
		this.files.push([jObj["pdf"], jObj["thumbnail"]]);
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

	setupCheckBoxes() {
		var color = "rgb(180, 180, 180)";
		var parent = this;
		this.cb1 = new CheckBox(1, "rpCB1", color, false);
		document.getElementById("rpCBCont1").addEventListener('click', function() {
			parent.cb1.toggleCheckBox();
		});
		this.cb2 = new CheckBox(2, "rpCB2", color, false);
		document.getElementById("rpCBCont2").addEventListener('click', function() {
			parent.cb2.toggleCheckBox();
		});
		this.cb3 = new CheckBox(3, "rpCB3", color, false);
		document.getElementById("rpCBCont3").addEventListener('click', function() {
			parent.cb3.toggleCheckBox();
		});
		this.cb4 = new CheckBox(4, "rpCB4", color, false);
		document.getElementById("rpCBCont4").addEventListener('click', function() {
			parent.cb4.toggleCheckBox();
		});
		this.cb5 = new CheckBox(5, "rpCB5", color, false);
		document.getElementById("rpCBCont5").addEventListener('click', function() {
			parent.cb5.toggleCheckBox();
		});
		this.cb6 = new CheckBox(6, "rpCB6", color, false);
		document.getElementById("rpCBCont6").addEventListener('click', function() {
			parent.cb6.toggleCheckBox();
		});
	}

	updateDateText1(date) {
		page.updateDateText(date, 1);
	}

	updateDateText2(date) {
		page.updateDateText(date, 2);
	}

	updateDateText(date, i) {
		if (date==undefined) return;
		//Date
		$("#rpDateText"+i).html(date.getDate()+" "+date.toLocaleString('default', {month: 'short'})+" "+date.toLocaleString('default', {year: 'numeric'}));
		//Time
		var h = date.getHours().toString();
		var m = date.getMinutes().toString();
		var ap = "am";
		if (h>12) {
			h -= 12;
			ap = "pm";
		}
		if (h==0) h = 12;

		if (m.length==1) m = "0"+m;
		$("#rpTimeText"+i).html(h+":"+m+" "+ap);
	}

	generateReport() {
		insertLoading(screen.width*0.75, screen.height*0.55, false);

		let promise = new Promise(function (resolve, reject) {
			var req = new XMLHttpRequest(); //Fetch data
			req.open('GET', 'data/?sK='+sessionKey+'&m=10&t='+Math.random(), true);
			req.onreadystatechange = function() {
				if (checkResponse(req)) {
					page.recieveData(req);
					resolve();
				}
			}
			req.send();

			//Initiate loading
			setTimeout(function() {if (!responseRecieved) insertLoading(screen.width/2, screen.height/2, false);}, loadingWait);
		});

		promise.then(function() {
			setTimeout(function() {
				removeLoading();
				//Shift all the way to right
				for (var i=page.currentFile; i<page.files.length; i++) {
					page.shiftFilesRight();
				}
				//Shift one more to get a clean space 
				if (page.files>0) {
					$("#rpFC"+(page.files.length-1)).attr('class', 'rpFileCont rpFileContLeft');
					page.currentFile++;
				}

				page.makeFile(page.files.length);
				if (page.files.length==2) page.showControls();
				if (page.files.length==1) {
					$("#rpDownloadButton").css("display", "block");
					$("#rpNoFilesText").remove();
				}
			}, 500);
		});

	}

	makeFile(i) {
		var parent = $("#rpCont");
		//File stuff container
		var c = document.createElement("div");
		c.className = "rpFileCont rpFileContCenter";
		c.id = "rpFC"+i;
		parent.append(c);

		//File text container
		var tc = document.createElement("div");
		tc.className = "rpFileTextCont";
		tc.id = "rpTC"+i;
		c.append(tc);

		//File text
		var tx = document.createElement("div");
		tx.className = "rpFileText";
		tx.innerHTML = "windy321-report.pdf";
		tc.append(tx);

		tx = document.createElement("div");
		tx.className = "rpFileText";
		tx.innerHTML = "3 Pages";
		tc.append(tx);

		tx = document.createElement("div");
		tx.className = "rpFileText";
		tx.innerHTML = "288 megabytes";
		tc.append(tx);

		tx = document.createElement("div");
		tx.className = "rpFileText";
		tx.innerHTML = "6:31 PM "+i;
		tc.append(tx);

		//Divider
		var dv = document.createElement("div");
		dv.className = "rpFileDivider";
		c.append(dv);

		//File thumbnail
		var f = document.createElement("div");
		f.className = "rpFile";
		f.id = "rpFile"+i;
		alert(page.files[page.files.length-1][1]);
		f.style.backgroundImage = "url("+page.files[page.files.length-1][1]+")";
		c.append(f);

		//Dot
		var d = document.createElement("div");
		d.className = "rpFileDot";
		d.id = "rpFileDot"+i;
		if (page.files.length==0) d.style.marginLeft = "0";
		document.getElementById("rpFileDotCont").append(d);

		//Adjust dot container position
		if (page.files.length>0) {
			var l = $("#rpFileDotCont").offset().left-(0.875*(window.innerWidth/100));
			$("#rpFileDotCont").css('margin-left', l+"px")
		}

		//Reselect dot
		$("#rpFileDot"+(page.files.length-2)).css("opacity", "0.5");
		$("#rpFileDot"+(page.files.length-1)).css("opacity", "1");		

		return c;
	}

	shiftFilesRight() {
		if (this.currentFile+1<this.files.length) {
			$("#rpFC"+this.currentFile).attr('class', 'rpFileCont rpFileContLeft');
			$("#rpFileDot"+this.currentFile).css("opacity", "0.5");
			this.currentFile++;
			$("#rpFC"+this.currentFile).attr('class', 'rpFileCont rpFileContCenter');
			$("#rpFileDot"+this.currentFile).css("opacity", "1");
		}
	}

	shiftFilesLeft() {
		if (this.currentFile-1>=0) {
			$("#rpFC"+this.currentFile).attr('class', 'rpFileCont rpFileContRight');
			$("#rpFileDot"+this.currentFile).css("opacity", "0.5");
			this.currentFile--;
			$("#rpFC"+this.currentFile).attr('class', 'rpFileCont rpFileContCenter');
			$("#rpFileDot"+this.currentFile).css("opacity", "1");
		}
	}

	showControls() {
		$("#rpFileRB").css("display", "block");
		$("#rpFileLB").css("display", "block");
	}

	expandDownload() {
		$("#rpDownloadButton").css("opacity", "1");
		$("#rpDownloadCont").css({
			"opacity":"1",
			"margin-left":"85vw",
			"width":"11vw"
		});
	}

	collapseDownload() {
		$("#rpDownloadButton").css("opacity", "0.5");
		$("#rpDownloadCont").css({
			"opacity":"0",
			"margin-left":"93vw",
			"width":"3vw"
		});
	}

	downloadFile() {
		var a = document.createElement("a");
		a.href = "../assets/pdfs/aa.pdf";
		a.download = "myaa.pdf";
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
	}

	animateEntrance(start) {
		setTimeout(removeLoading, start);
		setTimeout(fadeIn, start, $("#rpCont"));
	}
}