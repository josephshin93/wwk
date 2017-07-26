// define the component here which can include template and controller
angular.module('test').component('test', {
	templateUrl: 'test-component/test.template.html',
	controller: ['$http',
		function TestController($http) {
			var self = this; // used because of callback functions...

			$http.get('/page').then(function (response) {
				console.log(response);
				self.sections = response.data;
			});

			self.editting = {
				description: false,
				list: false
			};

			self.edit = function edit(section) {
				if (section.sectionType === 'description') {
					self.editting.description = true;
					self.editting.list = false;
				} else if (section.sectionType === 'list') {
					self.editting.description = false;
					self.editting.list = true;
				}
				console.log(section);
				self.sectionEdit = section;
			}
		}
	]
});