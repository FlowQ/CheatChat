// connect to the socket server
var socket = io.connect();
toastr.options = {
      "closeButton": false,
      "debug": false,
      "positionClass": "toast-top-right",
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
ChatApp.controller('chatController', function($scope) {
	//TO UN-COMMENT
	//for managing pseudo and connection
	$scope.pseudo = {};
	$scope.pseudo.show = true;
	$scope.pseudo.name = null; //name for login
	$scope.pseudo.password = null; // pass for login
	$scope.pseudo.pseudo = null; //printed pseudo
	//login function
	$scope.canSubmit = function() {
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
				toastr.success('Bienvenue ' + $scope.pseudo.pseudo + ', la forme ?');
				document.title = toastr.options.ex_title;
				setTimeout(function() { toastr.clear(); }, 2500);
			}
			else {
				$('div.form-group.has-feedback.full-width').addClass("has-error");
				toastr.error('Mauvaise authentification');
				document.title = toastr.options.ex_title;
				setTimeout(function() { toastr.clear(); }, 1500);
			}
		});
	};
	
	//TEMP
/*	$scope.pseudo = {pseudo: 'Flow', show: false, name: 'florian'};
	socket.emit('send');*/

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

	$scope.message.send = function () {
		var now = new Date();
		//, css_class: $scope.pseudo.name to add personnalize CSS 
		var msg = {from: $scope.pseudo.pseudo, content: $scope.message.content, date: now}
		socket.emit('message', msg);
		$scope.message.list.push(msg);
	    $scope.message.content = null;
	};
	//

	$scope.message.getDate = function(date) {
			return moment(date).format('HH:mm');
	};

	socket.on('new_message', function(data) {
			console.log(data);
		//quand quelqu'un te notifie dans la conversation
		if(data.content.toLowerCase().indexOf('@' + ($scope.pseudo.pseudo).toLowerCase()) > -1) {
			var index = data.content.toLowerCase().indexOf('@' + ($scope.pseudo.pseudo).toLowerCase()) + 2 + ($scope.pseudo.pseudo.length);
			var shift = data.content.slice(index, index + 25);
			toastr.success('<p>Tu as été mentionné par ' + data.from + '!</p><p>"<i>' + shift + ' ...</i>"</p><small>' + moment().format('HH:mm') + '</small>');
			data.css_class = 'notified';
		} else {
			//juste cité
			if(data.content.toLowerCase().indexOf(($scope.pseudo.pseudo).toLowerCase()) > -1) {
				data.css_class = 'quoted';
			}
		}
		$scope.$apply(function() {
			$scope.message.list.push(data);
		});
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