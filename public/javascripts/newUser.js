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

var Account = angular.module('newUser', ['ui.bootstrap', 'ngSanitize']);

Account.controller('newUserController', function($scope, $sce, $location, $anchorScroll) {

	//for managing pseudo and connection
	$scope.pseudo = {};
	$scope.pseudo.show = true;
	$scope.pseudo.name = null; //name for login
	$scope.pseudo.password = null; // pass for login
	$scope.pseudo.pseudo = null; //printed pseudo
	//login function
	$scope.pseudo.canSubmit = function() {
		if(isOkay($scope.pseudo.name) && isOkay($scope.pseudo.password1) && isOkay($scope.pseudo.password2) && isOkay($scope.pseudo.pseudo)) {
			return true;
		} else
			return false;
	};
	function isOkay (str) {
		if(str != '' && str != null && str != 'undefined')
			return true;
		else
			return false;
	}
	$scope.pseudo.valid = function () {
		if($scope.pseudo.password1 == $scope.pseudo.password2)  {
			$.post('/create', {login: ($scope.pseudo.name).toLowerCase().trim(), password: $scope.pseudo.password1, pseudo: $scope.pseudo.pseudo}, function(result) {
				if(result == 'ok') {
					$scope.$apply(function() {
						$scope.pseudo.show = false;
						toastr.success("Compte créé");
					});
				} else {
					$scope.pseudo.pseudo = null;
					$('#pseudo').focus();
					$('div.form-group.has-feedback.full-width').addClass("has-error");
					toastr.error(result);
					setTimeout(function() { toastr.clear();document.title = toastr.options.ex_title; }, 2500);
				}
			});
		} else {
			$scope.pseudo.password1 = null;
			$scope.pseudo.password2 = null;
			$('#password1').focus();
			toastr.error('Les mots de passe doivent être identiques');
			setTimeout(function() { toastr.clear();document.title = toastr.options.ex_title; }, 2500);
		}
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