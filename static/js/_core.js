    (function() {
        "use strict";
        angular.module('ambilight.core', ['ngStorage', 'ngMessages', 'ngMaterial', 'ui.router'])

        //.value('appName', 'ambilight')
        //.value('version', '0.0.1')
        //.value('username', '')

        .config(function ($stateProvider, $urlRouterProvider, $mdThemingProvider, $mdIconProvider) {
            $urlRouterProvider.otherwise('/start');

            $stateProvider
                .state('start', {
                    url:'/start',
                    title: 'Ambilight Control',
                    views: {
                        "nav": {templateUrl:'templates/nav/navbar.html'},
                        "": {templateUrl:'templates/start.html', controller:'StartCtrl as vm'}
                    }
                })

                .state('home', {
                    url:'/home/{user}',
                    title: 'Ambilight Control',
                    views: {
                        "nav": {templateUrl:'templates/nav/navbar.html'},
                        "": {templateUrl:'templates/home.html', controller:'HomeCtrl as vm'}
                    }
                })

                .state('ambilight', {
                    url:'/ambilight',
                    params: {name: 'Ambilight + HUE', on: null},
                    views: {
                        "nav": {templateUrl:'templates/nav/navbar-detail.html', controller:'AmbiCtrl as vm'},
                        "": {templateUrl:'templates/ambilight.html', controller:'AmbiCtrl as vm'}
                    }
                })

                .state('shake', {
                    url:'/shake',
                    params: {name: 'Shake Gesture', on: null},
                    views: {
                        "nav": {templateUrl:'templates/nav/navbar-detail.html', controller:'ShakeCtrl as vm'},
                        "": {templateUrl:'templates/shake.html', controller:'ShakeCtrl as vm'}
                    }
                })

                .state('light', {
                    url:'/light/{key}',
                    params: {name: null, state: null, on: null},
                    views: {
                        "nav": {templateUrl:'templates/nav/navbar-detail.html', controller:'LightCtrl as vm'},
                        "": {templateUrl:'templates/light.html', controller:'LightCtrl as vm'}
                    }
                })

                .state('nav', {
                    url:'/nav',
                    abstract:true,
                    templateUrl:'templates/navbar.html'
                });

            $mdThemingProvider.theme('default').primaryPalette('light-blue').accentPalette('green', {
                'default':'500'
            });
            //$mdThemingProvider.theme('green').primaryPalette('green');

            $mdIconProvider
                //.iconSet('social', 'img/icons/sets/social-icons.svg', 24)
                //.iconSet('device', 'img/icons/sets/device-icons.svg', 24)
                //.iconSet('communication', 'img/icons/sets/communication-icons.svg', 24)
                .iconSet('ambi', 'img/icons/sets/ambilight-icons.svg', 24)
                //.defaultIconSet('img/icons/sets/core-icons.svg', 24);

            });

    })();
