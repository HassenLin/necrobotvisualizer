(function() {

    function getURLParameter(sParam) {
        var sPageURL = window.location.search.substring(1);
        var sURLVariables = sPageURL.split('&');
        for (var i = 0; i < sURLVariables.length; i++)
        {
            var sParameterName = sURLVariables[i].split('=');
            if (sParameterName[0] == sParam)
            {
                return sParameterName[1];
            }
        }
    }

    var defaultConfig = {
        locale: "en",
        websocket: "wss://localhost:14251",
        followPlayer: false,
        noPopup: false,
        noConfirm: false,
        showStreetView: true,
        memory: {
            limit: false,
            maxCaught: 50,
            mathPath: 10000,
            maxPokestops: 250
        },
        version: "online"
    };

    var service = {};

   
        console.log("Load config from storage");
        defaultConfig.websocket = "ws://localhost:14252";

        service.load = function() {
            var config = Object.assign({}, defaultConfig);
            
            try
            {
            	var json = localStorage.getItem("config");
            	if (json) 
            		Object.assign(config, JSON.parse(json));
            } 
            catch (e) {
            	console.log(e);
            }

            var host = getURLParameter("websocket");
            if (host) config.websocket = host;

            // no ui, so force memory settings
            config.memory = defaultConfig.memory;

            return config;
        }

        service.save = function(config) {
            localStorage.setItem("config", JSON.stringify(config));
        }


    window.configService = service;

}());