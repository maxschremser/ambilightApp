    /**
     * Application: ambilight
     * Module: ctrl
     *
     * This modules encapsulates all of the controllers. Controllers are always
     * exposed as vm. VM stands for ViewModel, which is from the MVC Pattern.
     * Using "controller as vm" exposes only the variables and functions, that are
     * really wanted.
     * @See: http://www.johnpapa.net/angularjss-controller-as-and-the-vm-variable/
     *
     */

    (function() {
        "use strict";
        angular.module('ambilight.ctrl', ['hue', 'ambi', 'ngStorage']);
    })();

    /**
     * Application: ambilight
     * Module: ctrl
     * Controller: StartCtrl
     * Templates: templates/login.html
     */
    (function(){
        "use strict";

        angular.module('ambilight.ctrl')

        .controller('StartCtrl', function($scope,$localStorage,$state,$stateParams,$mdDialog,$q,hue) {
            var vm = this;
            vm.username = $localStorage.username ? $localStorage.username : "";
            vm.createUser = createUser;
            vm.hue = false;
            vm.getInstance = getInstance;

            document.addEventListener("deviceready", init, false);
            if (document.location.href.startsWith("http://")) {
                init();
            }

            function init() {
                // try to get a HUE Bridge IP Address and save it to the scope of the controller
                getInstance();
            }

            function createUser() {
                hue.createUser().then(function (user) {
                    vm.username = $localStorage.username = user;
                    $state.go("home", {user: vm.username});
                }, function (err) {
                    $mdDialog.show(
                        $mdDialog
                            .alert()
                            .parent(angular.element(document.body))
                            .title('Ambilight Error')
                            .content(err.description)
                            .ok('DONE')
                    );
                });
            }

            function getInstance() {
                hue.getInstance().then(function (enabled) {
                    if (vm.username) {
                        hue.setUser(vm.username);
                        $state.go("home", {user: vm.username});
                    } else {
                        vm.hue = true;
                        createUser();
                    }
                }, function (err) {
                    $mdDialog.show(
                        $mdDialog
                            .alert()
                            .parent(angular.element(document.body))
                            .title('Ambilight Error')
                            .content(err.description)
                            .ok('DONE')
                    );
                });
            }
        });

    })();

    /**
     * Application: ambilight
     * Module: ctrl
     * Controller: HomeCtrl
     * Templates: templates/home.html
     */
    (function(){
        "use strict";

        angular.module('ambilight.ctrl')

        .controller('HomeCtrl', function($scope,$rootScope,$localStorage,$state,$stateParams,$interval,$mdDialog,hue,ambi) {
            var vm = this;

            vm.lights = null;
            vm.username = $stateParams.user;

            vm.shakeEnabled = $localStorage.shakeEnabled ? $localStorage.shakeEnabled : false;
            vm.shakePlugin = false;

            vm.ambilightEnabled = false;
            vm.ambiPlugin = false;
            vm.config = $rootScope.config;

            vm.go = go;
            vm.hasShakePlugin = hasShakePlugin;
            vm.hasAmbilightPlugin = hasAmbilightPlugin;
            vm.getLights = getLights;
            vm.toggleLightState = toggleLightState;
            vm.toggleShake = toggleShake;
            vm.toggleAmbilight = toggleAmbilight;

            _init();

            function _init() {
                // get all Lights at initalization phase
                hue.getInstance().then(function () {
                    hue.setUser(vm.username);
                    getLights();
                });

                if (typeof shake !== "undefined") {
                    vm.shakePlugin = true;
                    shake.stopWatch();
                    shake.startWatch(onShake);
                }

                ambi.getInstance().then(function () {
                    vm.ambiPlugin = true;
                    $scope.$on('processed', function (event, processed) {
                        setLightColor(processed.layer1, vm.config);
                    });
                    if (angular.isDefined($rootScope.ambilightRunner)) {
                        vm.ambilightEnabled = true;
                    }
                });

                vm.config = $rootScope.config = $localStorage.config;

            }

            function go(to, params) {
                $state.go(to,params);
            }

            function hasShakePlugin() {
                return vm.shakePlugin;
            }

            function hasAmbilightPlugin() {
                return vm.ambiPlugin;
            }

            function getLights() {
                hue.getLights().then(function (lights) {
                    vm.lights = lights.plain();
                }, function (error) {
                });
            }

            function toggleAmbilight() {
                if (vm.ambiPlugin) {
                    if (!angular.isDefined($rootScope.ambilightRunner)) {
                        ambi.startRunner($rootScope);
                    } else {
                        ambi.stopRunner($rootScope);
                    }
                }
            }

            function toggleLightState(key) {
                hue.setLightState(key, {on: vm.lights[key].state.on}).then(function (state) {
                    vm.lights[key].state.on = state[0].success["/lights/" + key + "/state/on"];
                });
            }

            function toggleShake() {
                $localStorage.shakeEnabled = vm.shakeEnabled;
            }

            function onShake() {
                if (vm.shakeEnabled) {
                    angular.forEach(vm.lights, function (light,key) {
                        vm.lights[key].state.on = !vm.lights[key].state.on;
                        toggleLightState(key);
                    });
                }
            }

            function setLightColor(color, config) {
                var cols = {};

                angular.forEach(vm.lights, function (_value, num) {
                    angular.forEach(config,  function (value,key) {
                        var len = _.keys(value).length;
                        cols.r = cols.g = cols.b = 0;
                        var calculated = false;
                        angular.forEach(value, function (v,k) {
                            if (v==num) {
                                calculated = true;
                                cols.r += color[key][k].r;
                                cols.g += color[key][k].g;
                                cols.b += color[key][k].b;
                            }
                        });
                        if (calculated) {
                            cols.r /= len, cols.g /= len, cols.b /= len;
                            var xy = new colors().rgbToCIE1931(cols.r,cols.g,cols.b);
                            hue.setLightState(num, {xy: xy}).then();
                        }
                    });
                });
            }

        })

        .controller('LightCtrl', function($window, $stateParams, hue) {
            var vm = this;
            vm.key = $stateParams.key;
            vm.name = $stateParams.name;
            vm.state = $stateParams.state;
            vm.on = $stateParams.on;
            vm.pluginEnabled = false;

            // Functions for the NavBar
            vm.goBack = goBack;
            vm.toggle = toggle;

            // Function for the main View
            vm.setName = setName;
            vm.setHUE = setHUE;
            vm.setSAT = setSAT;
            vm.setBRI = setBRI;

            vm.alert = alert;

            init();

            function goBack() {
                $window.history.back();
            }

            function setName() {
                hue.setLightName(vm.key, vm.name).then();
            }

            function toggle() {
                hue.setLightState(vm.key, {on: vm.on}).then();
            }

            function setHUE() {
                hue.setLightState(vm.key, {hue: vm.state.hue}).then();
            }

            function setSAT() {
                hue.setLightState(vm.key, {sat: vm.state.sat}).then();
            }

            function setBRI() {
                hue.setLightState(vm.key, {bri: vm.state.bri}).then();
            }

            function alert() {
                hue.setLightState(vm.key, {alert: 'select'}).then(function (state) {
                    //hue.setLightState(vm.key, {alert: 'none'}).then();
                });
            }

            function init() {
                vm.pluginEnabled = hue.getLight(vm.key).then(function (state) {
                    return state.on;
                });
            }

        })

        .controller('ShakeCtrl', function($window, $stateParams, $localStorage) {
            var vm = this;

            vm.name = $stateParams.name;
            vm.on = $stateParams.on;
            vm.pluginEnabled = false;

            // Functions for the NavBar
            vm.goBack = goBack;
            vm.toggle = toggle;

            init();

            function goBack() {
                $window.history.back();
            }

            function toggle() {
                $localStorage.shakeEnabled = vm.on;
            }

            function init() {
                if (typeof shake !== "undefined") {
                    vm.pluginEnabled = true;
                }
            }

        })

        .controller('AmbiCtrl', function($scope, $rootScope, $window, $stateParams, $localStorage, ambi, hue) {
            var vm = this;

            vm.lights = {};
            vm.name = $stateParams.name;
            vm.on = $stateParams.on;
            vm.pluginEnabled = false;

            // Functions for the NavBar
            vm.goBack = goBack;
            vm.toggle = toggle;
            vm.toggleLight = toggleLight;

            init();

            function goBack() {
                $window.history.back();
            }

            function toggle() {
                if (vm.on) {
                    ambi.startRunner($rootScope);
                } else {
                    ambi.stopRunner($rootScope);
                }
            }

            function init() {
                vm.pluginEnabled = ambi.isEnabled();
                ambi.getTopology().then(function (topology) {
                    vm.topology = topology.plain();
                });
                hue.getLights().then(function (lights) {
                    vm.lights = lights.plain();
                });
                vm.config = $rootScope.config = $localStorage.config;
            }

            function getMaxKey(obj) {
                var max = 0;

                for (var o in obj) {
                    max = (parseInt(o) > max) ? parseInt(o) : max;

                }
                return max;

            }

            function toggleLight(orientation, num) {
                if ($rootScope.config && $rootScope.config[orientation]) {
                    var state = $rootScope.config[orientation][num];
                    if (state) {
                        if (state < getMaxKey(vm.lights))
                            state++;
                        else
                            state = "";

                        $rootScope.config[orientation][num] = state;
                        vm.config = $rootScope.config;
                        $localStorage.config = $rootScope.config;
                    } else {
                        $rootScope.config[orientation][num] = 1;
                        vm.config = $rootScope.config;
                        $localStorage.config = $rootScope.config;
                    }
                } else {
                    if (!$rootScope.config)
                        $rootScope.config = {};

                    $rootScope.config[orientation] = {};
                    $rootScope.config[orientation][num] = 1;
                    vm.config = $rootScope.config;
                    $localStorage.config = $rootScope.config;
                }
            }
        });

    })();