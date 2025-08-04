"use strict";

const topLeftXShots = 93;
const topLeftYShots = 47;
const bottomRightXShots = 535;
const bottomRightYShots = 285;
const NO_TEAM_MSG = "(Select Team First)"
const SELECT_SHOT_TYPE_MSG = "(Select Shot Type)"
const SHOT_TYPES = ['All', 'Corner', 'Free Kick', 'Open Play', 'Penalty', 'Kick Off']
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

window.addEventListener("load", initShots);
var shotData;
var xScaleShots, yScaleShots;

function selectDataShots() {
    let team = $("#team-sel").val();
    let season = $("#season-sel").val();
    let type = $("#type-sel").val();
    console.log(team, season, type)

    let teamData = shotData[team];
    let shotFilter = function(shots, type) {
        if (type == 'All') { return shots; }
        else { return shots.filter(s => s['type']['name'] == type); }
    }

    let noun = N_DICT[season] > 1 ? ' matches' : ' match'
    $("#aggregate-number-shots").text('Cumulative over ' + N_DICT[season] + noun)
    return shotFilter(teamData[season], type);
}

function getXCoord(endLoc) { return endLoc[1]; }
function getYCoord(endLoc) { return (endLoc.length > 2 ? endLoc[2] : 0); }
function encodeColor(shot) {
    let outcome = shot['outcome'];
    return (outcome['name'] == 'Goal' ? '#a50044' : 'black')
}
function encodeOpacity(shot) { return shot['statsbomb_xg']; }

function updateShots() {
    let data = selectDataShots()
    const svg = d3.select("svg#goal");
    // console.log(data)
    svg.selectAll("circle")
        .data(data)
        .join(
            enterSelection => {
                enterSelection.append("circle")
                    .attr("cx", d => xScaleShots(getXCoord(d['end_location'])))
                    .attr("cy", d => yScaleShots(getYCoord(d['end_location'])))
                    .attr("r", 5)
                    .attr("opacity", 0)
                    .transition()
                        .duration(500)
                        .attr("opacity", d => encodeOpacity(d))
                        .attr("fill", d => encodeColor(d))
            },
            updateSelection => {
                updateSelection.transition()
                    .duration(500)
                    .attr("cx", d => xScaleShots(getXCoord(d['end_location'])))
                    .attr("cy", d => yScaleShots(getYCoord(d['end_location'])))
                    .attr("opacity", d => encodeOpacity(d))
                    .attr("fill", d => encodeColor(d))
            },
            exitSelection => {
                exitSelection.transition()
                    .duration(500)
                    .attr('opacity', 0)
                    .remove();
            }
        );
    updateBarchart(data)
}

function initShots() {
    // Initialize barchart
    $("#time").on('click', function() { updateBarchart(selectDataShots()) })
    $("#technique").on('click', function() { updateBarchart(selectDataShots()) })
    $("#bodypart").on('click', function() { updateBarchart(selectDataShots()) })
    $("#time")[0].checked = true
    baseBarChart()

    // data to SVG coordinate transforms
    xScaleShots = d3.scaleLinear()
        .domain([36, 44])
        .range([topLeftXShots, bottomRightXShots]);
    yScaleShots = d3.scaleLinear()
        .domain([2.67, 0])
        .range([topLeftYShots, bottomRightYShots]);

    // data loading and handling
    d3.json('./data/shots_barcelona_clean.json')
        .then(function(data) {
            // console.log(data);
            shotData = data;

            // Populate dropdowns
            let teams = Object.keys(data);
            // console.log(teams);
            $("#team-sel").append(new Option('Barcelona', 'Barcelona'));

            let selTeam = $("#team-sel").val();
            Object.keys(shotData[selTeam]).sort().forEach(function(season) {
                $("#season-sel").append(new Option(season, season))
            });
            $("#season-sel").val("La Liga \(2019/2020\)")
            SHOT_TYPES.forEach(function(shot) {
                $("#type-sel").append(new Option(shot, shot))
            });

            // Set-up Handlers
            $("#season-sel").on('change', updateShots);
            $("#type-sel").on('change', updateShots);

            updateShots();
        })
        .catch(function(err) {
            console.log(err);
        });
}

// BARCHART

const padding = { top: 20, left: 50, right: 50, bottom: 50 }
const TIME = ["0-15", "15-30", "30-45", "45-60", "60-75", "75-90"];
const BODYPART = ['Head', 'Left Foot', 'Right Foot', 'Other']
const TECHNIQUE = ['Backheel', 'Volley', 'Diving Header', 'Lob', 'Half Volley', 'Normal', 'Overhead Kick']
const SHOTS_LABEL = "Number of Shots"
const GOALS_LABEL = "Number of Goals"
const X_LABELS = {'time':'Time of Goal', 'technique':'Technique Used', 'bodypart':'Body Part Used'}
var xForTime, xForTechnique, xForBodyPart;
var yForScale;

// Axis functions

function buildYScale(svg, max) {
    return d3.scaleLinear()
        .domain([0, max])
        .range([svg.attr("height") - padding.bottom, 0 + padding.top]);
}

