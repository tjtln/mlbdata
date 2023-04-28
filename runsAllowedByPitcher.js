import axios from 'axios';
import XLSX from 'xlsx';
const CURRENT_DATE = new Date().toISOString().substring(0, 10);
const START_DATE = '2023-03-29'
const response =  await axios.get(`https://statsapi.mlb.com/api/v1/schedule?sportId=1&startDate=${START_DATE}&endDate=${CURRENT_DATE}`);
const schedule = response.data;
const gameDates = schedule.dates;
var games = [];
var gamePKs = [];
for(let i = 0; i < gameDates.length; i++){
    games.push(gameDates[i].games);
}
games = Array.prototype.concat.apply([], games);
for(let i = 0; i < games.length; i++){    //increase i to limit game sample size to more recent games only
    if(!games.includes(games[i].gamePk)) {
        gamePKs.push(games[i].gamePk);
    }
}
gamePKs = Array.prototype.concat.apply([], gamePKs);
var pitchersObject = {};
var teamsObject = {};
for(let i = 0; i < gamePKs.length; i++){
    let response =  await axios.get(`https://statsapi.mlb.com/api/v1/game/${gamePKs[i]}/linescore`);
    if(response.data.innings[0]){
        let awayRunsAllowed = response.data.innings[0].home.runs;
        let homeRunsAllowed = response.data.innings[0].away.runs;
        let homeTeam = response.data.offense.team.name;
        let awayTeam = response.data.defense.team.name;
        response = await axios.get(`https://statsapi.mlb.com/api/v1/game/${gamePKs[i]}/playByPlay`);
        let plays = response.data.allPlays
        if(plays.length > 0){
            var homepitcher = plays[0].matchup.pitcher.fullName;
            var awaypitcher; 
            let j = 0;
            while(j < plays.length){
                if(plays[j].about.isTopInning == false && plays[j].about.inning == 1){
                    awaypitcher = plays[j].matchup.pitcher.fullName;
                    break;
                }
                j++;
            }
            if(homeRunsAllowed != null && awayRunsAllowed != null){
                if(!pitchersObject[homepitcher]){
                    pitchersObject[homepitcher] = {"runsAllowed": homeRunsAllowed, "innings": 1, "runsAllowedPerInning": homeRunsAllowed};
                } else {
                    pitchersObject[homepitcher].runsAllowed += homeRunsAllowed;
                    pitchersObject[homepitcher].innings += 1;
                    pitchersObject[homepitcher].runsAllowedPerInning = pitchersObject[homepitcher].runsAllowed / pitchersObject[homepitcher].innings;
                }
                if(!pitchersObject[awaypitcher]){
                    pitchersObject[awaypitcher] = {"runsAllowed": awayRunsAllowed, "innings": 1, "runsAllowedPerInning": awayRunsAllowed};
                } else {
                    pitchersObject[awaypitcher].runsAllowed += awayRunsAllowed;
                    pitchersObject[awaypitcher].innings += 1;
                    pitchersObject[awaypitcher].runsAllowedPerInning = pitchersObject[awaypitcher].runsAllowed / pitchersObject[awaypitcher].innings;
                }
                if(!teamsObject[homeTeam]){
                    teamsObject[homeTeam] = {"runsAllowed": homeRunsAllowed, "innings": 1, "runsAllowedPerInning": homeRunsAllowed};
                } else {
                    teamsObject[homeTeam].runsAllowed += homeRunsAllowed;
                    teamsObject[homeTeam].innings++;
                    teamsObject[homeTeam].runsAllowedPerInning = teamsObject[homeTeam].runsAllowed / teamsObject[homeTeam].innings;
                }
                if(!teamsObject[awayTeam]){
                    teamsObject[awayTeam] = {"runsAllowed": awayRunsAllowed, "innings": 1, "runsAllowedPerInning": awayRunsAllowed};
                } else {
                    teamsObject[awayTeam].runsAllowed += awayRunsAllowed;
                    teamsObject[awayTeam].innings++;
                    teamsObject[awayTeam].runsAllowedPerInning = teamsObject[awayTeam].runsAllowed / teamsObject[awayTeam].innings;
                }
            }
        }
    } 
console.log(`${i} / ${gamePKs.length}`)
}
var pitcherRows = [];
var teamRows = [];
Object.keys(pitchersObject).forEach(key=>{
    pitcherRows.push({ "Pitchers": key, "RunsAllowedPerInning": pitchersObject[key].runsAllowedPerInning, "Runs":  pitchersObject[key].runsAllowed, "Innings": pitchersObject[key].innings });
})
Object.keys(teamsObject).forEach(key=>{
    teamRows.push({ "Team": key, "RunsAllowedPerInning": teamsObject[key].runsAllowedPerInning, "Runs":  teamsObject[key].runsAllowed, "Innings": teamsObject[key].innings });
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
