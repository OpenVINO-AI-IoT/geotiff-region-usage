var fs = require('fs');
const process = require('process');
var data = fs.readFileSync(process.argv[1]);
var data = JSON.parse(data);
// ES5
var locations = [];

var language = process.argv[2];

if (data['features'][0]['properties'].hasOwnProperty('name_' + language.toLowerCase())) {
    language = "name_" + language.toLowerCase();
} else {
    process.exit();
}

class Haversine {

    static get R() {
        return 6371;
    };
    static get km2miles() {
        return 0.621371;
    };
    
    static deg2rad(deg) {
        return deg * (Math.PI/180);
    }

    static square(x) { 
        return Math.pow(x, 2);
    }

    /* Distance between two lat/lng coordinates in km using the Haversine formula */

    static getDistanceFromLatLng(lat1, lng1, lat2, lng2, miles) { // miles optional

        if (typeof miles === "undefined"){miles=false;}

        var r=Haversine.R; // radius of the earth in km

        lat1=Haversine.deg2rad(lat1);
        lat2=Haversine.deg2rad(lat2);
        
        var lat_dif=lat2-lat1;
        var lng_dif=Haversine.deg2rad(lng2-lng1);
        var a=Haversine.square(Math.sin(lat_dif/2))+Math.cos(lat1)*Math.cos(lat2)*Haversine.square(Math.sin(lng_dif/2));
        var d=2*r*Math.asin(Math.sqrt(a));
        
        if (miles){ return d * Haversine.km2miles; } //return miles

        else{ return d; } //return km
    }

/* Copyright 2016, Chris Youderian, SimpleMaps, http://simplemaps.com/resources/location-distance
Released under MIT license - https://opensource.org/licenses/MIT */ 

    static get eccentricity() {
        return 0.006694380023;
    }

    static get eccentricityXY() {
        // return 0.006694380023;
        return {'ex': 0.009, 'ey': 0.006};
    }

    static getCoordinatesFromLatLng(lat, lng) {
        return {
            'cex': Haversine.getMercatorXFromOrigin(lat, lng),
            'cey': Haversine.getMercatorYFromOrigin(lat)
        };
    }

    static getMercatorXFromOrigin(lat, lng) {
        
        lat=Haversine.deg2rad(lat);
        lng=Haversine.deg2rad(lng);

        return BlankSVGMap.MAP['height'] / Math.PI * (0 - lng);
    }

    static getMercatorYFromOrigin(lat) {
        
        lat=Haversine.deg2rad(lat);

        return BlankSVGMap.MAP['height'] / Math.PI * Math.log((Math.tan(Haversine.deg2rad(45) + lat/2)) * 
        Math.pow((1 - Haversine.eccentricity * Math.sin(lat)) / (1 + Haversine.eccentricity * Math.sin(lat)), 0.5 * Haversine.eccentricity))
    }

}

data['features'].forEach(element => {
    const {properties, geometry} = element;
    const {coordinates} = geometry;
    const {iata_code, className, id} = properties;

    locations.push({
        'Dest': properties[language],
        'ID': iata_code,
        'Latitude': coordinates[1],
        'Longitude': coordinates[0],
        'Distances': null,
        'Scale': null,
        'Hex': null,
        'Sort_Order': null
    });
});

var distances = locations.map((location, index) => {
    var markers = locations.slice();

    var net_distance = 0.0;
    
    markers.map((marker, j) => {
        var dist = Haversine.getDistanceFromLatLng(location['Latitude'], location['Longitude'], marker['Latitude'], marker['Longitude']);
        net_distance += dist;
    });

    location['Distances'] = net_distance;
    
    return location;
});

function MinMaxScaler(distances) {
    var min_dist = Math.min.apply(null, distances);
    var max_dist = Math.max.apply(null, distances);

    var scale = distances.map((dist) => {
        return Math.round((dist - min_dist) / (max_dist - min_dist) * (19 - 0));
    });

    return scale;
}

var distances_array = distances.map((distance) => {
    return distance['Distances'];
});

var scales_array = MinMaxScaler(distances_array);

var scales = distances.map((distance, index) => {
    distance['Scale'] = scales_array[index];

    return distance;
});

var scaled_data = {};

scales.map((location) => {
    if (!scaled_data.hasOwnProperty(location['Scale'])) {
        scaled_data[location['Scale']] = [];
    }

    scaled_data[location['Scale']].push(location);
});

fs.writeFileSync('map_distances.js', 
"export default {\n\
    data: " + JSON.stringify(Object.values(scaled_data)) + "\n\
}");

console.log("`map_distances.js` file has been created");
