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

        .controller('StartCtrl', function($scope,$localStorage,$state,$stateParams,$mdDialog,$log,$q,hue) {
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
                if (typeof StatusBar !== "undefined") {
                } else {
                    $log.warn('Plugin: StatusBar not available. No emulation available');
                }
                // try to get a HUE Bridge IP Address and save it to the scope of the controller
                $log.info("start.init()");
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

        .controller('HomeCtrl', function($scope,$rootScope,$localStorage,$state,$stateParams,$interval,$log,$mdDialog,hue,ambi) {
            var vm = this;

            vm.lights = null;
            vm.username = $stateParams.user;

            vm.shakeEnabled = $localStorage.shakeEnabled ? $localStorage.shakeEnabled : false;
            vm.shakePlugin = false;

            vm.ambilightEnabled = false;
            vm.ambiPlugin = false;

            vm.go = go;
            vm.hasShakePlugin = hasShakePlugin;
            vm.hasAmbilightPlugin = hasAmbilightPlugin;
            vm.getLights = getLights;
            vm.topology = getTopology;
            vm.toggleLightState = toggleLightState;
            vm.toggleShake = toggleShake;
            vm.toggleAmbilight = toggleAmbilight;

            _init();

            function _init() {
                // get all Lights at initalization phase
                hue.getInstance().then(function () {
                    $log.info("user: " + vm.username);
                    hue.setUser(vm.username);
                    getLights();
                });

                if (typeof shake !== "undefined") {
                    $log.info("activating shake gesture");
                    vm.shakePlugin = true;
                    shake.stopWatch();
                    shake.startWatch(onShake);
                } else {
                    $log.warn('Plugin: shake not available. No emulation available');
                }

                ambi.getInstance().then(function () {
                    vm.ambiPlugin = true;
                    vm.topology = getTopology();
                    $scope.$on('processed', function (event, processed) {
                        setLightColor(1, processed.layer1.left[0]);
                        setLightColor(2, processed.layer1.right[0]);
                    });
                });
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

            function getTopology() {
                ambi.getTopology().then(function (topology) {
                    return topology;
                });
            }

            function getLights() {
                hue.getLights().then(function (lights) {
                    $log.info("HUE-Lights...: ", lights.plain());
                    vm.lights = lights.plain();
                }, function (error) {
                    $log.error("light.error:", error);
                });
            }

            function toggleAmbilight() {
                if (vm.ambiPlugin) {
                    if (vm.ambilightEnabled) {
                        $log.info("==== START ====");
                        ambi.startRunner($rootScope);
                    } else {
                        $log.info("==== END ====");
                        ambi.stopRunner($rootScope);
                    }
                }
            }

            function toggleLightState(key) {
                $log.info("KEY: " + key + ", ON: " + vm.lights[key].state.on);
                hue.setLightState(key, {on: vm.lights[key].state.on}).then(function (state) {
                    $log.info("toggle-state-result: " + JSON.stringify(state));
                    vm.lights[key].state.on = state[0].success["/lights/" + key + "/state/on"];
                });
            }

            function toggleShake() {
                $localStorage.shakeEnabled = vm.shakeEnabled;
            }

            function onShake() {
                if (vm.shakeEnabled) {
                    $log.info("Shake it baby");
                    angular.forEach(vm.lights, function (light,key) {
                        vm.lights[key].state.on = !vm.lights[key].state.on;
                        toggleLightState(key);
                    });
                }
            }

            function setLightColor(key, color) {
                var r = color.r;
                var g = color.g;
                var b = color.b;

                var xy = new colors().rgbToCIE1931(r,g,b);
                // $log.info(key + ": (" + xy[0] + ", " + xy[1] + ")");
                hue.setLightState(key, {xy: xy}).then();
            }

        })

        .controller('LightCtrl', function($log, $window, $stateParams, hue) {
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

            function _printState(state) {
                $log.info("STATE: " + JSON.stringify(state));
            }

            function setName() {
                hue.setLightName(vm.key, vm.name).then(_printState);
            }

            function toggle() {
                hue.setLightState(vm.key, {on: vm.on}).then(_printState);
            }

            function setHUE() {
                $log.info("key: " + vm.key + ", hue: " + vm.state.hue);
                hue.setLightState(vm.key, {hue: vm.state.hue}).then(_printState);
            }

            function setSAT() {
                $log.info("key: " + vm.key + ", sat: " + vm.state.sat);
                hue.setLightState(vm.key, {sat: vm.state.sat}).then(_printState);
            }

            function setBRI() {
                $log.info("key: " + vm.key + ", bri: " + vm.state.bri);
                hue.setLightState(vm.key, {bri: vm.state.bri}).then(_printState);
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

        .controller('ShakeCtrl', function($log, $window, $stateParams, $localStorage) {
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
                $log.info("ON: " + vm.on);
                $localStorage.shakeEnabled = vm.on;
            }

            function init() {
                if (typeof shake !== "undefined") {
                    vm.pluginEnabled = true;
                }
            }

        })

        .controller('AmbiCtrl', function($log, $scope, $window, $stateParams, ambi) {
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

            function toggle(scope) {
                if (vm.on) {
                    $log.info("==== START ====");
                    ambi.startRunner($rootScope);
                } else {
                    $log.info("==== END ====");
                    ambi.stopRunner($rootScope);
                }
            }

            function init() {
                vm.pluginEnabled = ambi.isEnabled();
            }
        });

    })();