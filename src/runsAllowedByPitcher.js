import axios from 'axios';

async function getData() {
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
    for(let i = 200; i < games.length; i++){    //increase i to limit game sample size to more recent games only
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
                    if(plays[j].about.isTopInning === false && plays[j].about.inning === 1){
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
        pitchersObject = Object.fromEntries(
            Object.entries(pitchersObject).sort(([, a], [, b]) => (a.runsAllowedPerInning - b.runsAllowedPerInning) - .001 * (a.innings - b.innings))
        )
        console.log(`${i}/${gamePKs.length}`);
    }
    const returnObject = {
        statusCode: 200,
        body: {"Teams": teamsObject, "Pitchers": pitchersObject},
    };
    return returnObject;
};

export default getData;
