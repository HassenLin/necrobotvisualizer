var Map = function(mapDiv,streetViewDiv) {


    //this.layerCatches = L.markerClusterGroup({ maxClusterRadius: 30 });
    //this.layerPath = new L.LayerGroup();
    this.map = null;    
        
    this.destination = null;

    this.steps = [];
    this.catches = [];
    this.pokestops = [];
    this.pokemonList = [];
    this.divMap = document.getElementById(mapDiv);
    this.divStreetView = document.getElementById(streetViewDiv);
};
Map.prototype.setGMapPosition = function(nowLat,nowLng) {
	if(this.map == null)
	{
		$(".loading").hide();
		var LatLng=new google.maps.LatLng( nowLat, nowLng );
		this.map = new google.maps.Map(this.divMap,{
			center:LatLng,
      zoom: 18,
      streetViewControl : false          
    });
		this.map.addListener('dblclick',this.setDestination); 
  	this.flightPolyline= new google.maps.Polyline({
        	geodesic: true,
        	strokeColor: '#131540',
        	strokeOpacity: 0.6,
        	strokeWeight: 2
        });
    this.flightPolyline.setMap(this.map);
    this.flightPath = this.flightPolyline.getPath();
    this.me = new google.maps.Marker({
          position: LatLng,
        	title: 'Player',
        	map: this.map,
        	zIndex: google.maps.Marker.MAX_ZINDEX + 1,
        	icon: './assets/img/Poke_Ball.png',
        	details: {
          	database_id: 42,
          	author: 'Hassen'
          }
        });  
      this.me.addListener('click',function(e){
          	global.ws.send('{"Command":"GetTrainerProfile","RequestID":"1"}');
          });   
      this.me.addListener('mouseover',function(e){
          });   
	    if(global.config.showStreetView)
  	  {      	
  	  	this.streetview = new google.maps.StreetViewPanorama(this.divStreetView,{
        	position:LatLng,
        	map: this.map
        });   
      	google.maps.event.trigger(this.map, "resize");
    	}
  		else
    	{
    		$("#streetview").hide();
      	this.divMap.style.width="100%";
      	google.maps.event.trigger(this.map, "resize");
    	}
  }
  else
  {
  	var LatLng=new google.maps.LatLng( nowLat, nowLng );
  	if(global.config.followPlayer)
    	this.map.panTo(LatLng);
    this.flightPath.push(LatLng);
   	this.me.setPosition(LatLng);
    
    if(global.config.showStreetView)
    {
     	this.streetview.setPosition(LatLng);
    	this.streetview.setVisible(true);

    }
  }
  
};
Map.prototype.saveContext = function() {
    var stops = Array.from(this.pokestops, p => {
        return {
            id: p.id,
            lat: p.lat,
            lng: p.lng,
            name: p.name,
            visited: p.visited
        }
    });

    sessionStorage.setItem("available", true);
    sessionStorage.setItem("steps", JSON.stringify(this.steps));
    sessionStorage.setItem("catches", JSON.stringify(this.catches));
    sessionStorage.setItem("pokestops", JSON.stringify(stops));
}

Map.prototype.loadContext = function() {
    try {
        if (sessionStorage.getItem("available") == "true") {
            console.log("Load data from storage to restore session");

            this.steps = JSON.parse(sessionStorage.getItem("steps")) || [];
            this.catches = JSON.parse(sessionStorage.getItem("catches")) || [];
            this.pokestops = JSON.parse(sessionStorage.getItem("pokestops")) || [];

            if (this.steps.length > 0) this.initPath();

            this.initPokestops();
            this.initCatches();

            sessionStorage.setItem("available", false);
        }
    } catch(err) { console.log(err); }
}

Map.prototype.initPath = function() {
    var last = this.steps[this.steps.length - 1];
    this.setGMapPosition(last.lat,last.lng);
    
    
    this.flightPolyline.setMap(null);
    this.flightPolyline= new google.maps.Polyline({
        	geodesic: true,
        	strokeColor: '#131540',
        	strokeOpacity: 0.6,
        	strokeWeight: 2
    });
    this.flightPolyline.setMap(this.map);
    this.flightPath = this.flightPolyline.getPath();
    if (this.steps.length >= 1) {
        var pts = Array.from(this.steps, pt => L.latLng(pt.lat, pt.lng));
        for (i = 0, len = pts.length; i < len; i++) {
        	this.flightPath.push(new google.maps.LatLng( pts[i].lat,  pts[i].lng ));
        }
        return true;
      } 
    

    return false;
}

