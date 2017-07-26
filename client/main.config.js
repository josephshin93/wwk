// define main module config
angular.module('main').config(['$locationProvider', '$routeProvider', 
	function config($locationProvider, $routeProvider) {
		// this is good practice but i still don't understand why
		$locationProvider.hashPrefix('!');

		$routeProvider
			.when('/', {
				template: '<h1>HOMEPAGE</h1>'
			})
			.when('/manage', {
				// since *.component.js is used instead of *.controller.js - is this good?
				template: '<cms></cms>'
			})
			.otherwise('/'); // fallback route
	}
]);