//Settings actions
var settingsPage;

function openSettings() {
	//Add styles
	var link = document.createElement('link');
	link.setAttribute('rel', 'stylesheet');
	link.setAttribute('href', '../styles/settings.css');
	document.head.appendChild(link);

	settingsPage = 0;

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
			if (!checkResponse(reqD)) return;
			var jArr = JSON.parse(reqD.responseText);
			implementSettingsData(jArr);
			addSettingsKeyListeners();

			//Animate entrance - Take stuff out
			$('#sc').css({'filter':'blur(10px)', 'opacity':'0.2'});
			$('#effCont').css({'filter':'blur(10px)', 'opacity':'0.2'});
			$('#sbCont').css({'filter':'blur(10px)', 'opacity':'0.2'});
			$('#sICont').css({'filter':'blur(10px)', 'opacity':'0.2'});

			//Add settings container in
			$('#sCont').css("animation", "openSettings 0.8s ease-in-out forwards");
		}
		reqD.send();

		//Initiate loading
		setTimeout(function() {if (!responseRecieved) insertLoading(screen.width/2, screen.height/2, false);}, loadingWait);
	}
	req.send();
}

function implementSettingsData(jArr) {
	//Load in account data
	var jObj = jArr[0];
	$('#sRAL').val(jObj.RAL+"km/h");
	$('#sAAL').val(jObj.AAL+"km/h");
	$('#sLF').val(jObj.LF+" mins");
	$('#sPD').val(jObj.PD+"°");
	$('#sNumber').val(jObj.number);
	$('#sEmail').val(jObj.email);
	$('#sENF').val(jObj.ENF+" mins");
	$('#sUsername').val(jObj.username);

	//Load in units data
	for (var i=1; i<jArr.length; i++) {
		jObj = jArr[i];
		//Make row
		var tr = document.createElement("tr");
		tr.setAttribute("class", 'sTableRow');
		//Add cells
		makeSettingsCell(false, jObj.unit, tr);
		makeSettingsCell(true, jObj.name, tr);
		makeSettingsCell(false, jObj.ip, tr);
		makeSettingsCell(true, jObj.direction+"°", tr);
		makeSettingsCell(false, jObj.version, tr);

		$('#sUnitsTable').append(tr);
	}

	//Append dummy row
	$('#sUnitsTable').append("<tr></tr>");
}

function makeSettingsCell(isInput, value, parent) {
	var td = document.createElement("td");
	td.setAttribute("class", 'sTableDC');
	td.tabIndex = "0";
	if (isInput) {
		var input = document.createElement("input");
		input.setAttribute("class", 'sTableDInput');
		input.type = "text";
		input.value = value;
		td.append(input);
	}
	else td.innerHTML = value;
	parent.append(td);
}

function addSettingsKeyListeners() {
	$('#sRAL').on("focusout", function() {formatSettingsInput('sRAL', 'km/h');});
	$('#sAAL').on("focusout", function() {formatSettingsInput('sAAL', 'km/h');});
	$('#sLF').on("focusout", function() {formatSettingsInput('sLF', ' mins');});
	$('#sPD').on("focusout", function() {formatSettingsInput('sPD', '°');});
	$('#sENF').on("focusout", function() {formatSettingsInput('sENF', ' mins');});
	$('#sNumber').on("focusout", function() {formatSettingsInput('sNumber', '');});
}

function switchSettingsPage(i) {
	//Title bar
	$("#sTBarN"+settingsPage).removeClass("sTBarNActive");
	$("#sTBarN"+i).addClass("sTBarNActive");

	//Content container
	$("#sPageCont"+settingsPage).css("display", "none");
	$("#sPageCont"+i).css("display", "block");
	settingsPage = i;
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
	//Format data in JSON
	var data = {
		RAL:$('#sRAL').val().replace(/\D/g,''),
		AAL:$('#sAAL').val().replace(/\D/g,''),
		LF:$('#sLF').val().replace(/\D/g,''),
		PD:$('#sPD').val().replace(/\D/g,''),
		number:$('#sNumber').val().replace(/\D/g,''),
		email:$('#sEmail').val(),
		ENF:$('#sENF').val().replace(/\D/g,''),
		username:$('#sUsername').val(),
	}

	if ($('#sPassword').val()!="") { //Only if a new password has been entered
		//Generate salt
		var salt = "";
		for (var i=0; i<10; i++) salt += new String(Math.floor(Math.random()*(200-0)+0));
		data.password = hash($('#sPassword').val(), salt);
		data.salt = salt;
	}

	var req = new XMLHttpRequest(); //Post data
	req.open('POST', 'data/?sK='+sessionKey+'&m=1&t='+Math.random(), true);
	req.setRequestHeader("Content-type", "application/json");
	req.onreadystatechange = function() {
		if (req.readyState!=4) return;
		if (req.status==200) insertMessage("Settings updated succesfully", 1);
		else insertMessage("There was an error updating settings", 0);
	}
	req.send(JSON.stringify(data));
	this.closeSettings();
}