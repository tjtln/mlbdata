import axios from 'axios';
import XLSX from 'xlsx';
const response =  await axios.get(`https://a39pdmcqtg.execute-api.us-east-1.amazonaws.com/prod/mlbdata`);
const data = response.data.body;
const pitchersObject = data.Pitchers;
const teamsObject = data.Teams
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
XLSX.writeFile(wb, `./runsAllowedInFirstInning.xlsx`);
