var fs = require('fs');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
var svgString = fs.readFileSync("./administrative_regions.svg");
const dom = new JSDOM(svgString);

var window = dom.window;

function htmlWrapper(svgString)
{
    return "<!DOCTYPE html><html><head></head><body>" + svgString + "</body></html>";
}

function transformationFunction(coord)
{
    return [(coord[0] + 180.3)*3.697541135, (-coord[1] + 83.9)*3.878341728];
}

function drawPath(fromLatLng, toLatLng)
{
    var svg = dom.window.document.querySelector("svg");
    
    return function path(clear)
    {
        if(!clear) clear = false;
        var fromT = transformationFunction(fromLatLng);
        var toT = transformationFunction(toLatLng);
        var pathElem = dom.window.document.createElement('path');
        var path = "M" + fromT[0] + " " + fromT[1] + "L" + toT[0] + " " + toT[1];
        pathElem.setAttribute("d", path);
        svg.appendChild(pathElem);
        
        return htmlWrapper(svg.outerHTML);
    }
}

var htmlString = drawPath([19.33250617980957, 47.053844451904411], [21.251041412353629, 48.055007934570312])(false);

fs.writeFileSync('./path.html', htmlString);
