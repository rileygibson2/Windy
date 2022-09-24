function insertDialog(title, text, yesFunc, ...yesArgs) {
	//Block screen
	var blocker = document.createElement("div");
	blocker.id = "dialogBlocker";
	$('body').append(blocker);

	//Dialog container
	var div = document.createElement("div");
	div.id = 'dialog';
	
	//Icon
	icon = document.createElement("div");
	icon.id = 'dialogIcon';
	div.append(icon);
	//Dialog title
	var p = document.createElement("p");
	p.id = 'dialogTitle';
	p.innerHTML = title;
	div.append(p); 
	//Dialog text
	var p = document.createElement("p");
	p.id = 'dialogText';
	p.innerHTML = text;
	div.append(p); 
	//Close button
	var close = document.createElement("div");
	close.id = 'dialogCloseIcon';
	div.append(close);
	//No button and text
	var no = document.createElement("div");
	no.className = 'dialogButton';
	no.id = 'dialogNo';
	var t = document.createElement("div");
	t.className = 'dialogButtonT';
	t.innerHTML = "No"
	no.append(t);
	div.append(no);
	//No button and text
	yes = document.createElement("div");
	yes.className = 'dialogButton';
	yes.id = 'dialogYes';
	t = document.createElement("div");
	t.className = 'dialogButtonT';
	t.innerHTML = "Yes";
	yes.append(t);
	div.append(yes);

	//Event listeners
	close.addEventListener("click", removeDialog);
	no.addEventListener("click", removeDialog);
	yes.addEventListener("click", function() {
		yesFunc.apply(this, yesArgs);
		removeDialog();
	});

	$('body').append(div); //Finish
	setTimeout(function() { //Animate entrance
		//Bring essage in
		$('#dialog').css('opacity', '1');
		$('#dialogBlocker').css('opacity', '0.6');
		
		//Blur stuff out
		$('#sc').css('filter', 'blur(10px)');
		$('#effCont').css('filter', 'blur(10px)');
		$('#sbCont').css('filter', 'blur(10px)');
		$('#sICont').css('filter', 'blur(10px)');
		$('#sCont').css('filter', 'blur(10px)');
	}, 100);
}

function removeDialog() {
	//Animate out and remove 
	$('#dialog').css('opacity', '0');
	$('#dialogBlocker').css('opacity', '0');

	setTimeout(function() {
		$('#dialog').remove();
		$('#dialogBlocker').remove();
	}, 200);

	//Unblur stuff
	$('#sc').css('filter', 'none');
	$('#effCont').css('filter', 'none');
	$('#sbCont').css('filter', 'none');
	$('#sICont').css('filter', 'none');
	$('#sCont').css('filter', 'none');
}