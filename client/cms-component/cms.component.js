// define cms component here
angular.module('cms').component('cms', {
	templateUrl: 'cms-component/cms.template.html',
	controller: ['$http', 'authentication',
		function CmsController($http, authentication) {
			var self = this;

			// instantiate objects/variables
			self.login = {
				user: {
					username: "",
					password: ""
				},
				message: ""
			};
			self.manage = {
				user: {},
				pages: [],
				sections: []
			};
			if (authentication.isLoggedIn()) {
				self.manage.user = authentication.currentUser();
			}

			self.login = function () {
				// login contains an http post, so it will behave asynchronously. to avoid
				// this behavior, a callback function was included in the login method
				authentication.login(self.login.user, function (error) {
					if (error) {
						self.login.message = error.message;
					} else {
						self.manage.user = authentication.currentUser();
						self.template = 'cms-component/cms.manage.template.html';
					}
				});		
			};
			self.logout = function () {
				authentication.logout();
				self.template = 'cms-component/cms.login.template.html';
				self.login.user.username = "";
				self.login.user.password = "";
				self.login.message = "You have logged out";
			};
			// allow 'enter' key to used to trigger login
			$(document).on('keyup', function (event) {
				if (self.template == 'cms-component/cms.login.template.html' && event.keyCode == 13) {
					self.login();
				}
			});


			self.tabs = {
				dashboard: true,
				pageEdit: false
			};
			self.chooseTab = function (tab) {
				// not my favorite implementation but it'll work for now
				for (var t in self.tabs) {
					self.tabs[t] = false;
				}
				self.tabs[tab] = true;
			};

			
			// check if client has user data
			$http.get('/manage').then(function (response) {
				// first check if user is already logged in
				if (!authentication.isLoggedIn()) {
					self.template = 'cms-component/cms.login.template.html';
				} else {
					self.template = 'cms-component/cms.manage.template.html';
				}
			});
		}
	]
});