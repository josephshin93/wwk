// define the component here which can include template and controller
angular.module('dashboard').component('dashboard', {
	templateUrl: 'dashboard-component/dashboard.template.html',
	controller: [
		function DashboardController() {
			this.message = "Hello, welcome to the dashboard\n There isn't anything here yet";
		}
	]
});