Map.prototype.initCatches = function() {
    for (var i = 0; i < this.catches.length; i++) {
        var pt = this.catches[i];
        var pkm = `${pt.name} \n Cp:${pt.cp} Iv:${pt.iv}%`;
        if (pt.lvl) {
            pkm = `${pt.name} (lvl ${pt.lvl}) \n Cp:${pt.cp} Iv:${pt.iv}%`;
        }
        var LatLng=new google.maps.LatLng( pt.lat, pt.lng );
        new google.maps.Marker({
          position: LatLng,
        	map: this.map, 
        	title: pkm,
        	icon: `./assets/pokemon_small/${pt.id}.png`
        });
        if(global.config.showStreetView)
        {
        	new google.maps.Marker({
	          position: LatLng,
	          map: this.streetview,
	        	title: pkm,
	        	icon: `./assets/pokemon/${pt.id}.png`
          });
        }
    }
}

Map.prototype.initPokestops = function() {
    for (var i = 0; i < this.pokestops.length; i++) {
        var pt = this.pokestops[i];
        var iconurl = pt.visited  ? `./assets/img/pokestop_visited.png` : `./assets/img/pokestop_available.png`;
        var LatLng=new google.maps.LatLng( pt.lat, pt.lng );
        pt.marker =  new google.maps.Marker({
          position: LatLng,
          map: this.map, 
        	title: pt.name,
        	icon: iconurl
        });
 				if(global.config.showStreetView)
        {
        	pt.marker2=new google.maps.Marker({
	          position: LatLng,
	          map: this.streetview,
	        	title: pt.name,
	        	icon: iconurl
          });
        }        
    }
}

Map.prototype.addToPath = function(pt) {
    this.steps.push(pt);
    if (global.config.memory.limit && this.steps.length > global.config.memory.mathPath) {
        //this.layerPath.clearLayers();
        var max = Math.floor(global.config.memory.mathPath * 0.7);
        this.steps = this.steps.slice(-max);
    }
    this.setGMapPosition(pt.lat,pt.lng);
}

Map.prototype.addCatch = function(pt) {

    if (!pt.lat) {
        if (this.steps.length <= 0) return;
        var last = this.steps[this.steps.length - 1];
        pt.lat = last.lat;
        pt.lng = last.lng;
    }

    var pkm = `${pt.name}\n CP:${pt.cp} IV:${pt.iv}%`;
    if (pt.lvl) {
        pkm = `${pt.name} (lvl ${pt.lvl}) \n Cp:${pt.cp} Iv:${pt.iv}%`;
    }

    this.catches.push(pt);

    if (global.config.memory.limit && this.catches.length > global.config.memory.maxCaught) {
        console.log("Clean catches");
        var max = Math.floor(global.config.memory.maxCaught * 0.7);
        this.catches = this.catches.slice(-max);
        //this.layerCatches.clearLayers();
        this.initCatches();
    } else {
				var LatLng=new google.maps.LatLng( pt.lat, pt.lng );
				
        new google.maps.Marker({
          position: LatLng,
          map: this.map, 
        	title: pkm,
        	icon: `./assets/pokemon_small/${pt.id}.png`,
        });
        if(global.config.showStreetView)
        {
        	new google.maps.Marker({
	          position: LatLng,
	          map: this.streetview,
	        	title: pkm,
        	  icon: `./assets/pokemon/${pt.id}.png`
          });
        } 
    }
}

Map.prototype.addVisitedPokestop = function(pt) {
    if (!pt.lat) return;

    var ps = this.pokestops.find(ps => ps.id == pt.id);
    if (!ps) {
        this.pokestops.push(pt);
        ps = pt;
        if(this.map==null)
					this.setGMapPosition(pt.lat,pt.lng);
				var LatLng=new google.maps.LatLng( pt.lat, pt.lng );	
        pt.marker = new google.maps.Marker({
          position: LatLng,
          map: this.map, 
        	title: pt.name,
        	icon: './assets/img/pokestop_cooldown.png'
        });
        if(global.config.showStreetView)
        {
        	pt.marker2 = new google.maps.Marker({
	          position: LatLng,
	          map: this.streetview,
	        	title: pt.name,
        	  icon: './assets/img/pokestop_cooldown.png'
          });
        } 

    } else {
        Object.assign(ps, pt);
    }

    ps.visited = true;
    if (ps && ps.marker) {
        ps.marker.setIcon(`./assets/img/pokestop_cooldown.png`);        
        if(global.config.showStreetView)
           ps.marker2.setIcon(`./assets/img/pokestop_cooldown.png`);        
        if (ps.name)
        {
        	ps.marker.setTitle(ps.name);
        	if(global.config.showStreetView)
        	  ps.marker2.setTitle(ps.name);
        }
    }
}

