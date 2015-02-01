/**
 * Licensed under the Apache License, Version 2.0 (the "License"); 
 * you may not use this file except in compliance with the License. 
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */

/* tslint:disable */
///<reference path="../scripts/typings/angularjs/angular.d.ts"/>
///<reference path="../scripts/typings/angularjs/angular-ui-bootstrap.d.ts"/>

module Main {

    export class App {
        public static Services: ng.IModule = angular.module("app.services", []);
        public static Controllers: ng.IModule = angular.module("app.controllers", ["app.services", "ngRoute"]);
        public static Module: ng.IModule = angular.module("app", ["app.services", "app.controllers"]);
    }

    App.Controllers.config([
        "$routeProvider",
        $routeProvider => {
            $routeProvider
                .when("/", {
                    templateUrl: "pages/mapController.htm",
                    controller: "MapController"
                })
            ;
        }
    ]);
}
