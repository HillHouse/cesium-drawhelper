/**
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */
/* tslint:disable */
///<reference path="../scripts/typings/angularjs/angular.d.ts"/>
///<reference path="../scripts/typings/angularjs/angular-ui-bootstrap.d.ts"/>
var Main;
(function (Main) {
    var App = (function () {
        function App() {
        }
        App.Services = angular.module("app.services", []);
        App.Controllers = angular.module("app.controllers", ["app.services", "ngRoute"]);
        App.Module = angular.module("app", ["app.services", "app.controllers"]);
        return App;
    })();
    Main.App = App;
    App.Controllers.config([
        "$routeProvider",
        function ($routeProvider) {
            $routeProvider.when("/", {
                templateUrl: "pages/mapController.htm",
                controller: "MapController"
            });
        }
    ]);
})(Main || (Main = {}));
//# sourceMappingURL=app.js.map