Map.prototype.addPokestops = function(forts) {

    for(var i = 0; i < forts.length; i++) {
        var pt = forts[i];
        var ps = this.pokestops.find(ps => ps.id == pt.id);
        if (ps) pt = Object.assign(ps, pt);
        else this.pokestops.push(pt);

        var icon = "pokestop_available";
        if (pt.cooldown && moment(pt.cooldown).isAfter()) {
            icon = "pokestop_cooldown";
        } else if (pt.lureExpire && moment(pt.lureExpire).isAfter()) {
            icon = "pokestop_lure";
        } else if (pt.visited) {
            icon = "pokestop_visited";
        }

        if (!pt.marker) {
        		if(this.map==null)
							this.setGMapPosition(pt.lat,pt.lng);
        	 	var LatLng=new google.maps.LatLng( pt.lat, pt.lng );	
        	 	if(!pt.name)
        	 	  pt.name="Unknow";
        		pt.marker = new google.maps.Marker({
          	  position: LatLng,
          		map: this.map, 
        			title: pt.name,
        			icon: `./assets/img/${icon}.png`        			
        		});
        		if(global.config.showStreetView)
        		{
        			pt.marker2 = new google.maps.Marker({
	          		position: LatLng,
	         			map: this.streetview,
	        			title: pt.name,
        		  	icon: `./assets/img/${icon}.png`
          		});
        		} 
        } else {
            pt.marker.setIcon(`./assets/img/${icon}.png`);
            if(global.config.showStreetView)
            	pt.marker2.setIcon(`./assets/img/${icon}.png`);
        }
    }

    if (global.config.memory.limit && this.pokestops.length > global.config.memory.maxPokestops) {
        // to much pokestops, remove some starting with unvisited ones
    }
}

Map.prototype.updatePokestopsStatus = function() {
    this.pokestops.forEach(pt => {
        var needUpdate = false;
        if (pt.cooldown && moment(pt.cooldown).isBefore()) {
            pt.cooldown = null;
            needUpdate = true;
        } else if (pt.lureExpire && moment(pt.lureExpire).isBefore()) {
            pt.lureExpire = null;
            needUpdate = true;
        }

        if (needUpdate) {
            var icon = "pokestop_available";
            if (pt.cooldown && moment(pt.cooldown).isAfter()) {
                icon = "pokestop_cooldown";
            } else if (pt.lureExpire && moment(pt.lureExpire).isAfter()) {
                icon = "pokestop_lure";
            } else if (pt.visited) {
                icon = "pokestop_visited";
            }
            pt.marker.setIcon(`./assets/img/${icon}.png`);
            if(global.config.showStreetView)
              pt.marker2.setIcon(`./assets/img/${icon}.png`);
        }
    });
}

Map.prototype.setRoute = function(route) {
    var points = Array.from(route, pt => L.latLng(pt.lat, pt.lng));
    for (i = 0, points = pts.length; i < len; i++) {
        	this.setGMapPosition( points[i].lat,  points[i].lng );
        }
}

Map.prototype.displayPokemonList = function(all, sortBy, eggs) {
    console.log("Pokemon list");
    global.active = "pokemon";
    this.pokemonList = all || this.pokemonList;
    this.eggsCount = (eggs || this.eggsCount) || 0;
    if (!sortBy) {
        sortBy = localStorage.getItem("sortPokemonBy") || "cp";
    } else {
        localStorage.setItem("sortPokemonBy", sortBy);
    }

    if (sortBy == "pokemonId") {
        this.pokemonList = this.pokemonList.sort((p1, p2) => {
            if (p1[sortBy] != p2[sortBy]) {
                return p1[sortBy] - p2[sortBy];
            }
            var sort2 = p2["cp"] != p1["cp"] ? "cp" : "iv";
            return p2[sort2] - p1[sort2];
        });
    } else {
        this.pokemonList = this.pokemonList.sort((p1, p2) => {
            if (p1[sortBy] != p2[sortBy]) {
                return p2[sortBy] - p1[sortBy];
            } else if (p1["pokemonId"] != p2["pokemonId"]) {
                return p1["pokemonId"] - p2["pokemonId"];
            } else {
                var sort2 = (sortBy == "cp") ? "iv" : "cp";
                return p2[sort2] - p1[sort2];
            }
        });
    }

    var total = this.eggsCount + this.pokemonList.length;
    $(".inventory .numberinfo").text(`${total}/${global.storage.pokemon}`);
    var div = $(".inventory .data");
    div.html(``);
    this.pokemonList.forEach(function(elt) {
        var canEvolve = elt.canEvolve && !elt.inGym && elt.candy >= elt.candyToEvolve;
        var evolveStyle = canEvolve ? "" : "hide";
        var evolveClass = canEvolve ? "canEvolve" : "";
        var transferClass = elt.favorite ? "hide" : "";
        var candyStyle = elt.canEvolve ? "" : "style='display:none'";
        var fav = elt.favorite ? "set" : "unset";
        div.append(`
            <div class="pokemon">
                <div class="transfer" data-id='${elt.id}'>
                    <a title='(Un)Favorite' href="#" class="favoriteAction"><img src="./assets/img/favorite_${fav}.png" /></a>
                    <a title='Transfer' href="#" class="transferAction ${transferClass}"><img src="./assets/img/recyclebin.png" /></a>
                    <a title='Evolve' href="#" class="evolveAction ${evolveStyle}"><img src="./assets/img/evolve.png" /></a>
                </div>
                <span class="imgspan ${evolveClass}"><img src="./assets/pokemon/${elt.pokemonId}.png" /></span>
                <span class="name">${elt.name} lvl ${elt.lvl}</span>
                <span class="info">CP: <strong>${elt.cp}</strong> IV: <strong>${elt.iv}%</strong></span>
                <span class="info">Candy: ${elt.candy}<span ${candyStyle}>/${elt.candyToEvolve}</span></span>
            </div>
        `);
    });
    $(".pokemonsort").show();
    $(".inventory").show().addClass("active");
}

