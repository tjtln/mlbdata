function Table({data}) {
    return (
      <div className="App">
        <table>
          <tr>
            <th>Pitchers</th>
            <th>Runs Allowed Per Inning</th>
            <th>Total Runs Allowed</th>
            <th>Total Innings</th>
          </tr>
          {Object.keys(data.Pitchers).forEach(key => {
            return (
              <tr key={key}>
                <td>{data["Pitchers"][key]["runsAllowedPerInning"]}</td>
                <td>{data["Pitchers"][key]["runsAllowed"]}</td>
                <td>{data["Pitchers"][key]["innings"]}</td>
              </tr>
            )
          })}
        </table>
        </div>
    );
  } 
  
    
  export default Table;