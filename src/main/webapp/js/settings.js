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
		if (req.readyState!=4&&req.status!=4) return;
		//Load into body
		$('body').append(req.responseText);

		//Get settings data
		var reqD = new XMLHttpRequest();
		reqD.open('GET', 'data/?m=6&uID='+unit+'&t='+Math.random(), true);
		reqD.onreadystatechange = function() {
			if (reqD.readyState!=4&&reqD.status!=4) return;
			var jObj = JSON.parse(reqD.responseText);

			//Load in settings data
			$('#sRAL').val(jObj.RAL+"km/h");
			$('#sAAL').val(jObj.AAL+"km/h");
			$('#sLF').val(jObj["Logging Frequency"]+" mins");
			$('#sPD').val(jObj["Preset Direction"]+"°");
			$('#sNumber').val(jObj.Number);
			$('#sEmail').val(jObj.Email);
			$('#sENF').val(jObj.ENF+" mins");
			$('#sUsername').val(jObj.Unit);
			$('#sPassword').val(jObj.Password);

			//Animate entrance - Take stuff out
			$('#sc').css({'filter':'blur(10px)', 'opacity':'0.2'});
			$('#effCont').css({'filter':'blur(10px)', 'opacity':'0.2'});
			$('#sbCont').css({'filter':'blur(10px)', 'opacity':'0.2'});

			//Add settings container in
			$('#sCont').css("animation", "openSettings 1s ease-in-out forwards");
		}
		reqD.send();
	}
	req.send();
}

function closeSettings() {
	//Bring stuff in
	$('#sc').css({'filter':'none', 'opacity':'1'});
	$('#effCont').css({'filter':'none', 'opacity':'1'});
	$('#sbCont').css({'filter':'none', 'opacity':'1'});

	//Animate settings container out
	$('#sCont').css("animation", "closeSettings 1s ease-in-out forwards");
	setTimeout(function() { //Remove settings content
		$('#sCont').remove();
	}, 1000);
}

function postSettings() {
	//Format data in JSON
	var data = {
		RAL:$('#sRAL').val(),
		AAL:$('#sAAL').val(),
		LF:$('#sLF').val(),
		PD:$('#sPD').val(),
		number:$('#sNumber').val(),
		email:$('#sEmail').val(),
		ENF:$('#sENF').val(),
		username:$('#sUsername').val(),
		password:$('#sPassword').val()
	}

	var req = new XMLHttpRequest(); //Fetch data
	req.open('POST', 'data/?m=1&t='+Math.random(), true);
	req.setRequestHeader("Content-type", "application/json");
	req.onreadystatechange = function() {
		if (req.readyState==4&&req.status==200) {
			insertMessage("Settings updated succesfully", 1);
		}
	}
	req.send(JSON.stringify(data));
	this.closeSettings();
}