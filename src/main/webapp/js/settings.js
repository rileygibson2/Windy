var settingsTab; //Active settings tab
var setObj; //Loaded settings object

//Settings actions

function openSettings() {
	//Add styles
	var link = document.createElement('link');
	link.setAttribute('rel', 'stylesheet');
	link.setAttribute('href', '../styles/settings.css');
	document.head.appendChild(link);

	settingsTab = 0;

	//Get settings raw html
	var req = new XMLHttpRequest();
	req.open('GET', 'settings.html', true);
	req.onreadystatechange = function() {
		if (!checkResponse(req)) return;
		//Load into body
		$('body').append(req.responseText);

		//Get settings data
		responseRecieved = false;
		var reqD = new XMLHttpRequest();
		reqD.open('GET', 'data/?sK='+sessionKey+'&m=6&t='+Math.random(), true);
		reqD.onreadystatechange = function() {
			if (reqD.readyState!=4) return;
			responseRecieved = true;
			removeLoading();

			if (reqD.status==500) serverErrorResp();
			if (reqD.status==400) clientErrorResp();
			if (reqD.status==401) unauthorisedSettingsResponse();
			if (reqD.status==200) { //Authorised response
				var jArr = JSON.parse(reqD.responseText);
				implementSettingsData(jArr);
				addSettingsKeyListeners();
			}

			//Animate entrance in both cases
			if (reqD.status==401||reqD.status==200) {
				//Animate entrance - Take stuff out
				$('#sc').css({'filter':'blur(10px)', 'opacity':'0.2'});
				$('#effCont').css({'filter':'blur(10px)', 'opacity':'0.2'});
				$('#sbCont').css({'filter':'blur(10px)', 'opacity':'0.2'});
				$('#sICont').css({'filter':'blur(10px)', 'opacity':'0.2'});

				//Add settings container in
				$('#sCont').css("animation", "openSettings 0.8s ease-in-out forwards");
			}
		}
		reqD.send();

		//Initiate loading
		setTimeout(function() {if (!responseRecieved) insertLoading(screen.width/2, screen.height/2, false);}, loadingWait);
	}
	req.send();
}

function implementSettingsData(jArr) {
	var jObj = jArr[0];

	//Account tab data
	$('#sNumber').val(jObj.number);
	$('#sEmail').val(jObj.email);
	$('#sUsername').val(jObj.username);
	$('#sOrganisation').val(jObj.organisation);
	$('#sContactEmail').val(jObj.contactemail);

	//Units tab data
	$('#sLF').val(jObj.LF+" mins");
	$('#sPD').val(jObj.PD+"°");

	var i;
	for (i=1; i<jArr.length; i++) {
		//Check this obj has unit data
		jObj = jArr[i];
		if (jObj.desc!="unit") break;

		//Make row
		var tr = document.createElement("tr");
		tr.setAttribute("class", 'sTableRow');

		makeSettingsCell(false, jObj.id, tr);
		//Add other cells
		makeSettingsCell(true, jObj.name, tr);
		makeSettingsCell(false, jObj.ip, tr);
		makeSettingsCell(true, jObj.direction+"°", tr);
		makeSettingsCell(false, jObj.version, tr);

		$('#sUnitsTable').append(tr);
	}
	$('#sUnitsTable').append("<tr></tr>"); //Append dummy row

	//Users tab data
	for (; i<jArr.length; i++) {
		//Check this obj has child user data
		jObj = jArr[i];
		if (jObj.desc!="childuser") break;

		//Make row
		var tr = document.createElement("tr");
		tr.setAttribute("class", 'sTableRow');

		//Add account id and onto cell that has username for tying row back to account later
		var td = makeSettingsCell(true, jObj.username, tr);
		td.id = jObj.id;

		//Add other cells
		makeSettingsCellDropdown(tr, jObj.access, "employee", "observer", "test", "other test");
		makeSettingsCell(true, "", tr, "Enter new password");
		$('#sUsersTable').append(tr);
	}
	$('#sUsersTable').append("<tr></tr>"); //Append dummy row

	//Alerts tab data
	jObj = jArr[0];
	$('#sRAL').val(jObj.RAL+"km/h");
	$('#sAAL').val(jObj.AAL+"km/h");
	$('#sENF').val(jObj.ENF+" mins");

	//Numbers table
	var alertNumbers = jObj.alertNumbers.split(" ");
	for (var i=0; i<alertNumbers.length; i++) {
		//Make row and add cells
		var tr = document.createElement("tr");
		tr.setAttribute("class", 'sTableRow');
		tr.style.height = "4vh";
		makeSettingsCell(false, "+64", tr);
		makeSettingsCell(true, alertNumbers[i], tr);
		$('#sNumbersTable').append(tr);
	}
	$('#sNumbersTable').append("<tr></tr>"); //Append dummy row

	//Emails table
	var alertEmails = jObj.alertEmails.split(" ");
	for (var i=0; i<alertEmails.length; i++) {
		//Make row and add cells
		var tr = document.createElement("tr");
		tr.setAttribute("class", 'sTableRow');
		tr.style.height = "4vh";
		makeSettingsCell(true, alertEmails[i], tr);
		$('#sEmailsTable').append(tr);
	}
	$('#sEmailsTable').append("<tr></tr>"); //Append dummy row

	//Add table click listeners
	addSettingsTableListeners();
	setObj = jArr;
}