Map.prototype.displayEggsList = function(eggs) {
    console.log("Eggs list");
    global.active = "eggs";
    $(".inventory .sort").hide();
    $(".inventory .numberinfo").text(eggs.length + "/9");
    var div = $(".inventory .data");
    div.html("");
    eggs.forEach(function(elt) {
        if (elt) {
            div.append(`
                <div class="egg">
                    <span class="imgspan"><img src="./assets/inventory/${elt.type}.png" /></span>
                    <span>${elt.doneDist.toFixed(1)} / ${elt.totalDist.toFixed(1)} km</span>
                </div>
            `);
        }
    });
    $(".inventory").show().addClass("active");
};

Map.prototype.displayInventory = function(items) {
    console.log("Inventory list");
    global.active = "inventory";
    $(".inventory .sort").hide();
    var count = items.filter(i => i.itemId != 901).reduce((prev, cur) => prev + cur.count, 0);
    $(".inventory .numberinfo").text(`${count}/${global.storage.items}`);
    var div = $(".inventory .data");
    div.html(``);
    items.forEach(function(elt) {
        var dropStyle = elt.itemId == 901 ? "hide" : "";
        div.append(`
            <div class="item">
                <div class="transfer" data-id='${elt.itemId}' data-count='${elt.count}'>
                    <a title='Drop' href="#" class="dropItemAction ${dropStyle}"><img src="./assets/img/recyclebin.png" /></a>
                </div>

                <span class="count">x${elt.count}</span>
                <span class="imgspan"><img src="./assets/inventory/${elt.itemId}.png" /></span>
                <span class="info">${elt.name}</span>
            </div>
        `);
    });
    $(".inventory").show().addClass("active");
};

Map.prototype.setDestination = function(e){

    var lat=e.latLng.lat(),lng=e.latLng.lng();
		console.log('Set destination:'+lat.toString()+","+lng.toString());
		if (this.destination) {
   		this.destination.setMap(null);
		}

	 this.destination = new google.maps.Marker({
      position: e.latLng,
    	map: this, 
			title: 'destination',
			icon: 'assets/img/marker-icon-red.png'
		});
		this.destination.setMap(this);
		global.ws.send(JSON.stringify(
			{
				Command:"SetDestination",
				RequestID:"1",
				lat:lat,
				lng:lng
			}));
};
Map.prototype.manualDestinationReached = function() {
		this.destination.setMap(null);
    this.destination = null;
};



// Add event for single click
/*
L.Evented.addInitHook( function () {
    this._singleClickTimeout = null;
    this.on('click', this._scheduleSingleClick, this);
    this.on('dblclick dragstart zoomstart', this._clearSingleClickTimeout.bind(this), this);
});

L.Evented.include({
    _scheduleSingleClick: function(e) {
        this._clearSingleClickTimeout();
        this._singleClickTimeout = setTimeout(this._fireSingleClick.bind(this, e), 500)
    },

    _fireSingleClick: function(e){
        if (!e.originalEvent._stopped) {
            this.fire('singleclick', L.Util.extend(e, { type : 'singleclick' }));
        }
    },

    _clearSingleClickTimeout: function(){
        if (this._singleClickTimeout != null) {
            clearTimeout(this._singleClickTimeout);
            this._singleClickTimeout = null;
        }
    }
});
*/
