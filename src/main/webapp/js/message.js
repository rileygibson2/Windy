function insertMessage(message, mode) {
	//Block screen
	var blocker = document.createElement("div");
	blocker.id = "messageBlocker";
	$('body').append(blocker);

	//Message container
	var div = document.createElement("div");
	div.id = 'message';
	//Message text
	var p = document.createElement("p");
	p.id = 'messageT';
	p.innerHTML = message;
	div.append(p); 
	//Close button
	close = document.createElement("div");
	close.id = 'messageCloseIcon';
	div.append(close);
	//Icon
	icon = document.createElement("div");
	icon.id = 'messageIcon';
	if (mode==0) { //Bad message
		icon.style.backgroundImage = 'url("../assets/icons/warning.svg")';
	}
	else icon.style.backgroundImage = 'url("../assets/icons/tick.svg")';
	div.append(icon);

	//Event listeners
	close.addEventListener("click", removeMessage);
	blocker.addEventListener("click", removeMessage);
	$('body').append(div);

	setTimeout(function() {
		//Animate message in
		$('#message').css('top', '4vh');
		$('#messageBlocker').css('opacity', '0.6');
		
		//Blur stuff out
		$('#sc').css('filter', 'blur(10px)');
		$('#effCont').css('filter', 'blur(10px)');
		$('#sbCont').css('filter', 'blur(10px)');
		$('#sICont').css('filter', 'blur(10px)');
	}, 500);
}

function removeMessage() {
	//Animate out and remove 
	$('#message').css('top', '-7vh');
	$('#messageBlocker').css('opacity', '0');

	setTimeout(function() {
		$('#message').remove();
		$('#messageBlocker').remove();
	}, 1000);

	//Unblur stuff
	$('#sc').css('filter', 'none');
	$('#effCont').css('filter', 'none');
	$('#sbCont').css('filter', 'none');
	$('#sICont').css('filter', 'none');
}