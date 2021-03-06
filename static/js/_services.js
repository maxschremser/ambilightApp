    (function() {
        "use strict";

        angular.module("hue", ['restangular', 'ngStorage'])
            .factory("hue", function(Restangular, $q) {

                var enabled = false;
                var baseRoute = null;
                var apiRoute = null;
                var userRoute = null;
                var baseUrl = "";
                var username = "";

                _init();

                function _init() {
                    _instance().then(function (found) {
                        enabled = true;
                    }, function (err) {
                        throw err;
                    });
                }

                function _instance() {
                    var url = "https://www.meethue.com/api/nupnp";
                    return Restangular.oneUrl("/", url).getList().then(function (conf) {
                        if (conf && conf.length == 1) {
                            var bridgeIP = conf[0].internalipaddress;
                            baseUrl = "http://" + bridgeIP;
                            enabled = true;
                            baseRoute = Restangular.withConfig(function (RestangularConfigurer) {
                                RestangularConfigurer.setBaseUrl(baseUrl);
                            });
                            return true;
                        } else {
                            throw {enabled: false, description: "No HUE Bridge was resolved in this network. Are you registered in a network with a HUE Bridge ?"};
                        }
                    });
                }

                function getInstance() {
                    return _instance();
                }

                function createUser() {
                    var username;
                    return baseRoute.all("api").customPOST({devicetype: "ambilightApp#ambilight"}).then(function (userConfig) {
                        if (userConfig && userConfig[0] && userConfig[0].success) {
                            username = userConfig[0].success.username;
                            return username;
                        } else {
                            throw userConfig[0].error;
                        }
                    });
                }

                function setUser(usr) {
                    username = usr;
                }

                function getUser(usr) {
                    username = usr;
                }

                function getUserRoute() {
                    if (!baseRoute) {
                        throw "No baseRoute defined!";
                    }
                    if (!userRoute) {
                        if (!apiRoute) {
                            apiRoute = baseRoute.all("api");
                        }
                        if (!username) {
                            throw "No user defined!";
                        }
                        userRoute = apiRoute.all(username);
                    }
                    return userRoute;
                }

                function getLights() {
                    if (getUserRoute()) {
                        return getUserRoute().one("lights").get();
                    } else {
                        throw "user api is not initialized!";
                    }
                }

                function getLight(key) {
                    if (getUserRoute()) {
                        return getUserRoute().one("lights", key).get();
                    } else {
                        throw "user api is not initialized!";
                    }
                }

                function setLightState(num, config) {
                    return getUserRoute().one("lights", num).one("state").customPUT(config);
                }

                function setLightName(num, name) {
                    return getUserRoute().one("lights", num).customPUT({name: name});
                }

                function isEnabled() {
                    return enabled;
                }

                return {
                    getInstance: getInstance,
                    createUser: createUser,
                    getUser: getUser,
                    setUser: setUser,
                    getLights: getLights,
                    getLight: getLight,
                    setLightState: setLightState,
                    setLightName: setLightName,
                    isEnabled: isEnabled
                };
            });

            angular.module("ambi", ['restangular', 'ngStorage'])
            .factory("ambi", function(Restangular, $q, $interval, $rootScope) {
                var baseUrl = "";
                var topology = {};
                var processed = {};
                var processedRoute = null;
                var cachedRoute = null;
                var modeRoute = null;
                var ambilightEnabled = false;

                _init();

                function _init() {
                    _instance().then(function (serviceUrl) {
                    }, function (err) {
                        log.error(err);
                    });
                }

                function getInstance() {
                    return _instance();
                }

                function _instance() {
                    var deferred = $q.defer();
                    if (typeof serviceDiscovery !== "undefined") {
                            serviceDiscovery.getNetworkServices("urn:schemas-upnp-org:device:MediaRenderer:all", false, function (devices) {
                                var serviceURL = _.result(_.find(devices, function (device) {
                                    return device.type == "urn:schemas-upnp-org:device:MediaRenderer:1";
                                }), "serviceURL");

                                _configure(serviceURL);
                                deferred.resolve(serviceURL);
                            }, function (error) {
                                throw error;
                            });
                    } else {
                        var serviceURL = "http://192.168.0.11:1925/1/";
                        _configure(serviceURL);
                        deferred.resolve(serviceURL);
                    }
                    return deferred.promise;
                }

                function getTopology() {
                    return Restangular.allUrl("topology", baseUrl).all("ambilight").one("topology").get().then(function (topology) {
                        return topology;
                    }, function (error) {
                        throw error;
                    });
                }

                function _configure(serviceURL) {
                    ambilightEnabled = true;
                    var url = document.createElement("a");
                    url.href = serviceURL;
                    baseUrl = "http://" + url.hostname + ":1925/1";
                    var baseRoute = Restangular.withConfig(function (RestangularConfigurer) {
                        RestangularConfigurer.setBaseUrl(baseUrl);
                    });
                    processedRoute = baseRoute.all("ambilight").one("processed");
                    cachedRoute = baseRoute.all("ambilight").one("cached");
                    modeRoute = baseRoute.all("ambilight").one("mode");
                }

                function getProcessed() {
                    return processed;
                }

                function startRunner($rootScope) {
                    if  (!angular.isDefined($rootScope.ambilightRunner)) {
                        $rootScope.ambilightRunner = $interval(function () {
                            // do something with hue
                            processedRoute.get().then(function (processedColors) {
                                processed = processedColors.plain();
                                $rootScope.$broadcast("processed", processed);
                            }, function (error) {
                            });
                        }, 300);
                    }
                }

                function stopRunner() {
                    if (angular.isDefined($rootScope.ambilightRunner)) {
                        $interval.cancel($rootScope.ambilightRunner);
                        $rootScope.ambilightRunner = undefined;
                    }
                }

                function isEnabled() {
                    return ambilightEnabled;
                }

                function setMode(mode) {
                    modeRoute.customPOST({current: mode}).then();
                }

                function setCached(rgb) {
                    cachedRoute.customPOST({r: rgb[0], g: rgb[1], b: rgb[2]}).then();
                }

                return {
                    getInstance: getInstance,
                    getTopology: getTopology,
                    getProcessed: getProcessed,
                    startRunner: startRunner,
                    stopRunner: stopRunner,
                    isEnabled: isEnabled,
                    setMode: setMode,
                    setCached: setCached
                };

            });
    })();

