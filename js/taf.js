var dbpv_taf_actions = [];

function tafAdd(action) {
	dbpv_taf_actions.push(action);
}

function TafAction() {
	dbpv_taf_actions.push(this);
}

TafAction.prototype.autobind = function (about, predicate, value) {
	if (value.taf !== undefined) {
		if (value.taf[this.id] === undefined) {
			value.taf[this.id] = {"init":false};
		}
		if (!value.taf[this.id].init) {
			this.initialize(about, predicate, value);
			value.taf[this.id].init = true;
		}else{
			return this.check(about, predicate, value);
		}
	}else{
		return false;
	}
};

TafAction.prototype.initialize = function (about, predicate, value) {
//	alert("initializing");
};

TafAction.prototype.check = function (about, predicate, value) {
	return true;
};

// XXX XXX XXX TAF MkIII ACTIONS XXX XXX XXX

TafLodlive.prototype = new TafAction();
function TafLodlive () {
	TafAction.call(this);
}








//XXX XXX XXX ACTIONS DECLARE BELOW THIS LINE XXX XXX XXX

// SPOTLIGHT ANNOTATIONS

var dbpv_taf_spotlight = new TafAction();

dbpv_taf_spotlight.id = "spotlight";
dbpv_taf_spotlight.description = "Annotate with DBpedia Spotlight";

dbpv_taf_spotlight.initialize = function (about, predicate, value) {
	value.taf.spotlight.busy = false;

	if (dbpv_taf_spotlight.service === undefined) {
		dbpv_taf_spotlight.service = angular.element("body").injector().get('Spotlight');
	}
};

dbpv_taf_spotlight.check = function (about, predicate, value) {
	return value.type == "literal" && value.value.length>50;
};

dbpv_taf_spotlight.display = function (about, predicate, value) {
	//alert(JSON.stringify(value.taf.spotlight));
	if (value.taf.spotlight.busy) {
		return "<span class='glyphicon glyphicon-time'></span>";
	}else{
		return "<span class='glyphicon glyphicon-bullhorn'></span>";
	}
};

dbpv_taf_spotlight.execute_callback = function (data, value) {
	value.taf.spotlight.busy = false;
	if (data !== undefined && data["Resources"] !== undefined) {
		var annotations = data["Resources"];
		var text = value.value;
		var previndex = 0;
		var pieces = [];
		for (var i = 0; i<annotations.length; i++) {
			var annotation = annotations[i];
			var offset = parseInt(annotation["@offset"]);
			var len = annotation["@surfaceForm"].length;
			var link = annotation["@URI"];
			link = dbpv_preprocess_triple_url(link);
			link = '<a dbpv-preview="'+link+'" href="'+link+'">';
			pieces.push(text.substring(previndex, offset));
			pieces.push(link+text.substr(offset, len)+"</a>");
			previndex = offset+len;
		}
		pieces.push(text.substr(previndex));
		value.label = pieces.join("");
		$compile(value.label);
	}

	//value.label = JSON.stringify(data);
	//alert(JSON.stringify(pieces));
};

dbpv_taf_spotlight.execute = function (about, predicate, value) {
	if (!value.taf.spotlight.busy) {
		dbpv_taf_spotlight.service.annotate_async(value.value, dbpv_taf_spotlight.execute_callback, value);
		value.taf.spotlight.busy = true;
	} else {
		alert("Annotation request to the DBpedia Spotlight API is already pending");
	}
};


// AUTO-EXECUTING ACTION ENABLING A MAP AND SHOWING COORDINATES THERE

var dbpv_taf_prettymap = new TafAction();

dbpv_taf_prettymap.id = "prettymap";
dbpv_taf_prettymap.description = "Pretty Map";

dbpv_taf_prettymap.initialize = function (about, predicate, value) {
	if (dbpv_taf_prettymap.check (about, predicate, value)) {
		dbpv_taf_prettymap.execute (about, predicate, value);
	}
};

