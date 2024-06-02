import { useState, useEffect, useRef } from "react"
import { format, differenceInMinutes, differenceInHours, isAfter } from "date-fns"
//import reactLogo from "./assets/react.svg";
//import "./App.css"
//import Header from "components/header"
import "./styles/water.css"

import Container from "react-bootstrap/Container"
import Row from "react-bootstrap/Row"
import Col from "react-bootstrap/Col"
import Form from "react-bootstrap/Form"
import Table from "react-bootstrap/Table"

import convert from "./libs/convertToPower.js"
import useStore from "./libs/store.js"
import WellReport from "./components/well-report.jsx"

function doFormat(theDate) {
  return format(theDate, "MMM d, h:mm:ss a")
}
function makeTime(seconds) {
  return (seconds / 60).toFixed(1) + " mins"
}
function App() {
  const [doStream, setDoStream] = useState(false)
  const data = useStore((state) => state.data)
  const setData = useStore((state) => state.setData)
  const [connectionStatus, setConnectionStatus] = useState("connecting")
  const [dataToUse, setDataToUse] = useState("all")
  const rawDataRef = useRef(null)
  const eventSourceRef = useRef(null)
  const effectRan = useRef(false)
  const firstLoadComplete = useRef(false)
  // for well report
  let groups = []

  /* data
distDocs = [ {
  distance: 19.5,
  when: "2024-05-22T23:03:05.243Z",
}]
powerDocs = [{
  state: "off",
  when: "2024-05-22T21:40:30.777Z",
  runTime: 56,
  pump: "pressure",
}] */

  const closeConnection = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null // Clear the ref
      setConnectionStatus("closed")
    }
  }

  useEffect(() => {
    if (firstLoadComplete.current) {
      return
    } else {
      firstLoadComplete.current = true
      console.log("running useEffect")
      const es = new EventSource(`${import.meta.env.VITE_NODE_SERVER_URL}/api/sse`)

      es.onmessage = (event) => {
        const newLogs = JSON.parse(event.data)

        if (!data.length) {
          console.log("no data so its all the data!")
          setData(newLogs)
          return
        }

        console.log("theData power", newLogs.powerDocs.length ? newLogs.powerDocs[0].when : "empty")
        console.log("theData dist", newLogs.distDocs.length ? newLogs.distDocs[0].when : "empty")

        // Update the state with the new logs
        setData(newLogs)
      }
      es.onopen = () => {
        console.log("data stream connection opened")
        setConnectionStatus("open")
      }

      es.onerror = (error) => {
        console.log("data stream connection failed:", error)
        setConnectionStatus("closed")
        closeConnection()
      }
    }

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }
    }
  }, [data, setData])

  // from Water app
  function currentDistance() {
    if (!data.length) return 0
    return data.find((v) => v.distance).distance
  }
  function isWellrunning() {
    const resp = data.find((v) => v.state === "Well running")
    if (resp) {
      return (
        <h4 style={{ backgroundColor: "rgba(255, 99, 71, 0.5)" }}>
          Well pump is on... started {format(resp.when, "h:mm:ss a")}
        </h4>
      )
    }
    return ""
  }
  function isPressurerunning() {
    const resp = data.find((v) => v.state === "Pressure running")
    if (resp) {
      return (
        <h4 style={{ backgroundColor: "rgba(173, 175, 204)" }}>
          Pressure pump is on... started {format(resp.when, "h:mm:ss a")}
        </h4>
      )
    }
    return ""
  }
  function waterUsedLast(minutes) {
    const dists = data
      .filter((v) => v.distance && differenceInMinutes(new Date(), v.when) <= minutes)
      .map((v) => v.distance)
    if (dists) {
      let max = Math.max(...dists)
      let min = Math.min(...dists)
      max = max === Infinity || max === -Infinity ? 0 : max
      min = min === Infinity || min === -Infinity ? 0 : min
      if (minutes === 120 && Math.abs(max - min) <= 0.1) return ""
      const dir = dists[0] > dists[dists.length - 1] ? "used" : "gained"
      //console.log("max", max, "min", min);
      return (
        <h5>
          Water {dir} last {minutes} mins {((max - min) * 70).toFixed(1)} gals{" "}
          {(max - min).toFixed(1)} - inches
        </h5>
      )
    }
    return ""
  }
  const getBGColor = (data) => {
    //console.log("dataTouse", dataToUse);
    if (dataToUse === "well" || dataToUse === "pressure") return {}
    switch (data.pump) {
      case "well":
        return { backgroundColor: "rgba(255, 99, 71, 0.5)" }
      case "pressure":
        return { backgroundColor: "rgb(173, 175, 204)" }
      default:
        return {}
    }
  }
  const onRadio = (event) => {
    console.log("what to show", event.target.value)
    setDataToUse(event.target.id)
    //setWhere(event.target.value);
  }

  const getDistVal = (date, arr) => {
    const dists = arr.filter((x) => x.distance)
    let val = dists.find((d) => d.when.getTime() < date.getTime())
    return val ? val.distance : 0
  }

  let useThis
  let tableHeader3 = "Dist/ Time"
  if (dataToUse === "all") {
    useThis = data.length ? data.filter((d) => (d.voltage ? false : true)) : data
  }
  if (dataToUse === "well") {
    useThis = data.filter((d) => d.pump === "well")
    tableHeader3 = "Time"
  }
  if (dataToUse === "pressure") {
    useThis = data.filter((d) => d.pump === "pressure")
    tableHeader3 = "Time"
  }

  // table data rows
  let rows = []
  let wellRunTimeData = []
  if (data && data.length > 0)
    useThis.map((r, i) => {
      const what = r.distance ? "Distance" : r.state ? r.state : "Voltage"
      //console.log("what=", what)
      //console.log("r.distance",r.distance)
      //Dist column
      const dist = r.distance
        ? r.distance
        : r.voltage
        ? r.voltage
        : r.runTime
        ? makeTime(r.runTime)
        : r.state === "Well running"
        ? r.state
        : "-----"
      //console.log("dist=", dist)
      rows.push(
        <tr key={i} style={getBGColor(r)}>
          <td key={1}>{what}</td>
          <td key={2}>{doFormat(r.when)}</td>
          <td key={3}>{dist}</td>
        </tr>
      )
      if (dataToUse === "well" || dataToUse === "all") {
        wellRunTimeData.push({ what, when: r.when, dist })
        //console.table(wellRunTimeData);
      }
    })
  // produce well report
  if (wellRunTimeData.length) {
    let group = []
    wellRunTimeData.reverse().forEach((v, i, arr) => {
      if (!group.length) {
        if (v.what === "Well starting") group.push(v)
      } else {
        if (v.what === "Well starting") {
          // we changed the well pump resting time on 7,18,2021
          // from less than 30 minutes to 190 plus
          const pumpSpan = 210
          console.log("span", pumpSpan)
          const previous = group[group.length - 1]
          const diff = differenceInMinutes(v.when, previous.when)
          if (diff < pumpSpan + parseFloat(previous.dist)) {
            group.push(v)
          } else {
            groups.push(group)
            group = []
            group.push(v)
          }
        }

        if (v.what === "Well ran") {
          group.push(v)
        }
      }
    })
    // add last one
    groups.push(group)
    groups.reverse()
    console.log("groups before", groups)
    //const distData = data.filter((d) => d.dist);
    groups = groups.map((v, i, arr) => {
      let time = v
        .filter((o) => o.what === "Well ran")
        .reduce((a, b) => {
          return a + parseFloat(b.dist)
        }, 0)
      time = Math.round(time * 10) / 10
      console.log("time", time)
      // frags = "49.0,9.8,7.4,1.2"
      const frags = v
        .filter((o) => o.what === "Well ran")
        .reduce((a, b) => {
          return a + b.dist.split(" ")[0] + "+"
        }, "")
        .slice(0, -1)
      const distStr = `${getDistVal(v[0].when, data)}-${getDistVal(v[v.length - 1].when, data)}`
      console.log(
        "frags",
        frags,
        "start time",
        getDistVal(v[0].when, data),
        getDistVal(v[v.length - 1].when, data)
      )
      const sinceLastPump =
        i < arr.length - 1
          ? differenceInHours(v[0].when, arr[i + 1][arr[i + 1].length - 1].when)
          : 0
      return {
        time,
        frags,
        sinceLastPump,
        when: v[v.length - 1].when,
        dists: distStr,
      }
    })
    console.log("groups", groups)
  }
  if (data.length) console.log("Data to Render", data[0].distance, data[0].when)
  return (
    <div>
      <h1 className="text-center">
        <span className="tinyIcon">💦</span>
        <span className="mediumIcon">💦</span>
        💦Water Report💦
        <span className="mediumIcon">💦</span>
        <span className="tinyIcon">💦</span>
      </h1>
      {data && data.length > 0 ? (
        <div>
          <h3 className="text-center">
            Current well distance <strong>{currentDistance()}</strong>{" "}
          </h3>
          {isWellrunning()}
          {isPressurerunning()}
          <div class="container">
            {dataToUse === "all" ? (
              <div class="column">
                <table striped bordered hover size="sm">
                  <thead>
                    <tr>
                      <th>What</th>
                      <th>When</th>
                      <th>{tableHeader3}</th>
                    </tr>
                  </thead>
                  <tbody>{rows}</tbody>
                </table>
              </div>
            ) : null}
            {groups.length > 0 ? <WellReport groups={groups} /> : null}
          </div>
          )
        </div>
      ) : (
        <>
          {console.log("NO Data")}
          <div>NO Data</div>
        </>
      )}
    </div>
  )
}

export default App
