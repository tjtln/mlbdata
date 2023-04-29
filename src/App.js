import './App.css';
import getData from './runsAllowedByPitcher.js'
import {  useEffect, useState } from 'react';

function App() {
  const [pitchers, setPitchers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [state, setState] = useState([]);
  var pitcherArray = [];
  var teamArray = [];
  var pitcherNameArray = [];
  var teamNameArray = [];
  useEffect(() => {
    setState("loading");
    getData()
    .then((res) => {
      setState("done");
      setPitchers(res.body.Pitchers);
      setTeams(res.body.Teams);
    })
  }, []);
  if(state === "loading"){
    return <h1>Loading...</h1>
  }
  if(state === "done"){
    Object.keys(pitchers).forEach(key => {
      pitcherArray.push(pitchers[key])
      pitcherNameArray.push([key])
    })
    Object.keys(teams).forEach(key => {
      teamArray.push(teams[key])
      teamNameArray.push([key])
    })
    console.log(pitcherArray);
    return (
      <div className="App">
        <span>
        <table>
          <tr>
            <th>Pitchers     </th>
            <th>Runs Allowed Per Inning     </th>
            <th>Total Runs Allowed     </th>
            <th>Total Innings</th>
          </tr>
          {pitcherArray.map((val, key) => {
          return (
            <tr key={key}>
              <td>{pitcherNameArray[key]}</td>
              <td>{val.runsAllowedPerInning}</td>
              <td>{val.runsAllowed}</td>
              <td>{val.innings}</td>
            </tr>
          )
        })}
        </table>
        </span><span>
        <table>
          <tr>
            <th>Teams     </th>
            <th>Runs Allowed Per Inning     </th>
            <th>Total Runs Allowed     </th>
            <th>Total Innings</th>
          </tr>
          {teamArray.map((val, key) => {
          return (
            <tr key={key}>
              <td>{teamNameArray[key]}</td>
              <td>{val.runsAllowedPerInning}</td>
              <td>{val.runsAllowed}</td>
              <td>{val.innings}</td>
            </tr>
          )
        })}
        </table>
        </span>
        </div>
    );
  }
}
  
export default App;