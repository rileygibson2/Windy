//Settings actions

function openSettings() {
	//Add styles
	var link = document.createElement('link');
	link.setAttribute('rel', 'stylesheet');
	link.setAttribute('href', '../styles/settings.css');
	document.head.appendChild(link);

	//Get settings raw html
	var req = new XMLHttpRequest();
	req.open('GET', 'settings.html', true);
	req.onreadystatechange = function() {
		if (!checkResponse(req)) return;
		//Load into body
		$('body').append(req.responseText);

		//Get settings data
		var reqD = new XMLHttpRequest();
		reqD.open('GET', 'data/?sK='+sessionKey+'&m=6&uID='+unit+'&t='+Math.random(), true);
		reqD.onreadystatechange = function() {
			if (!checkResponse(reqD)) return;
			var jObj = JSON.parse(reqD.responseText);

			//Load in settings data
			$('#sRAL').val(jObj.RAL+"km/h");
			$('#sAAL').val(jObj.AAL+"km/h");
			$('#sLF').val(jObj.LF+" mins");
			$('#sPD').val(jObj.PD+"°");
			$('#sNumber').val(jObj.number);
			$('#sEmail').val(jObj.email);
			$('#sENF').val(jObj.ENF+" mins");
			$('#sUsername').val(jObj.username);
			addKeyListenersSettings();

			//Animate entrance - Take stuff out
			$('#sc').css({'filter':'blur(10px)', 'opacity':'0.2'});
			$('#effCont').css({'filter':'blur(10px)', 'opacity':'0.2'});
			$('#sbCont').css({'filter':'blur(10px)', 'opacity':'0.2'});
			$('#sICont').css({'filter':'blur(10px)', 'opacity':'0.2'});

			//Add settings container in
			$('#sCont').css("animation", "openSettings 0.8s ease-in-out forwards");
		}
		reqD.send();
	}
	req.send();
}

function addKeyListenersSettings() {
	$('#sRAL').on("focusout", function() {formatSettingsInput('sRAL', 'km/h');});
	$('#sAAL').on("focusout", function() {formatSettingsInput('sAAL', 'km/h');});
	$('#sLF').on("focusout", function() {formatSettingsInput('sLF', ' mins');});
	$('#sPD').on("focusout", function() {formatSettingsInput('sPD', '°');});
	$('#sENF').on("focusout", function() {formatSettingsInput('sENF', ' mins');});
	$('#sNumber').on("focusout", function() {formatSettingsInput('sNumber', '');});
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
		data.password = hash($('#sPassword').val());
	}

	var req = new XMLHttpRequest(); //Fetch data
	req.open('POST', 'data/?sK='+sessionKey+'&m=1&uID='+unit+'&t='+Math.random(), true);
	req.setRequestHeader("Content-type", "application/json");
	req.onreadystatechange = function() {
		if (req.readyState!=4) return;
		if (req.status==200) {
			insertMessage("Settings updated succesfully", 1);
		}
		else {
			insertMessage("There was an error updating settings", 0);
		}
	}
	req.send(JSON.stringify(data));
	this.closeSettings();
}