function addSettingsTableListeners() {
	//Add listeners so that row color changes when cell is selected
	$('.sTableDC').focus(function() {
    	$(this).parent().addClass('sTableRowFocus');
	});
	$('.sTableDC').blur(function() {
    	$(this).parent().removeClass('sTableRowFocus')
	});
	//Same for input cells
	$('.sTableDInput').focus(function() {
    	$(this).parent().parent().addClass('sTableRowFocus');
	});
	$('.sTableDInput').blur(function() {
    	$(this).parent().parent().removeClass('sTableRowFocus')
	});
	//Same for select cells
	$('.sTableDSelect').focus(function() {
    	$(this).parent().parent().addClass('sTableRowFocus');
	});
	$('.sTableDSelect').blur(function() {
    	$(this).parent().parent().removeClass('sTableRowFocus')
	});
}

function makeSettingsCell(isInput, value, parent, placeholder) {
	var td = document.createElement("td");
	td.setAttribute("class", 'sTableDC');
	td.tabIndex = "0";
	if (isInput) {
		var input = document.createElement("input");
		input.setAttribute("class", 'sTableDInput');
		input.type = "text";
		input.value = value;
		input.placeholder = placeholder;
		td.append(input);
	}
	else td.innerHTML = value;
	parent.append(td);

	return td;
}

function makeSettingsCellDropdown(parent, value, ...options) {
	//Cell
	var td = document.createElement("td");
	td.setAttribute("class", 'sTableDC');
	td.addEventListener('click', function() {loadDD(this, $("#sCont"), ...options);});
	td.innerHTML = value;
	td.value = value;
	parent.append(td);

	//Down arrow
	var a = document.createElement("div");
	a.setAttribute("class", 'sTableDSelectArrow');
	td.append(a);

  	return td;
}

function loadDD(elem, cont, ...options) { 
	//Make container and position
	var dd = document.createElement("div");
	dd.setAttribute("class", 'sTableDDCont');
	dd.style.width = elem.offsetWidth+"px";
	dd.style.height = (6*options.length)+"vh";
	dd.style.left = (elem.getBoundingClientRect().left-cont.offset().left)+"px";
	dd.style.top = (elem.getBoundingClientRect().top-cont.offset().top)+"px";

	//Make option nodes
	var i = 0;
	for (const option of options) {
    	var e = document.createElement("div");
		e.setAttribute("class", 'sTableDDElem');
		e.setAttribute("id", "dd"+option);
		if (i%2!=0) e.setAttribute("class", 'sTableDDElem sTableDDElemOdd');
		e.addEventListener('click', function() {
			elem.innerHTML = option;
			elem.value = option;

			//Add down arrow back in
			var a = document.createElement("div");
			a.setAttribute("class", 'sTableDSelectArrow');
			elem.append(a);
			closeDD(this.parentElement);
		});

		//Text inside option node
		var t = document.createElement("div");
		t.setAttribute("class", 'sTableDDElemText');
		t.innerHTML = option;
		e.append(t);
		dd.append(e);
		i++;
  	}
  	cont.append(dd);

  	//Add listener
  	//dd.addEventListener('mouseout', function() {closeDD(this);});

  	//Slide in
  	dd.style.top = (elem.getBoundingClientRect().top-cont.offset().top+elem.offsetHeight)+"px";
  	dd.style.opacity = 1;
}

function closeDD(dd) {
	dd.style.opacity = 0;
	setTimeout(function() {
		dd.remove();
	}, 200);
}

function addSettingsKeyListeners() {
	$('#sRAL').on("focusout", function() {formatSettingsInput('sRAL', 'km/h');});
	$('#sAAL').on("focusout", function() {formatSettingsInput('sAAL', 'km/h');});
	$('#sLF').on("focusout", function() {formatSettingsInput('sLF', ' mins');});
	$('#sPD').on("focusout", function() {formatSettingsInput('sPD', '°');});
	$('#sENF').on("focusout", function() {formatSettingsInput('sENF', ' mins');});
	$('#sNumber').on("focusout", function() {formatSettingsInput('sNumber', '');});
}

