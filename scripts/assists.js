"use strict";

const topLeftX = 20;
const topLeftY = 20;
const bottomRightX = 437;
const bottomRightY = 290;
const N_DICT = {'Champions League (2008/2009)': 1,
                'Champions League (2010/2011)': 1,
                'Champions League (2014/2015)': 1,
                'La Liga (2004/2005)': 7,
                'La Liga (2005/2006)': 17,
                'La Liga (2006/2007)': 26,
                'La Liga (2007/2008)': 28,
                'La Liga (2008/2009)': 31,
                'La Liga (2009/2010)': 35,
                'La Liga (2010/2011)': 33,
                'La Liga (2011/2012)': 37,
                'La Liga (2012/2013)': 32,
                'La Liga (2013/2014)': 31,
                'La Liga (2014/2015)': 38,
                'La Liga (2015/2016)': 33,
                'La Liga (2016/2017)': 34,
                'La Liga (2017/2018)': 36,
                'La Liga (2018/2019)': 34,
                'La Liga (2019/2020)': 33}

window.addEventListener("load", init);
var assistData;
var zoneData;

var xScale, yScale;
var widthScale, colorScale;

function selectAssistData() {
    let season = $("#assists-season-sel").val();
    let noun = N_DICT[season] > 1 ? ' matches' : ' match'
    $("#aggregate-number-assists").text('Cumulative over ' + N_DICT[season] + noun)
    return assistData[season]
}

function selectZoneData(){
    let season = $("#assists-season-sel").val();
    return zoneData[season]
}

function getStartX(pass) {
    let start_x = pass['start_x'];
    return xScale(start_x);
}

function getStartY(pass) {
    let start_y = pass['start_y'];
    return yScale(start_y);
}

function updateZones() {
    let selZoneData = selectZoneData();

    var colorDomain = d3.extent(selZoneData, function(d) {return d.count;});

    var cellColor = d3.scaleLinear()
        .domain(colorDomain)
        .range(["white", "#a50044"])

    const svg = d3.select("svg#field-assist");
    
    svg.selectAll("rect")
        .data(selZoneData)
        .join(
            enterSelection => {
                enterSelection.append("rect")
                    .attr("x", d => xScale(d.zone_x))
                    .attr("y", d => yScale(d.zone_y))
                    .attr("width", d => xScale(d.zone_w)-20)
                    .attr("height", d => yScale(d.zone_h)-20)
                    .style("opacity", 0)
                    .style("stroke", "grey")
                    .style("stroke-opacity", 0.5)
                    .style("fill", d => cellColor(d.count))
                    .transition()
                        .duration(500)
                        .style("opacity", 0.6)
            },
            updateSelection => {
                updateSelection.transition()
                    .duration(200)
                    .attr("x", d => xScale(d.zone_x))
                    .attr("y", d => yScale(d.zone_y))
                    .attr("width", d => xScale(d.zone_w)-20)
                    .attr("height", d => yScale(d.zone_h)-20)
                    .style("stroke", "grey")
                    .style("stroke-opacity", 0.5)
                    .style("fill", d => cellColor(d.count))
                    .style("opacity", 0.6)
            },
            exitSelection => {
                exitSelection.transition()
                    .duration(500)
                    .attr('opacity', 0)
                    .remove();
            }
        );
        
    // Remove old legend 
    svg.select("g.legendWrapper").remove();

    // Redraw legend
    var svg_width = 459

    var countScale = d3.scaleLinear()
        .domain([0, d3.max(selZoneData, function(d) {return d.count; })])
        .range([0, svg_width])

    // Calculate the variables for the temp gradient
    var numStops = 5;
    var countRange = countScale.domain();
    countRange[2] = countRange[1] - countRange[0];

    var countPoint = [];
    for (var i = 0; i < numStops; i++) {
        countPoint.push(i * countRange[2]/(numStops-1) + countRange[0]);
    }

    svg.append("defs")
        .append("svg:linearGradient")
        .attr("id", "gradient")
        .attr("x1", "0%").attr("y1", "0%")
        .attr("x2", "100%").attr("y2", "0%")
        .selectAll("stop") 
        .data(d3.range(numStops))                
        .enter().append("stop") 
        .attr("offset", function(d,i) { 
            return countScale(countPoint[i])/svg_width;
        })   
        .attr("stop-color", function(d,i) { 
            return cellColor(countPoint[i]); 
        });
    
    var legendWidth = Math.min(svg_width*0.8, 400);
    var legendsvg = svg.append("g")
        .attr("class", "legendWrapper")
        .attr("transform", "translate(" + (svg_width/2) + "," + 330 + ")");

    //Draw the Rectangle
    legendsvg.append("rect")
        .attr("class", "legendRect")
        .attr("x", -legendWidth/2)
        .attr("y", 0)
        .attr("width", legendWidth)
        .attr("height", 10)
        .style("fill", "url(#gradient)")
        .style("opacity", 0.6);

    legendsvg.append("text")
        .attr("class", "legendTitle")
        .attr("x", 0)
        .attr("y", -10)
        .style("text-anchor", "middle")
        .text("Number of Assists");
    
    var legendScale = d3.scaleLinear()
        .range([-legendWidth/2, legendWidth/2])
        .domain([ 0, d3.max(selZoneData, function(d) { return d.count; })] );
    
    var xAxis = d3.axisBottom()
        .ticks(7)
        .scale(legendScale);
    
    legendsvg.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(0," + (10) + ")")
        .call(xAxis)
}

