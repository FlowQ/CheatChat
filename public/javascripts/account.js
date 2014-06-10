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
var messageSound = new Audio("double_notif.mp3");

var Account = angular.module('Account', ['ui.bootstrap', 'ngSanitize']);

Account.controller('AccountController', function($scope, $sce, $location, $anchorScroll) {

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
	$scope.pseudo.canChange = function() {
        if($scope.pseudo.password1 == $scope.pseudo.password2 && $scope.pseudo.password1 != '' && $scope.pseudo.password1 != null && $scope.pseudo.password1 != 'undefined' && $scope.pseudo.password2 != null && $scope.pseudo.password2 != ''  && $scope.pseudo.password2 != 'undefined')
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
					$scope.pseudo.password1 = $scope.pseudo.password;
					$scope.pseudo.password2 = $scope.pseudo.password;
				});
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
	$scope.pseudo.changePwd = function () {
		if($scope.pseudo.password1 == $scope.pseudo.password) {
			toastr.info('Renseigner un mot de passe différent');
		} else {
			$.post('/changePwd', {login: $scope.pseudo.name, newPassword: $scope.pseudo.password1}, function(result) {
				if(result.status == 'OK')
					toastr.success('Mot de passe changé');
				else 
					toastr.info('Erreur au changement de mot de passe');
			});
		}
		setTimeout(function() { toastr.clear();document.title = toastr.options.ex_title; }, 1500);
	};

	$scope.page = {};
	$scope.page.go = function (path) {
		document.location.href = path;
	}
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
});