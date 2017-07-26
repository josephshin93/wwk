// define the authentication service here
angular.module('authentication').service('authentication', [
	'$http', '$window',
	function authentication($http, $window) {
		var saveToken = function (token) {
			$window.localStorage['main-token'] = token;
		};
		var getToken = function () {
			return $window.localStorage['main-token'];
		};
		var isLoggedIn = function () {
			var token = getToken();
			var payload;
			if (token) {
				// decode the payload (jwt)
				payload = token.split('.')[1];
				payload = $window.atob(payload);
				payload = JSON.parse(payload);

				return payload.exp > Date.now() / 1000;
			} else {
				return false;
			}
		};
		var currentUser = function () {
			if (isLoggedIn()) {
				var token = getToken();
				var payload = token.split('.')[1];
				payload = $window.atob(payload);
				payload = JSON.parse(payload);

				return {
					email: payload.email,
					username: payload.username,
					name: payload.name
				};
			}
		};
		var login = function (user, next) {
			$http.post('/manage', user).then(function (data) {
				console.log('login success');
				saveToken(data.data.token);
				next();
			},
			function (error) {
				console.log('server sent error: ', error);
				next(error.data);
			});
		}
		var logout = function () {
			console.log('logging out');
			$window.localStorage.removeItem('main-token');
		};

		return {
			saveToken: saveToken,
			getToken: getToken,
			isLoggedIn: isLoggedIn,
			currentUser: currentUser,
			login: login,
			logout: logout
		};
	}
]);