function buildYAxis(svg) {
    let axis = d3.axisLeft(yForScale)
    if (yForScale.ticks().length > Math.max(...yForScale.ticks()) + 1) {
        axis = d3.axisLeft(yForScale)
            .ticks(Math.max(...yForScale.ticks()), "d")
    }
    svg.append("g")
        .call(axis)
        .attr("transform", `translate(${padding.left} , 0)`);
}

function addYAxisLabel(svg, text) {
    svg.append("text")
        .attr("class", 'axis-labels')
        .attr("transform", `translate(${padding.left/3}, ${svg.attr("height")/2}) rotate(-90)`)
        .text(text);
}

function buildXAxis(svg, scale) {
    svg.append("g")
        .call(d3.axisBottom(scale)) 
        .attr("transform", `translate(0, ${svg.attr("height") - padding.bottom})`); 
}

function addXAxisLabel(svg, text) {
    svg.append("text")
        .attr("class", 'axis-labels')
        .attr("x", svg.attr("width")/2)
        .attr("y", svg.attr("height")-(padding.bottom/3))
        .text(text); 
}

function clearAxes() {
    d3.select('svg#barchart').selectAll('text').remove()
    d3.select('svg#barchart').selectAll('g').remove()
}

function baseBarChart() {
    let svg = d3.select('#barchart');

    // Build axes
    let buildXScale = function(labels) {
        return d3.scaleBand()
            .domain(labels)
            .range([0 + padding.left, svg.attr("width") - padding.right])
            .padding(0.5);
    }
    xForTime = buildXScale(TIME)
    xForTechnique = buildXScale(TECHNIQUE)
    xForBodyPart = buildXScale(BODYPART)

    yForScale = buildYScale(svg, 15)
    buildYAxis(svg)
    buildXAxis(svg, xForTime)
    addYAxisLabel(svg, SHOTS_LABEL)
    addXAxisLabel(svg, X_LABELS['time'])
}

function drawBars(svg, data, scale) {
    svg.selectAll("rect")
        .data(data)
        .join(
            enterSelection => {
                enterSelection.append("rect")
                    .attr("x", d => scale(d['key']))
                    .attr("y", svg.attr("height") - padding.bottom)
                    .attr("width", scale.bandwidth())
                    .attr("height", 0)
                    .attr("fill", "#004d98")
                    .transition()
                        .duration(200)
                        .attr("y", d => yForScale(d['count']))
                        .attr("height", d => (svg.attr("height") - yForScale(d['count']) - padding.bottom))
            },
            updateSelection => {
                updateSelection.transition()
                    .duration(200)
                    .attr("x", d => scale(d['key']))
                    .attr("width", scale.bandwidth())
                    .attr("y", d => yForScale(d['count']))
                    .attr("height", d => (svg.attr("height") - yForScale(d['count']) - padding.bottom))
            },
            exitSelection => {
                exitSelection.transition()
                    .duration(200)
                    .attr("y", svg.attr("height") - padding.bottom)
                    .attr('height', 0)
                    .remove();
            }
        );
}

function updateBarchart(data) {    
    let svg = d3.select('#barchart');

    let mode = "time"
    if ($("#time")[0].checked == true) { mode = 'time' }
    if ($("#bodypart")[0].checked == true) { mode = 'bodypart' }
    if ($("#technique")[0].checked == true) { mode = 'technique' }

    clearAxes()
    let aggregateData = aggregate(data, mode)
    let maxnumber = Math.max(...aggregateData.map(d => d['count']))
    maxnumber = Math.max(1, maxnumber)
    yForScale = buildYScale(svg, maxnumber)
    buildYAxis(svg)
    addXAxisLabel(svg, X_LABELS[mode])

    if (mode == 'time') {
        buildXAxis(svg, xForTime)
        addYAxisLabel(svg, GOALS_LABEL)
        drawBars(svg, aggregateData, xForTime)
    }
    if (mode == 'technique') {
        buildXAxis(svg, xForTechnique)
        addYAxisLabel(svg, SHOTS_LABEL)
        drawBars(svg, aggregateData, xForTechnique)
    }
    if (mode == 'bodypart') {
        buildXAxis(svg, xForBodyPart)
        addYAxisLabel(svg, SHOTS_LABEL)
        drawBars(svg, aggregateData, xForBodyPart)
    }
}

function aggregate(data, mode) {
    let keys = null;
    if (mode == 'time') { keys = TIME; }
    if (mode == 'bodypart') { keys = BODYPART; }
    if (mode == 'technique') { keys = TECHNIQUE; }
    let dict = {}
    keys.forEach(k => dict[k] = 0)

    for(var i = 0; i < Object.keys(data).length; i++) {
        if (mode == 'time') {
            if (data[i]['timestamp'] != null) {
                let ntime = data[i]['timestamp']
                if (data[i]['outcome']['name'] == 'Goal') {
                    let index = Math.min(Math.trunc(ntime / 15), 5)
                    dict[keys[index]] += 1
                }
            }
        }
        if (mode == 'bodypart') {
            let bodyPart = data[i]['body_part']['name']
            dict[bodyPart] += 1
        }
        if (mode == 'technique') {
            let tech = data[i]['technique']['name']
            dict[tech] += 1
        }       
    }
    let aggregate = Object.keys(dict).map(k => ({'key':k, 'count':dict[k]}))
    return aggregate;
}