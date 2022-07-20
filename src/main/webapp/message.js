function insertMessage(message) {
	addMessageStyles();

	//Block screen
	var blocker = document.createElement("div");
	blocker.id = "messageBlocker";
	$('body').append(blocker);

	//Insert message
	var div = document.createElement("div");
	div.id = 'message';
	var p = document.createElement("p");
	p.id = 'messageT';
	p.innerHTML = message;
	div.append(p); 
	close = document.createElement("div");
	close.id = 'messageCloseIcon';
	div.append(close);
	icon = document.createElement("div");
	icon.id = 'messageIcon';
	div.append(icon);

	//Event listeners
	close.addEventListener("click", removeMessage);
	blocker.addEventListener("click", removeMessage);
	$('body').append(div);

	//Animate in
	setTimeout(function() {
		$('#message').css('top', '4vh');
		$('#messageBlocker').css('opacity', '0.6');
	}, 500);
}

function removeMessage() {
	$('#message').css('top', '-7vh');
	$('#messageBlocker').css('opacity', '0');

	setTimeout(function() {
		$('#message').remove();
		$('#messageBlocker').remove();
	}, 1000);
}

function addMessageStyles() {
	var link = document.createElement('link');
	link.setAttribute('rel', 'stylesheet');
	link.setAttribute('href', '../styles/message.css');
	document.head.appendChild(link);
}