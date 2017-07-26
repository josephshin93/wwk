// define the page-edit component here
angular.module('pageEdit').component('pageEdit', {
	templateUrl: 'page-edit-component/page-edit.template.html',
	controller: ['$http',
		function PageEditController($http) {
			var self = this;

			self.pages = [];
			self.section = {};

			self.showSections = function (page) {
				if (typeof page.showSections == 'undefined' || !page.showSections) {
					page.showSections = true;
				} else if (page.showSections === true) {
					page.showSections = false;
				}
			};

			self.edit = function (section) {
				self.section = section;
			};

			$http.get('/manage/pages').then(function (response) {
				console.log('server responding to /manage/pages', response);
				self.pages = response.data;
			});
		}
	]
});