function updateAssists() {
    let selAssistData = selectAssistData();
    
    const svg = d3.select("svg#field-assist");

    svg.selectAll("circle")
        .data(selAssistData)
        .join(
            enterSelection => {
                enterSelection.append("circle")
                    .attr("cx", pass => getStartX(pass))
                    .attr("cy", pass => getStartY(pass))
                    .attr("r", 3)
                    .attr("opacity", 0)
                    .attr("fill", "black")
                    .attr("fill-opacity","0")
                    .style("stroke","black")
                    .style("stroke-width","1.75px")
                    .transition()
                        .duration(200)
                        .attr("opacity", 1)
            },
            updateSelection => {
                updateSelection.transition()
                    .duration(200)
                    .attr("cx", pass => getStartX(pass))
                    .attr("cy", pass => getStartY(pass))
                    .attr("r", 3)
                    .attr("fill", "black")
                    .attr("fill-opacity","0")
                    .style("stroke","black")
                    .style("stroke-width","1.5px")
            },
            exitSelection => {
                exitSelection.transition()
                    .duration(200)
                    .attr('opacity', 0)
                    .remove();
            }
        );
}

function init() {
    // data to SVG coordinate transforms
    xScale = d3.scaleLinear()
        .domain([0, 120])
        .range([topLeftX, bottomRightX]);
    yScale = d3.scaleLinear()
        .domain([0, 80])
        .range([topLeftY, bottomRightY]);

    // data loading and handling
    d3.json('./data/assists_barcelona_clean.json')
        .then(function(data) {
            // console.log("assist data:", data);
            d3.json('./data/assist_zones_barcelona_clean.json')
                .then(function(data) {
                    // console.log("zone data:", data);
                    zoneData = data;
                    updateZones()
                    updateAssists()
                })
                .catch(function(err) {
                    console.log(err);
                });
            
            assistData = data;

            // Populate dropdowns
            $("#assists-team-sel").append(new Option('Barcelona', 'Barcelona'));
            let seasons = Object.keys(data);
            seasons.sort().forEach(function(seasonOption) {
                $("#assists-season-sel").append(new Option(seasonOption, seasonOption))
            });
            $("#assists-season-sel").val("La Liga \(2019/2020\)")
            // Set-up Handlers
            $("#assists-season-sel").on('change', function(event) {
                updateZones()
                updateAssists()
            });
        })
        .catch(function(err) {
			console.log(err);
        });
}
