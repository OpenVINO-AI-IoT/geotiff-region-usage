var fs = require('fs');
const process = require('process');
var data = fs.readFileSync(process.argv[2]);
var data = JSON.parse(data);

var geojson2svg = require('geojson-to-svg'); // factory
// if you want to re-use the renderer
var Renderer    = geojson2svg.Renderer;

// ES5
var locations = [];

var language = process.argv[3];

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

var svgString = geojson2svg()
  .styles({ 'MultiPolygon' : { fill: '#000000', stroke: '#000000', weight: 0.3 } })
  .projection(function(coord) {
    return [(coord[0] + 180.3)*3.697541135, (-coord[1] + 83.9)*3.878341728];
  })
  .data(data)
  .render();

fs.writeFileSync('./administrative_regions.svg', svgString);