function unauthorisedSettingsResponse() {
	$('#sCont').empty(); //Empty settings

	//Add in close button
	var b = document.createElement("div");
	b.setAttribute("id", 'sCloseButton');
	b.style.height = "10%";
	b.addEventListener('click', function() {closeSettings();});
	$('#sCont').append(b);

	//Add in unauthorised text
	var t = document.createElement("div");
	t.setAttribute("id", 'sUnauthorisedT');
	t.innerHTML = "You are not authorised to access settings";
	$('#sCont').append(t);

	//Add in logout button
	var b = document.createElement("div");
	b.setAttribute("id", 'sLogoutUnauthorised');
	b.addEventListener('click', function() {logout();});
	t = document.createElement("div");
	t.setAttribute("class", 'sButtonT');
	t.innerHTML = "Logout";
	b.append(t);
	$('#sCont').append(b);
}

function switchSettingsTab(i) {
	//Title bar
	$("#sTBarN"+settingsTab).removeClass("sTBarNActive");
	$("#sTBarN"+i).addClass("sTBarNActive");

	//Content container
	$("#sTabCont"+settingsTab).css("display", "none");
	$("#sTabCont"+i).css("display", "block");
	settingsTab = i;
}

function closeSettings() {
	//Animate settings container out
	$('#sCont').css("animation", "closeSettings 0.8s ease-in-out forwards");
	
	//Bring stuff in
	$('#sc').css({'filter':'none', 'opacity':'1'});
	$('#effCont').css({'filter':'none', 'opacity':'1'});
	$('#sbCont').css({'filter':'none', 'opacity':'1'});
	$('#sICont').css({'filter':'none', 'opacity':'1'});

	setTimeout(function() { //Remove settings content
		$('#sCont').remove();
	}, 1000);
}

function formatSettingsInput(id, add) {
	$('#'+id).val($('#'+id).val().replace(/\D/g,''));
	//Add 0 if empty
	if ($('#'+id).val()=="") $('#'+id).val('0'+add);
	else $('#'+id).val($('#'+id).val()+add);
}

function postSettings() {
	//Update settings object with all data

	//Account data
	setObj[0].username = $('#sUsername').val();
	setObj[0].LF = $('#sLF').val().replace(/\D/g,'');
	setObj[0].organisation = $('#sOrganisation').val();
	setObj[0].contactemail = $('#sContactEmail').val();

	if ($('#sPassword').val()!="") { //Only if a new password has been entered
		//Generate salt
		var salt = "";
		for (var i=0; i<10; i++) salt += new String(Math.floor(Math.random()*(200-0)+0));
		setObj[0].password = hash($('#sPassword').val(), salt);
		setObj[0].salt = salt;
	}

	//Units data
	var rows = document.getElementById("sUnitsTable").rows;
	for (var i=1; i<rows.length-1; i++) {
		var cells = rows[i].cells;
		var id = cells[0].innerHTML; //Get id of unit from first cell
		var jObj = getObjectFromID(id); //Get relevant jObj from setObj array
		
		if (jObj!=null) {
			//Remove unessacary values
			delete jObj['version'];
			delete jObj['ip'];
			delete jObj['power'];
			delete jObj['status'];
			jObj.name = cells[1].firstChild.value;
			jObj.direction = cells[3].firstChild.value.substring(0, cells[3].firstChild.value.length-1);
			jObj.parsed = "1"; //Functional tag that will be removed before sending
		}
	}

	//Check for and tag removed units
	for (var z=0; z<setObj.length; z++) {
		if (setObj[z].desc=="unit") {
			if (setObj[z].parsed==undefined) {
				setObj[z].clienttag = "remove";
			}
		}
		delete setObj[z].parsed;
	}

	//Users data
	var rows = document.getElementById("sUsersTable").rows;
	for (var i=1; i<rows.length-1; i++) {
		var cells = rows[i].cells;
		var id = cells[0].id; //Get id of user from first cell
		var jObj = getObjectFromID(id); //Get relevant jObj from setObj array

		if (jObj!=null) {
			jObj.parent = setObj[0].username; //Update parent incase changed in settings
			jObj.username = cells[0].firstChild.value;
			jObj.access = cells[1].children[1].value;
			jObj.parsed = "1"; //Functional tag that will be removed before sending
		}
		else { //New user, need to add new jObj
			var jObj = {
				parent:setObj[0].username, 
				username:cells[0].firstChild.value,
				access:cells[1].children[1].value,
				password:cells[2].firstChild.value,
				desc:"childuser",
				clienttag:"add", //Tag so server knows what action to take
				parsed:"1" //Functional tag that will be removed before sending
			}
			setObj.push(jObj);
		}
	}

	//Check for and tag removed user
	for (var z=0; z<setObj.length; z++) {
		if (setObj[z].desc=="childuser") {
			if (setObj[z].parsed==undefined) {
				setObj[z].clienttag = "remove";
			}
		}
		delete setObj[z].parsed;
	}

	//Alert data
	setObj[0].RAL = $('#sRAL').val().replace(/\D/g,'');
	setObj[0].AAL = $('#sAAL').val().replace(/\D/g,'');
	setObj[0].ENF = $('#sENF').val().replace(/\D/g,'');

	var alertNumbers = "";
	var rows = document.getElementById("sNumbersTable").rows;
	for (var i=1; i<rows.length-1; i++) {
		var cells = rows[i].cells;
		//Make sure correct spacing so can be array parsed
		if (i>1) alertNumbers += " "+cells[1].firstChild.value;
		else alertNumbers += cells[1].firstChild.value;
	}	
	setObj[0].alertNumbers = alertNumbers;

	var alertEmails = "";
	var rows = document.getElementById("sEmailsTable").rows;
	for (var i=1; i<rows.length-1; i++) {
		var cells = rows[i].cells;
		//Make sure correct spacing so can be array parsed
		if (i>1) alertEmails += " "+cells[0].firstChild.value;
		else alertEmails += cells[0].firstChild.value;
	}	
	setObj[0].alertEmails = alertEmails;

	//Post data and close settings
	var user = setObj[0].username;
	var req = new XMLHttpRequest();
	req.open('POST', 'data/?sK='+sessionKey+'&m=1&user='+user+'&t='+Math.random(), true);
	req.setRequestHeader("Content-type", "application/json");
	req.onreadystatechange = function() {
		if (req.readyState!=4) return;
		if (req.status==200) insertMessage("Settings updated succesfully", 1);
		else insertMessage("There was an error updating settings", 0);
	}
	req.send(JSON.stringify(setObj));
	this.closeSettings();
}

