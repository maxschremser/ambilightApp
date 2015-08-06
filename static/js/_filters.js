    (function() {
        "use strict";
        angular.module('ambilight.core')

        //.value('appName', 'ambilight')
        //.value('version', '0.0.1')
        //.value('username', '')


        .filter('range', function() {
            return function(input, total) {
                total = parseInt(total);
                for (var i=0; i<total; i++)
                    input.push(i);
                return input;
            };
        })
    })();
