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
for(let i = 0; i < games.length; i++){
    if(!games.includes(games[i].gamePk)) {
        gamePKs.push(games[i].gamePk);
    }
}
gamePKs = Array.prototype.concat.apply([], gamePKs);
var final = {};
for(let i = 0; i < gamePKs.length; i++){
    let response =  await axios.get(`https://statsapi.mlb.com/api/v1/game/${gamePKs[i]}/linescore`);
    if(response.data.innings[0]){
        let awayRunsAllowed = response.data.innings[0].home.runs;
        let homeRunsAllowed = response.data.innings[0].away.runs;
        if(response.data.innings[0] && awayRunsAllowed && homeRunsAllowed){
            let awayRunsAllowed = response.data.innings[0].home.runs;
            let homeRunsAllowed = response.data.innings[0].away.runs;
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
                if(!final[homepitcher]){
                    final[homepitcher] = {"runsAllowed": homeRunsAllowed, "innings": 1, "runsAllowedPerInning": homeRunsAllowed};
                } else {
                    final[homepitcher].runsAllowed += homeRunsAllowed;
                    final[homepitcher].innings += 1;
                    final[homepitcher].runsAllowedPerInning = final[homepitcher].runsAllowed / final[homepitcher].innings;
                }
                if(!final[awaypitcher]){
                    final[awaypitcher] = {"runsAllowed": awayRunsAllowed, "innings": 1, "runsAllowedPerInning": awayRunsAllowed};
                } else {
                    final[awaypitcher].runsAllowed += awayRunsAllowed;
                    final[awaypitcher].innings += 1;
                    final[awaypitcher].runsAllowedPerInning = final[awaypitcher].runsAllowed / final[awaypitcher].innings;
                }
            }
        } 
    }
    console.log(`${i} / ${gamePKs.length}`)
}
var rows = [];
Object.keys(final).forEach(key=>{
    rows.push({ "Pitchers": key, "RunsAllowedPerInning": final[key].runsAllowedPerInning, "Runs":  final[key].runsAllowed, "Innings": final[key].innings });
})
let finalHeaders = ['Pitchers', 'RunsAllowedPerInning', 'Runs', 'Innings'];
rows.sort((a,b) => a.RunsAllowedPerInning - b.RunsAllowedPerInning + (b.Innings - a.Innings) * .00001)
let wb = XLSX.utils.book_new();
var ws = XLSX.utils.json_to_sheet(rows, {header: finalHeaders});
XLSX.utils.book_append_sheet(wb, ws);
XLSX.writeFile(wb, `./runsAllowedInFirstInning_${CURRENT_DATE}.xlsx`);