dbpv_taf_prettymap.check = function (about, predicate, value) {
	if (predicate.uri == "http://www.georss.org/georss/point") {
		return true;
	}else {
		return false;
	}
};

dbpv_taf_prettymap.display = function (about, predicate, value) {
	return "";
};

dbpv_taf_prettymap.execute = function (about, predicate, value) {
//	alert("building map");
	var coord = value.value;
	var matches = coord.match(/([-+]?([0-9]*\.[0-9]+|[0-9]+))\s([-+]?([0-9]*\.[0-9]+|[0-9]+))/);
	var lon = matches[1];
	var lat = matches[3];
	coord = [lon, lat];
	$('#dbpvpmap').attr("class", "dbpvpmap-active");
//	$('#dbpvpmapcontainer').html("<leaflet></leaflet>");
	var map = L.map('dbpvpmap').setView(coord, 10);
	L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
		attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a>'
	}).addTo(map);
	L.marker(coord).addTo(map);

};

// VIEW IN LODLIVE (only for DBpedia entities) (example of a simple action)

var dbpv_taf_lodlive =  new TafAction();

dbpv_taf_lodlive.id = "lodlive";
dbpv_taf_lodlive.description = "View in LODLive";

dbpv_taf_lodlive.check = function (about, predicate, value) {
	return value.type == "uri" && value.prefix == "dbpedia";
};

dbpv_taf_lodlive.display = function (about, predicate, value) {
	return "<span class='glyphicon glyphicon-globe'></span>";
};

dbpv_taf_lodlive.execute = function (about, predicate, value) {
	var lodurl = "http://en.lodlive.it/?";
	window.open(lodurl+value.uri);
};


// EXAMPLE OF AN ACTION WITH LOCAL STATE
var dbpv_taf_dummy = new TafAction();

dbpv_taf_dummy.id = "dummy";

dbpv_taf_dummy.display_inactive = "<span class='glyphicon glyphicon-play'></span>";
dbpv_taf_dummy.display_active = "<span class='glyphicon glyphicon-cog'></span>";


dbpv_taf_dummy.initialize = function (about, predicate, value) {
	value.taf.dummy.active = false;
};

dbpv_taf_dummy.check = function (about, predicate, value) {			 //return Boolean whether applicable or not
	return value.type!="uri";
};

dbpv_taf_dummy.display = function (about, predicate, value) {
	if (value.taf.dummy.active) {
		return dbpv_taf_dummy.display_active;
	}else{
		return dbpv_taf_dummy.display_inactive;
	}
};

dbpv_taf_dummy.execute = function (about, predicate, value) {			 // called when user clicks the action button
	if (value.taf.dummy.active) {
		value.label += "_tss";
		value.taf.dummy.active = false;
	}else{
		value.label += "_badum";
		value.taf.dummy.active = true;
	}
};

// EXAMPLE OF AN ACTION WITH GLOBAL STATE
/*var dbpv_taf_global = new TafAction();

dbpv_taf_global.id = "global";
dbpv_taf_global.clicks = 0;

dbpv_taf_global.display_inactive = "<span class='glyphicon glyphicon-search'></span>";
dbpv_taf_global.display_active = "<span class='glyphicon glyphicon-qrcode'></span>";

dbpv_taf_global.initialize = function (about, predicate, value) {
	value.taf.global.active = false;
};

dbpv_taf_global.check = function (about, predicate, value) {
	return dbpv_taf_global.clicks < 4 && value.type == "uri";
};

dbpv_taf_global.display = function (about, predicate, value) {
	if (dbpv_taf_global.clicks % 2 == 0) {
		return dbpv_taf_global.display_active;
	}else{
		return dbpv_taf_global.display_inactive;
	}
};

dbpv_taf_global.execute = function (about, predicate, value) {
	dbpv_taf_global.clicks += 1;
};
*/