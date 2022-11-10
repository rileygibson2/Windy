function insertMessage(message, iconCode, blockScreen, time) {
	if (blockScreen) {
		//Block screen
		var blocker = document.createElement("div");
		blocker.id = "messageBlocker";
		$('body').append(blocker);
		blocker.addEventListener("click", removeMessage);
	}
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
	if (iconCode==0) {
		icon.style.backgroundImage = 'url("../assets/icons/warning.svg")';
	}
	else icon.style.backgroundImage = 'url("../assets/icons/tick.svg")';
	div.append(icon);

	//Event listeners
	close.addEventListener("click", removeMessage);
	$('body').append(div);

	//Animate message in
	setTimeout(function() {
		$('#message').css('top', '4vh');
	}, 500);

	//Blur stuff out
	if (blockScreen) {
		setTimeout(function() {
			$('#messageBlocker').css('opacity', '0.6');
			blurComponents();
		}, 500);
	}

	//Remove timer
	if (time==undefined) time = 5000;
	setTimeout(function() {removeMessage();}, 5000);
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
	unblurComponents();
}