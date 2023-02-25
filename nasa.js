/* MUST INCLUDE - use "npm install xhr2" in bash */
const { url } = require('inspector');
const { exit } = require('process');
const { start } = require('repl');
let XMLHttpRequest = require('xhr2');

/* CONSTANTS */
const API_KEY = "MY_KEY";
const DATE_FORMAT = /\d{4}-\d{2}-\d{2}/
const ONE_DAY_IN_MS = 86400 * 1000;

/* Check format is correct. If is correct return 0, othervise return a natural number. */
function correct_format() {
    if (process.argv.length != 4) return 1; // wrong length
    else if (!DATE_FORMAT.test(process.argv[2])) return 101; // wrong first date
    else if (!DATE_FORMAT.test(process.argv[3])) return 102; // wrong second date

    return 0;
}


/* ////////////////////////// MAIN PROGRAM ////////////////////////// */

// check input
if (correct_format()) {
    console.log("Insufficient input!");
    process.exit(1);
}

/* ////////// Split dates by weeks ////////// */
let startDate = new Date(process.argv[2]);
let endDate = new Date(process.argv[3]);

let intervals = [];
const numberOfDays = (endDate - startDate) / (1000 * 60 * 60 * 24) + 1;

while ((endDate - startDate) / (1000 * 60 * 60 * 24) >= 7) {
    let tmp = new Date(Date.parse(startDate) + (7 * ONE_DAY_IN_MS));
    intervals.push([startDate.toISOString().slice(0, 10), tmp.toISOString().slice(0, 10)]);
    startDate = new Date(Date.parse(tmp) + (ONE_DAY_IN_MS))
}

if (intervals.length === 0) intervals.push([startDate.toISOString().slice(0, 10), endDate.toISOString().slice(0, 10)]);
else if (intervals[intervals.length - 1][1] != endDate) intervals.push([startDate.toISOString().slice(0, 10), endDate.toISOString().slice(0, 10)]);

/* ////////// Go through all the dates ////////// */
function getData() {
    let allData = [];
    let allDates = [];

    // console.log(intervals);

    for (let i = 0; i < intervals.length; i += 1) {
        const urlBeginning = "https://api.nasa.gov/neo/rest/v1/feed?";
        const urlEnd = "&api_key=" + API_KEY;

        const urlStartDate = "start_date=" + intervals[i][0];
        const urlEndDate = "&end_date=" + intervals[i][1];
        const urlFull = urlBeginning + urlStartDate + urlEndDate + urlEnd;


        // get the request
        let xmlhttp = new XMLHttpRequest();

        xmlhttp.onreadystatechange = function () {
            if (this.readyState == 4 && this.status == 200) {
                let data = JSON.parse(this.responseText);

                for (const key in data.near_earth_objects) {
                    allDates.push(key);
                }

                for (const key in data.near_earth_objects) {

                    for (let j = 0; j < `${key}`.length; j++) {
                        let thisObject = data.near_earth_objects[key][j];

                        if (thisObject === undefined) continue;

                        let name = thisObject.name;
                        let diameter = ((parseFloat(thisObject.estimated_diameter.meters.estimated_diameter_min)
                            + parseFloat(thisObject.estimated_diameter.meters.estimated_diameter_max)) / 2).toFixed(3);

                        let timeAproach = thisObject.close_approach_data[0].close_approach_date_full;
                        `${data.near_earth_objects[key][j].close_approach_data[0].close_approach_date_full}`;
                        let distance = parseFloat(thisObject.close_approach_data[0].miss_distance.lunar).toFixed(3);

                        allData.push([name, diameter, timeAproach, distance]);
                    }
                }

                if (allDates.length === numberOfDays) printTable(allData);

            }

        }

        xmlhttp.open("GET", urlFull, true);
        xmlhttp.send();

    }

}

getData();

function printTable(allData) {
    allData.sort((a, b) => a[3] - b[3]);

    // for (let i = 0; i < allData.length; i++) {
    //     console.log(allData[i]);
    // }
    // return;

    let maxLength = ["name".length, "diameter[m]".length, "APROACH TIME".length, "distance[LD]".length];
    
    for (let j = 0; j < allData.length; j++) {
        let length = [0, 0, 0, 0];

        for (let i = 0; i < allData[j].length; i++) {
            length[i] = allData[j][i].length;
        }

        for (let i = 0; i < allData[j].length; i++) {
            if (length[i] > maxLength[i]) {
                maxLength[i] = length[i];
            }
        }
    };

    for (let i = 0; i < maxLength.length; i++) {
        maxLength[i] = parseInt(maxLength[i]);
    }

    console.log("| " + "NAME", " ".repeat(Math.abs(maxLength[0] - 5)),
        "| DIAMETER[m]", /* " ".repeat(maxLength[1] - "| DIAMETER[m]".length0), */
        "| APROACH TIME", " ".repeat(Math.abs(maxLength[2] - " APROACH TIME".length)),
        "| DISTANCE[LD] |"/* , " ".repeat(), "|" */);

    // print dividing line
    const lineLength = maxLength.reduce((a, b) => a + b, 0) + 13;
    console.log("-".repeat(lineLength))

    for (let i = 0; i < allData.length; i++) {
        const name = allData[i][0]/* .slice(1, -1) */;
        const diameter = allData[i][1];
        const timeAproach = allData[i][2];
        const distance = allData[i][3];
        // console.log(maxLength[0], name.length);
        console.log(`| ${name} ` + " ".repeat(maxLength[0] - name.length)
            + `| ${diameter} ` + " ".repeat(maxLength[1] - diameter.length)
            + `| ${timeAproach} ` + " ".repeat(maxLength[2] - timeAproach.length)
            + `| ${distance} ` + " ".repeat(maxLength[3] - distance.length) + "|");
    }
}
