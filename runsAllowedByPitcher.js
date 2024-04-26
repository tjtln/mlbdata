import axios from 'axios';
import XLSX from 'xlsx';
const CURRENT_DATE = new Date().toISOString().substring(0, 10);
const START_DATE = '2024-01-29'
// get array of game dates
const response =  await axios.get(`https://statsapi.mlb.com/api/v1/schedule?sportId=1&startDate=${START_DATE}&endDate=${CURRENT_DATE}`);
const gameDates = response.data.dates;
var games = [];
for(let i = 0; i < gameDates.length; i++){
    games.push(gameDates[i].games);
}
games = Array.prototype.concat.apply([], games);
var gamePKs = [];
for(let i = 0; i < games.length; i++){    //increase i to limit game sample size to more recent games only
    if(!games.includes(games[i].gamePk)) {
        gamePKs.push(games[i].gamePk);
    }
}
gamePKs = Array.prototype.concat.apply([], gamePKs);


// Function to process a single batch of game PKs
const processBatch = async (gamePKs) => {
    const pitchersObject = {};
    const teamsObject = {};

    // Process each game PK in the batch concurrently
    await Promise.all(gamePKs.map(async (gamePK) => {
        try {
            // Fetch linescore data
            let response = await axios.get(`https://statsapi.mlb.com/api/v1/game/${gamePK}/linescore`);
            if (response.data.innings[0]) {
                const awayRunsAllowed = response.data.innings[0].home.runs;
                const homeRunsAllowed = response.data.innings[0].away.runs;
                const homeTeam = response.data.offense.team.name;
                const awayTeam = response.data.defense.team.name;

                // Fetch playByPlay data
                response = await axios.get(`https://statsapi.mlb.com/api/v1/game/${gamePK}/playByPlay`);
                const plays = response.data.allPlays;

                if (plays.length > 0) {
                    let homepitcher = plays[0].matchup.pitcher.fullName;
                    let awaypitcher;
                    let j = 0;
                    while (j < plays.length) {
                        if (plays[j].about.isTopInning == false && plays[j].about.inning == 1) {
                            awaypitcher = plays[j].matchup.pitcher.fullName;
                            break;
                        }
                        j++;
                    }

                    if (homeRunsAllowed != null && awayRunsAllowed != null) {
                        // Update pitchersObject
                        if (!pitchersObject[homepitcher]) {
                            pitchersObject[homepitcher] = { "runsAllowed": homeRunsAllowed, "innings": 1};
                        } else {
                            pitchersObject[homepitcher].runsAllowed += homeRunsAllowed;
                            pitchersObject[homepitcher].innings += 1;
                        }

                        if (!pitchersObject[awaypitcher]) {
                            pitchersObject[awaypitcher] = { "runsAllowed": awayRunsAllowed, "innings": 1};
                        } else {
                            pitchersObject[awaypitcher].runsAllowed += awayRunsAllowed;
                            pitchersObject[awaypitcher].innings += 1;
                        }

                        // Update teamsObject
                        if (!teamsObject[homeTeam]) {
                            teamsObject[homeTeam] = { "runsAllowed": homeRunsAllowed, "innings": 1};
                        } else {
                            teamsObject[homeTeam].runsAllowed += homeRunsAllowed;
                            teamsObject[homeTeam].innings++;
                        }

                        if (!teamsObject[awayTeam]) {
                            teamsObject[awayTeam] = { "runsAllowed": awayRunsAllowed, "innings": 1};
                        } else {
                            teamsObject[awayTeam].runsAllowed += awayRunsAllowed;
                            teamsObject[awayTeam].innings++;
                        }
                    }
                }
            }
        } catch (error) {
            console.error(`Error processing game PK ${gamePK}: `, error);
        }
    }));
    console.log(`${batchSize} done`)
    return { 'teamsObject': teamsObject, 'pitchersObject': pitchersObject };
};

const batchSize = 100;

const gameBatches = [];
for(let i = 0; i < gamePKs.length; i += batchSize) {
    const batch = gamePKs.slice(i, i+batchSize);
    gameBatches.push(batch);
}

const processedGames = {"teamsObject": {}, "pitchersObject": {}};
for (const batch of gameBatches) {
    console.log("processing batch");
    const processedBatch = await processBatch(batch);
    
    // Merge teamsObject from processedBatch into processedGames.teamsObject
    for (const [team, data] of Object.entries(processedBatch.teamsObject)) {
        if (processedGames.teamsObject[team]) {
            // If team exists, aggregate data
            processedGames.teamsObject[team].runsAllowed += data.runsAllowed;
            processedGames.teamsObject[team].innings += data.innings;
            // Add other properties accordingly
        } else {
            // If team doesn't exist, add it to processedGames.teamsObject
            processedGames.teamsObject[team] = data;
        }
    }
    
    // Merge pitchersObject from processedBatch into processedGames.pitchersObject
    for (const [pitcher, data] of Object.entries(processedBatch.pitchersObject)) {
        if (processedGames.pitchersObject[pitcher]) {
            // If pitcher exists, aggregate data
            processedGames.pitchersObject[pitcher].runsAllowed += data.runsAllowed;
            processedGames.pitchersObject[pitcher].innings += data.innings;
            // Add other properties accordingly
        } else {
            // If pitcher doesn't exist, add it to processedGames.pitchersObject
            processedGames.pitchersObject[pitcher] = data;
        }
    }
}

var pitchersObject = processedGames["pitchersObject"];
var teamsObject = processedGames["teamsObject"];

//XLSX creation
var pitcherRows = [];
var teamRows = [];
Object.keys(pitchersObject).forEach(key=>{
    pitcherRows.push({ "Pitchers": key, "RunsAllowedPerInning": pitchersObject[key].runsAllowed/pitchersObject[key].innings, "Runs":  pitchersObject[key].runsAllowed, "Innings": pitchersObject[key].innings });
})
Object.keys(teamsObject).forEach(key=>{
    teamRows.push({ "Team": key, "RunsAllowedPerInning": teamsObject[key].runsAllowed/teamsObject[key].innings, "Runs":  teamsObject[key].runsAllowed, "Innings": teamsObject[key].innings });
})
let pitcherHeaders = ['Pitchers', 'RunsAllowedPerInning', 'Runs', 'Innings'];
let teamHeaders = ['Team', 'RunsAllowedPerInning', 'Runs', 'Innings'];
pitcherRows.sort((a,b) => a.RunsAllowedPerInning - b.RunsAllowedPerInning + (b.Innings - a.Innings) * .00001);
teamRows.sort((a,b) => a.RunsAllowedPerInning - b.RunsAllowedPerInning + (b.Innings - a.Innings) * .00001);
let wb = XLSX.utils.book_new();
var ws1 = XLSX.utils.json_to_sheet(pitcherRows, {header: pitcherHeaders});
XLSX.utils.book_append_sheet(wb, ws1);
var ws2 = XLSX.utils.json_to_sheet(teamRows, {header: teamHeaders});
XLSX.utils.book_append_sheet(wb, ws2);
XLSX.writeFile(wb, `./runsAllowedInFirstInning_${CURRENT_DATE}.xlsx`);