import { format } from "date-fns"

const getBGColor = (data) => {
  
  switch (data.pump) {
    case "well":
      return { backgroundColor: "rgba(255, 99, 71, 0.5)" }
    case "pressure":
      return { backgroundColor: "rgb(173, 175, 204)" }
    default:
      return {}
  }
}

const WellReport = ({groups}) => {
  return (
    <div class="column">
      <h3 className="text-center">Pumping Stats</h3>
      <table striped bordered hover size="sm">
        <thead>
          <tr>
            <th>Time</th>
            <th>Fragments</th>
            <th>start-end</th>
            <th>Hours since last pump</th>
            <th>When ended</th>
          </tr>
        </thead>
        <tbody>
          {groups.map((r, i) => {
            return (
              <tr key={i} style={getBGColor(r)}>
                <td key={1}>{r.time}</td>
                <td key={2}>{r.frags}</td>
                <td key={3}>{r.dists}</td>
                <td key={4}>{r.sinceLastPump}</td>
                <td key={5}>{format(r.when, "MMM d, h:mm:ss a")}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
export default WellReport
