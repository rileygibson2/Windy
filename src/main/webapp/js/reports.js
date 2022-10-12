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
		this.setupCheckBoxes();

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

	setupCheckBoxes() {
		var color = "rgb(180, 180, 180)";
		var parent = this;
		this.cb1 = new CheckBox(1, document.getElementById("rpCB1"), color, false);
		document.getElementById("rpCBCont1").addEventListener('click', function() {
			parent.cb1.toggleCheckBox();
		});
		this.cb2 = new CheckBox(2, document.getElementById("rpCB2"), color, false);
		document.getElementById("rpCBCont2").addEventListener('click', function() {
			parent.cb2.toggleCheckBox();
		});
		this.cb3 = new CheckBox(3, document.getElementById("rpCB3"), color, false);
		document.getElementById("rpCBCont3").addEventListener('click', function() {
			parent.cb3.toggleCheckBox();
		});
		this.cb4 = new CheckBox(4, document.getElementById("rpCB4"), color, false);
		document.getElementById("rpCBCont4").addEventListener('click', function() {
			parent.cb4.toggleCheckBox();
		});
		this.cb5 = new CheckBox(5, document.getElementById("rpCB5"), color, false);
		document.getElementById("rpCBCont5").addEventListener('click', function() {
			parent.cb5.toggleCheckBox();
		});
		this.cb6 = new CheckBox(6, document.getElementById("rpCB6"), color, false);
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
		//insertLoading(screen.width*0.75, screen.height*0.55, false);
		
		this.makeThumb(window);

	}

	animateEntrance(start) {
		setTimeout(removeLoading, start);
		setTimeout(fadeIn, start, $("#rpCont"));
	}

	makeThumb(page) {




	   //
  // If absolute URL from the remote server is provided, configure the CORS
  // header on that server.
  //
  const url = '"https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf"';

  //
  // The workerSrc property shall be specified.
  //
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    '../../node_modules/pdfjs-dist/build/pdf.worker.js';

  //
  // Asynchronous download PDF
  //
  const loadingTask = pdfjsLib.getDocument(url);
  (async () => {
    const pdf = await loadingTask.promise;
    //
    // Fetch the first page
    //
    const page = await pdf.getPage(1);
    const scale = 1.5;
    const viewport = page.getViewport({ scale });
    // Support HiDPI-screens.
    const outputScale = window.devicePixelRatio || 1;

    //
    // Prepare canvas using PDF page dimensions
    //
    const canvas = document.getElementById("rpFile");
    const context = canvas.getContext("2d");

    canvas.width = Math.floor(viewport.width * outputScale);
    canvas.height = Math.floor(viewport.height * outputScale);
    canvas.style.width = Math.floor(viewport.width) + "px";
    canvas.style.height = Math.floor(viewport.height) + "px";

    const transform = outputScale !== 1 
      ? [outputScale, 0, 0, outputScale, 0, 0] 
      : null;

    //
    // Render PDF page into canvas context
    //
    const renderContext = {
      canvasContext: context,
      transform,
      viewport,
    };
    page.render(renderContext);
  })();
	}

}