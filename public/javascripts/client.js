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
}

var messageSound = new Audio("sounds/double_notif.mp3");
var applauseSound = new Audio('sounds/applause.mp3');

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
        if(isOkay($scope.pseudo.name) && isOkay($scope.pseudo.password))
            return true;
        else{
            return false;
        }
	};
	function isOkay (str) {
		if(str != '' && str != null && str != 'undefined')
			return true;
		else
			return false;
	}
	$scope.pseudo.checkPwd = function () {
		$.post('/connection', {name: ($scope.pseudo.name).toLowerCase().trim(), password: $scope.pseudo.password}, function(result) {
			if(result.pseudo != 'no') {
				$scope.$apply(function() {
					$scope.pseudo.show = false;
					$scope.pseudo.pseudo = result.pseudo;

					$scope.notif.change(!result.notif);
					$scope.notif.play = result.notif;
					$scope.sound.change(!result.sound);
					$scope.sound.play = result.sound;

					$scope.message.key += $scope.message.keyP;
				});
				socket.emit('connected', {pseudo: $scope.pseudo.pseudo, number: $scope.message.count});
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
			$scope.message.newMessage(message, false);
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
	$scope.message.count = 100;
	$scope.message.key = "thefatchatator";
	$scope.message.keyP = '';
	$scope.message.sendKey = function (event) {
		if(event.keyCode == 13 && !event.shiftKey)
			$scope.message.send();
	}
	$scope.message.send = function () {
		if($scope.message.content != null && $scope.message.content != '' && $scope.message.content.length > 0) {
			var now = new Date();

			var txt = $scope.message.content;
			var msg = {from: $scope.pseudo.pseudo, content: GibberishAES.enc(txt, $scope.message.key), date: now};
			socket.emit('message', msg);
			msg.from = 'Moi';
			msg.content = txt;
			var privateMsg = isPrivate(msg.content);
			msg = $scope.message.applyActions(msg, true);
			msg.content = $scope.message.lineBreaks(msg.content);
			msg.content = $scope.message.trustHTML(msg.content);

			if(privateMsg.priv){
				$scope.link.list.push(msg);
			} else {
				$scope.message.list.push(msg);
			}
		}
		$scope.message.content = null;
	};
	$scope.message.getDate = function(date) {
		if(date == 'hier' || date == 'demain' || date == 'le 37 juin' || date == 'maintenant')
			return date;
		else
			return moment(date).format('HH:mm');
	};
	socket.on('new_message', function(data) {
		if($scope.pseudo.pseudo != null)
			$scope.message.newMessage(data, true);
	});
	$scope.message.newMessage = function (data, isNew) {
		data.content = GibberishAES.dec(data.content, $scope.message.key);
		var privateMsg = isPrivate(data.content);
		var msg = $scope.message.applyActions(data, isNew);
		msg.content = $scope.message.lineBreaks(msg.content);
		

		$scope.$apply(function() {
			var notify = false;
			//effectuer toutes les opérations sur le texte avant cette fonction!!
			msg.content = $scope.message.trustHTML(msg.content);
			//case where you are the destinator
			if(privateMsg.priv && (privateMsg.pseudo == $scope.pseudo.pseudo.trim().toLowerCase() || msg.from == $scope.pseudo.pseudo)){
				$scope.link.list.push(msg);
				notify = true;
			} else {
				//case where not private
				if(!privateMsg.priv) {
					notify = true;
					$scope.message.list.push(msg);
				}
			}
			if(notify && isNew) {
				if($scope.message.newCount < 5 && $scope.sound.play) //pour ne pas harceler
					messageSound.play();
				if($('textarea.form-control').is(':focus') == false) //pour éviter qu'il y ait des notifications alors que la fenêtre a le focus
					$scope.message.newCount++;
			}
		});
	};
	function isPrivate (content) {
		var index = content.indexOf('@/');
		if(index > -1) {
			var end = content.indexOf(' ', index);
			var pseudo = null;
			if(end == -1)
				pseudo = content.slice(index + 2);
			else
				pseudo = content.slice(index + 2, end);
			return {priv: true, pseudo: pseudo.trim().toLowerCase()};
		} else
			return {priv: false} ;
	}
	$scope.message.lineBreaks = function (content) {
		var replaced = '<p>' + content + '</p>';
		replaced = replaced.replace(/\r\n/g, '</p><p>');
		return replaced.replace(/\n/g, '</p><p>');
	}
	$scope.message.applyActions = function (data, isNew) {
		
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
			$scope.message.list.push( {from: 'The Master', content: "T'es vraiment un gros timmy Bordel de merde :D", date: 'hier'} );
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
		if(text_lowered.indexOf('/bite') > -1) {
			data = {from: 'The Master', content: "Suce ma biiiiite", date: 'demain'};
		}
		if(text_lowered.indexOf('/relou') > -1) {
			data = {from: 'The Master', content: "Mais t'es relou bordel :p", date: 'demain'};
		}
		if(text_lowered.indexOf('/mad') > -1) {
			data = {from: 'The Master', content: "U mad Bro ? <img src=\"/img/mad.jpg\" class=\"emoji\"></img>", date: 'le 37 juin'};
		}
		if(text_lowered.indexOf('/sort') > -1) {
			var target = text_lowered.slice(5);
			data = {from: 'Ta maman', content: target + ' tu sors!!', date: 'maintenant'};
		}
		if(text_lowered.indexOf('/applause') > -1) {
			if($scope.sound.play && isNew)
				applauseSound.play();
		}
		if(data.from == pseudo || data.from == 'Moi') {
			data.from_class = 'moi';
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

			var css = 'linkbox ';
			if(data.from == pseudo || data.from == 'Moi') {
				css += 'moi';
			}
			$scope.link.list.push( {from: data.from, content: data.content, from_class: css, css_class: data.css_class} );
			var d = moment().format('DDMMYYYY');
			//save only if new message
			if(isNew && (data.from == pseudo ||  data.from == 'Moi'))
				$.post('/saveLk', {from: pseudo, link: after_http, context: text_lowered, date: parseInt(d)});
		}

		var keur = ['keur', 'coeur', 'poney', 'licorne', '<3', 'loutre'];
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

	$scope.link = {};
	$scope.link.list = [];
	$scope.link.show = function () {
		if($scope.link.list.length > 0)
			return true;
		else
			return false;
	};
	$scope.link.count = 30;

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
		setTimeout(function(){ toastr.clear() }, 1750);
	};
	$scope.page.go = function (path) {
		document.location.href = path;
	}

	$scope.sound = {};
	$scope.sound.ok = 'img/sound.png';
	$scope.sound.mute = 'img/mute.png';
	$scope.sound.img = $scope.sound.ok;
	$scope.sound.play = true;
	$scope.sound.change = function(state) {
		if(state) {
			$scope.sound.img = $scope.sound.mute;
		}else {
			$scope.sound.img = $scope.sound.ok;
		}
	};
	$scope.sound.click = function () {
		$scope.sound.change($scope.sound.play);
		$scope.sound.play = !$scope.sound.play;
		$.ajax({
			type: "PUT",
			url: "/prefs",
			data: {state:  $scope.sound.play, pseudo: $scope.pseudo.pseudo, param: 'sounds'}
		});
	};
	$scope.notif = {};
	$scope.notif.ok = 'img/notif.png';
	$scope.notif.mute = 'img/notif_off.png';
	$scope.notif.img = $scope.notif.ok;
	$scope.notif.play = true;
	$scope.notif.change = function(state) {
		if(state) {
			$scope.notif.img = $scope.notif.mute;
		}else {
			$scope.notif.img = $scope.notif.ok;
		}
	};
	$scope.notif.click = function () {
		$scope.notif.change($scope.notif.play);
		$scope.notif.play = !$scope.notif.play;
		$.ajax({
			type: "PUT",
			url: "/prefs",
			data: {state:  $scope.notif.play, pseudo: $scope.pseudo.pseudo, param: 'notifs'}
		});
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