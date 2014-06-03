// connect to the socket server
var socket = io.connect();
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
toastr.options.onShown = function() { 
	document.title = 'Notifications!';
}
toastr.options.onHidden  = function() { 
	document.title = toastr.options.ex_title; 
}

var ChatApp = angular.module('ChatApp', ['ui.bootstrap']);
//to reverse the order of the messages
ChatApp.filter('reverse', function() {
  return function(items) {
    return items.slice().reverse();
  };
});
ChatApp.controller('chatController', function($scope, $location, $anchorScroll) {

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
		$.get('/connection', {name: ($scope.pseudo.name).toLowerCase().trim(), password: $scope.pseudo.password}, function(result) {
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
	$scope.collapse.escape = function (key) {
		if(key.keyCode == 27)
			$scope.collapse.isCollapsed = !$scope.collapse.isCollapsed;
	};

	$scope.message = {};
	$scope.message.list = [];

	$scope.message.sendKey = function (event) {
		if(event.keyCode == 13 && !event.shiftKey)
			$scope.message.send()
	}
	$scope.message.send = function () {
		if($scope.message.content != null && $scope.message.content != '' && $scope.message.content.length > 0) {
			var now = new Date();
			//, css_class: $scope.pseudo.name to add personnalize CSS 
			var msg = {from: $scope.pseudo.pseudo, content: $scope.message.content, date: now}
			socket.emit('message', msg);
			msg.from = 'Moi';
			$scope.message.list.push(msg);
		}
		$scope.message.content = null;
	};
	$scope.message.getDate = function(date) {
		return moment(date).format('HH:mm');
	};
	socket.on('new_message', function(data) {
		$scope.message.newMessage(data);
	});
	$scope.message.newMessage = function (data) {
		if($('textarea.form-control').is(':focus') == false) //pour éviter qu'il y ait des notifications alors que la fenêtre a le focus
			$scope.message.newCount++;
		//quand quelqu'un te notifie dans la conversation
		var pseudo = $scope.pseudo.pseudo;
		var pseudo_woacc = $scope.page.rmAccents(pseudo);
		var text_lowered = data.content.toLowerCase();

		if((text_lowered.indexOf('@' + (pseudo).toLowerCase()) > -1) || (text_lowered.indexOf('@' + (pseudo_woacc).toLowerCase()) > -1)) {
			var index = text_lowered.indexOf('@' + (pseudo).toLowerCase()) + 2 + (pseudo.length);
			var shift = data.content.slice(index, index + 25);
			toastr.success('<p>Tu as été mentionné par ' + data.from + '!</p><p>"<i>' + shift + ' ...</i>"</p><small>' + moment().format('HH:mm') + '</small>');
			data.css_class = 'notified';
		} else {
			//juste cité
			if((text_lowered.indexOf((pseudo).toLowerCase()) > -1) || (text_lowered.indexOf((pseudo_woacc).toLowerCase()) > -1)) {
				data.css_class = 'quoted';
			}
		}
		$scope.$apply(function() {
			$scope.message.list.push(data);
		});
	};
	$scope.message.newCount = 0;
	setInterval(function(){
		if(document.title != toastr.options.ex_title || $scope.message.newCount == 0) 
				document.title = toastr.options.ex_title;
		else {
			if($scope.message.newCount == 1)
				document.title = 'Nouveau message';
			else
				document.title = $scope.message.newCount + ' nouveaux messages';
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
	})


	$scope.page = {};
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
	};
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