//Gets the relevant object from the settings array
function getObjectFromID(id) {
	for (i=0; i<setObj.length; i++) {
		if (setObj[i].id==id) return setObj[i];
	}
	return null;
}

//Settings table add and remove actions

function addTableRow(i) {
	var elem; var tr;

	//Make new row and add cells
	switch (i) {
	case 1:
		elem = '#sNumbersTable';
		tr = document.createElement("tr");
		tr.setAttribute("class", 'sTableRow');
		tr.style.height = "4vh";
		makeSettingsCell(false, "+64", tr);
		makeSettingsCell(true, "", tr, "Enter phone number");
		break;
	case 2:
		elem = '#sEmailsTable';
		tr = document.createElement("tr");
		tr.setAttribute("class", 'sTableRow');
		tr.style.height = "4vh";
		makeSettingsCell(true, "", tr, "Enter email address");
		break;
	case 3:
		elem = '#sUsersTable';
		tr = document.createElement("tr");
		tr.setAttribute("class", 'sTableRow');
		makeSettingsCell(true, "", tr, "Enter new username");
		makeSettingsCellDropdown(tr, "employee", "observer", "test", "other test");
		makeSettingsCell(true, "", tr, "Enter new password");
		break;
	}

	$(elem+' tr:last').remove(); //Remove dummy row
	$(elem).append(tr); //Add new row
	$(elem).append("<tr></tr>"); //Add dummy row back in
	addSettingsTableListeners();
}

function checkTableRow(tableID) {
	//Idea is to go up parents until get to where table 
	//should be and check against given id

	//Get table row
	var tableRow = document.activeElement.parentElement;

	//Initial checks
	if (document.activeElement.tagName!=='TD'&&document.activeElement.tagName!=='INPUT') return;
	var numParents = 3;
	if (document.activeElement.tagName==='INPUT') {
		numParents = 4;
		tableRow = tableRow.parentElement;
	}
	
	//Get and check table
	var table = document.activeElement;
	for (var i=0; i<numParents; i++) table = table.parentElement;
	if (table.id!=tableID) return;

	//Add in correct dialog message
	if (tableID=="sUnitsTable") {
		insertDialog('Are you sure?', 'Removing this unit will mean having to re-pair it using the original pairing key. All logs associated with this unit will be deleted.', removeTableRow, tableRow);
		return;
	}
	if (tableID=="sUsersTable") {
		insertDialog('Are you sure?', 'Removing this user will mean that anyone currently using these credentials will no longer be able to access this service.', removeTableRow, tableRow);
		return;
	}
	else removeTableRow(tableRow) //No dialog
}

function removeTableRow(tableRow) { //Needed as a callback function
	tableRow.remove();
}