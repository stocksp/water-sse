import { create } from "zustand"
import { parseJSON, compareDesc } from "date-fns"
import convert from "./convertToPower"
import { te } from "date-fns/locale"

const useStore = create((set) => ({
  data: [],
  setData: (newData) =>
    set((state) => {
      console.log(
        `calling setData with preState length: ${state.data.length} newData: dists: ${newData.distDocs.length} power: ${newData.powerDocs.length} state is: ${state.data.length}`
      )
      if (state.data.length === 0) {
        const theData = convert(newData)
        return { data: theData }
      }
      // Check for new distDocs
      if (newData.distDocs.length > 0) {
        console.log("distDoc is ", newData.distDocs[0])
        const obj = { ...newData.distDocs[0] }
        console.log("new obj for dist", obj)
        obj.when = parseJSON(obj.when)
        console.log("new dist is:", obj)
        const temp = [...state.data]
        temp.unshift(obj)
        console.log("data last element will be ", temp[0].distance, temp[0].when)
        return { data: temp }
      }
      // Check for new powerDocs
      if (newData.powerDocs.length > 0) {
        console.log("powerdoc is ", newData.powerDocs[0])
        const pump = newData.powerDocs[0].pump
        const isOn = newData.powerDocs[0].state === "on"
        console.log(`${pump} is ${isOn}`)
        if (isOn && pump === "pressure") {
          console.log("pressuer on")
          const obj = { ...newData.powerDocs[0], state: "Pressure running" }
          console.log("new entry", obj)
          obj.when = parseJSON(obj.when)
          console.log("fix the date", obj)
          const temp = [...state.data]
          temp.unshift(obj)
          return { data: temp }

          // we need to remove Pressure running
          // we only keep one record of when it finnished and
          // how long it ran .. see filter
        } else if (!isOn && pump === "pressure") {
          console.log("turning pressure off!")
          const obj = { ...newData.powerDocs[0], state: "Pressure ran" }
          obj.when = parseJSON(obj.when)
          const temp = [...state.data.filter((doc) => doc.state !== "Pressure running")]
          temp.unshift(obj)
          console.log("temp is now", temp.length)
          return { data: temp }
          //return { data: [...state.data.filter((doc) => doc.state !== "Pressure running"), obj] }
        } else if (isOn && pump === "well") {
          const obj = { ...newData.powerDocs[0], state: "Well running" }
          obj.when = parseJSON(obj.when)
          const temp = [...state.data]
          temp.unshift(obj)
          return { data: temp }
        } else if (!isOn && pump === "well") {
          const obj = { ...newData.powerDocs[0], state: "Well ran" }
          obj.when = parseJSON(obj.when)
          const temp = [...state.data]
          temp.unshift(obj)
          return { data: temp }
        }
        console.log("We shouldn't be here")
      }
    }),
}))

export default useStore
