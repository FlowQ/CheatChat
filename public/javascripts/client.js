// connect to the socket server
var socket = io.connect({secure: true});
window.onerror = function(error, url, line) {
	console.log('ERROR: ' + error);
	var d = new Date();
    socket.emit('logs', {type: 'browser', error: error,url: url, line: line, date: d});
};
toastr.options = {
      "closeButton": false,
      "debug": false,
      "positionClass": "toast-bottom-right",
      "onclick": null,
      "showDuration": "300",
      "hideDuration": "300",
      "timeOut": "0", //sticky notif
      "extendedTimeOut": "1000",
      "showEasing": "swing",
      "hideEasing": "linear",
      "showMethod": "fadeIn",
      "hideMethod": "fadeOut",
      "ex_title": document.title
}/*
toastr.options.onShown = function() { 
	document.title = 'Notifications!';
}
toastr.options.onHidden  = function() { 
	document.title = toastr.options.ex_title; 
}*/
var messageSound = new Audio("double_notif.mp3");

var ChatApp = angular.module('ChatApp', ['ui.bootstrap', 'ngSanitize']);
//to reverse the order of the messages
ChatApp.filter('reverse', function() {
  return function(items) {
    return items.slice().reverse();
  };
});
ChatApp.controller('chatController', function($scope, $sce, $location, $anchorScroll) {

	//for managing pseudo and connection
	$scope.pseudo = {};
	$scope.pseudo.show = true;
	$scope.pseudo.name = null; //name for login
	$scope.pseudo.password = null; // pass for login
	$scope.pseudo.pseudo = null; //printed pseudo
	//login function
	$scope.pseudo.canSubmit = function() {
        if($scope.pseudo.name != '' && $scope.pseudo.name != null && $scope.pseudo.name != 'undefined' && $scope.pseudo.password != null && $scope.pseudo.password != ''  && $scope.pseudo.password != 'undefined')
            return true;
        else{
            return false;
        }
	};
	$scope.pseudo.checkPwd = function () {
		$.post('/connection', {name: ($scope.pseudo.name).toLowerCase().trim(), password: $scope.pseudo.password}, function(result) {
			if(result.pseudo != 'no') {
				$scope.$apply(function() {
					$scope.pseudo.show = false;
					$scope.pseudo.pseudo = result.pseudo;
				});
				socket.emit('connected', {pseudo: $scope.pseudo.pseudo});
				toastr.success('Bienvenue ' + $scope.pseudo.pseudo + ', la forme ?');
				setTimeout(function() { toastr.clear();document.title = toastr.options.ex_title; }, 2500);
			}
			else {
				$scope.pseudo.password = null;
				$('#password').focus();
				$('div.form-group.has-feedback.full-width').addClass("has-error");
				toastr.error('Mauvaise authentification');
				setTimeout(function() { toastr.clear();document.title = toastr.options.ex_title; }, 1500);
			}
		});
	};
	socket.on('old_messages', function(data) {
		data.listMsg.reverse();
		data.listMsg.forEach(function(message) {
			$scope.message.newMessage(message);
		});
	});

	//for managing messages
	$scope.collapse = {};
	$scope.collapse.isCollapsed = false;
	$scope.collapse.getText = function() {
		if($scope.collapse.isCollapsed)
			return 'Show';
		else
			return 'Hide';
	};

	$scope.message = {};
	$scope.message.list = [];

	$scope.message.sendKey = function (event) {
		if(event.keyCode == 13 && !event.shiftKey)
			$scope.message.send();
	}
	$scope.message.send = function () {
		if($scope.message.content != null && $scope.message.content != '' && $scope.message.content.length > 0) {
			var now = new Date();

			var txt = $scope.message.content;
			var msg = {from: $scope.pseudo.pseudo, content: txt, date: now};
			socket.emit('message', msg);
			msg.from = 'Moi';
			msg = $scope.message.applyActions(msg);
			msg.content = $scope.message.trustHTML(msg.content);
			$scope.message.list.push(msg);
		}
		$scope.message.content = null;
	};
	$scope.message.getDate = function(date) {
		if(date == 'hier')
			return date;
		else
			return moment(date).format('HH:mm');
	};
	socket.on('new_message', function(data) {
		$scope.message.newMessage(data);
	});
	$scope.message.newMessage = function (data) {
		if($scope.message.newCount < 5 && $scope.sound.play) //pour ne pas harceler
			messageSound.play();
		if($('textarea.form-control').is(':focus') == false) //pour éviter qu'il y ait des notifications alors que la fenêtre a le focus
			$scope.message.newCount++;

		var msg = $scope.message.applyActions(data);

		msg.content = $scope.message.trustHTML(msg.content);
		$scope.$apply(function() {
			$scope.message.list.push(msg);
		});
	};
	$scope.message.applyActions = function (data) {
		
		//quand quelqu'un te notifie dans la conversation
		var pseudo = $scope.pseudo.pseudo;
		var pseudo_woacc = $scope.page.rmAccents(pseudo);
		var text_lowered = data.content.toLowerCase();

		//règles d'affichage des @lias 
		if((text_lowered.indexOf('@' + (pseudo).toLowerCase()) > -1) || (text_lowered.indexOf('@' + (pseudo_woacc).toLowerCase()) > -1) || (text_lowered.indexOf('@all') > -1)) {
			var index = text_lowered.indexOf('@' + (pseudo).toLowerCase()) + 2 + (pseudo.length);
			var shift = data.content.slice(index, index + 25);
			if(data.from != 'Moi')
				toastr.success('<p>Tu as été mentionné par ' + data.from + '!</p><p>"<i>' + shift + ' ...</i>"</p><small>' + moment().format('HH:mm') + '</small>');
			data.css_class = 'notified';
		} else {
			//juste cité
			if((text_lowered.indexOf((pseudo).toLowerCase()) > -1) || (text_lowered.indexOf((pseudo_woacc).toLowerCase()) > -1)) {
				data.css_class = 'quoted';
			}
		}
		if((text_lowered.indexOf('@timmy') > -1) && pseudo == 'Pépé') {
			$scope.message.newMessage( {from: 'The Master', content: "T'es vraiment un gros timmy Bordel de merde :D", date: 'hier'} );
		}
		if((text_lowered.indexOf('@geek') > -1) && (pseudo == 'Popy' || pseudo == 'Cons' || pseudo == 'Flo')) {
			data.css_class = 'geek';
			if(data.from != 'Moi')
				toastr.success('Hey Ho les geeks on vous appelle!');
		}
		if((text_lowered.indexOf('@boloss') > -1) && (pseudo == 'Bru' || pseudo == 'Pépé')) {
			data.css_class = 'boloss';
			if(data.from != 'Moi')
				toastr.info('Ouesh les bolossss vous êtes où ?!');
		}

		var index = text_lowered.indexOf('http://');
		var index_s = text_lowered.indexOf('https://');
		if(index > -1 ||  index_s > -1) {
			var id = null;
			if(index > index_s)
				id = index;
			else
				id = index_s;
			after = data.content.slice(id);
			before = data.content.slice(0, id );
			id = after.indexOf(' ');
			var after_http = null;
			var after_other = null;
			if(id != -1) {
				after_http = after.slice(0, id);
				after_other = after.slice(id);
			} else { 
				after_http = after;
				after_other = '';
			}
			data.content = before + ' <a href="' + after_http + '" target="_blank">' + after_http + '</a>' + after_other;
		}

		var keur = ['keur', 'coeur', 'poney', 'licorne', '<3'];
		for(poney in keur) {
			data.content = poneyKeur(keur[poney], data.content);
		}
		return data;
	};
	function poneyKeur (word, text) {
		var index = text.toLowerCase().indexOf(word);
		if(index > -1) {
			after = text.slice(index);
			before = text.slice(0, index );
			index = after.indexOf(' ');
			var keur = null;
			var after_other = null;
			if(index != -1) {
				keur = after.slice(0, index);
				after_other = after.slice(index);
			} else { 
				keur = after;
				after_other = '';
			}
			return before + ' <font color="pink">' + keur + '</font>' + after_other;
		} else {
		 	return text;
		}
	}
	$scope.message.trustHTML = function (snippet) {
		return $sce.trustAsHtml(snippet);
	};
	$scope.message.newCount = 0;
	setInterval(function(){
		if($scope.notif.play) {
			if(document.title != toastr.options.ex_title || $scope.message.newCount == 0) 
					document.title = toastr.options.ex_title;
			else {
				if($scope.message.newCount == 1)
					document.title = 'Nouveau message';
				else
					document.title = $scope.message.newCount + ' nouveaux messages';
			}
		}
	}, 1250);

	$scope.users = {};
	$scope.users.list = [];
	$scope.users.toShow = '';
	$scope.users.updateList = function () {
		var res = '';
		for(var nom in $scope.users.list){
			if($scope.users.list[nom] != 'null' && $scope.users.list[nom] != $scope.pseudo.pseudo)
				res = res.concat($scope.users.list[nom], ' ');
		}
		$scope.users.toShow = res;
	}
	socket.on('new_user', function (data) {
		$scope.$apply(function () {
			$scope.users.list = data.list;
			$scope.users.updateList();
		});
	});
	socket.on('gone_user', function (data) {
		$scope.$apply(function () {
			$scope.users.list = data.list;
			$scope.users.updateList();
		});
	});

	socket.on('kick', function(data) {
		var d = new Date();
		if(data.name.toLowerCase() == $scope.pseudo.pseudo.toLowerCase()) {
			toastr.error("BIM DEHORS BIATCH :D");
			toastr.error("T'as la mort hein!");
			toastr.error("Ahahahahahah");
			setTimeout(function() { location.reload(true); }, 7000);
		}
		else {
			$scope.message.newMessage({from: 'Master', content: data.name + " s'est fait kicker, bouyaa!", date: d});
		}
	});


	$scope.page = {};
	$scope.page.keyPress = function (key) {
		if(key.keyCode == 27)
			$scope.collapse.isCollapsed = !$scope.collapse.isCollapsed;
		if(($('textarea.form-control').is(':focus') == false) && key.keyCode == 65)
			$scope.page.plcmtPopy();
	};
	$scope.page.plcmtPopy = function () {
		$location.hash('txtArea');
	    $anchorScroll();
	}
	$scope.page.goToChat = function () {
		$location.hash('chat');
	    $anchorScroll();
	    $('#pseudo-name').focus();
	};
	$scope.page.rmAccents = function(strAccents) {
		var strAccents = strAccents.split('');
		var strAccentsOut = new Array();
		var strAccentsLen = strAccents.length;
		var accents = 'ÀÁÂÃÄÅàáâãäåÒÓÔÕÕÖØòóôõöøÈÉÊËèéêëðÇçÐÌÍÎÏìíîïÙÚÛÜùúûüÑñŠšŸÿýŽž';
		var accentsOut = "AAAAAAaaaaaaOOOOOOOooooooEEEEeeeeeCcDIIIIiiiiUUUUuuuuNnSsYyyZz";
		for (var y = 0; y < strAccentsLen; y++) {
			if (accents.indexOf(strAccents[y]) != -1) {
				strAccentsOut[y] = accentsOut.substr(accents.indexOf(strAccents[y]), 1);
			} else
				strAccentsOut[y] = strAccents[y];
		}
		strAccentsOut = strAccentsOut.join('');
		return strAccentsOut;
	};
	$scope.page.hasFocus = function () {
		$scope.message.newCount = 0;
		document.title = toastr.options.ex_title;
		setTimeout(function(){ toastr.clear() }, 1250);
	};
	$scope.page.go = function (path) {
		document.location.href = path;
	}

	$scope.sound = {};
	$scope.sound.ok = 'img/sound.png';
	$scope.sound.mute = 'img/mute.png';
	$scope.sound.img = $scope.sound.ok;
	$scope.sound.play = true;
	$scope.sound.click = function () {
		if($scope.sound.play) {
			$scope.sound.img = $scope.sound.mute;
		}else {
			$scope.sound.img = $scope.sound.ok;
		}
		$scope.sound.play = !$scope.sound.play;
	};
	$scope.notif = {};
	$scope.notif.ok = 'img/notif.png';
	$scope.notif.mute = 'img/notif_off.png';
	$scope.notif.img = $scope.notif.ok;
	$scope.notif.play = true;
	$scope.notif.click = function () {
		if($scope.notif.play) {
			$scope.notif.img = $scope.notif.mute;
		}else {
			$scope.notif.img = $scope.notif.ok;
		}
		$scope.notif.play = !$scope.notif.play;
	};
	socket.on('panic', function() {
		location.reload(true);
	});
});
/* for time in message
	<script type="text/javascript" src="http://cdnjs.cloudflare.com/ajax/libs/moment.js/2.6.0/moment.min.js"></script>
		
		<script>
			var date = 'Mon May 26 2014 21:02:41 GMT+0200 (CEST)';
			var not_now = moment(date).format('X');

			var diff_day = moment().dayOfYear() - moment(date).dayOfYear();
			var diff_min = Math.floor((moment().format('X') - not_now) / 60);

			if(diff_min < 60) {
				console.log(diff_min + 'min');
			} else {
				if (diff_day == 0) {
					console.log(moment.unix(not_now).format('HH:mm'));
				} else {
					if (diff_day == 1)
						console.log(diff_day + ' jour');
					else
						console.log(diff_day + ' jours');
				}
			}
		</script>
*/

	//to know who is writing
	/*$scope.writer = {};
	$scope.writer.list = {};
	socket.on('typing', function(data) {
		$scope.$apply(function() {
			$scope.writer.list.[data.name] = data.name;
		});
	});
	socket.on('stop_typing', function(data) {
		$scope.$apply(function() {
			delete $scope.writer.list.[data.name];
		});
	});*/