import { create } from "zustand"
import { parseJSON, compareDesc } from "date-fns"
import convert from "./convertToPower"

const useStore = create((set) => ({
  data: [],
  setData: (newData) =>
    set((state) => {
      console.log(
        `calling setData with preState length: ${state.data.length} newData: dists: ${newData.distDocs.length} power: ${newData.powerDocs.length}`
      )
      if (state.data.length === 0) {
        const theData = convert(newData)
        return { data: theData }
      }
      // Check for new distDocs
      if (newData.distDocs.length > 0) {
        console.log("distDoc is ", newData.distDocs[0])
        const obj = { ...newData.distDocs[0] }
        obj.when = parseJSON(obj.when)
        console.log("new dist is:", obj)
        return { data: [...state.data, obj] }
      }
      // Check for new powerDocs
      if (newData.powerDocs.length > 0) {
        console.log("powerdoc is ", newData.powerDocs[0])
        const pump = newData.powerDocs[0].pump
        const isOn = newData.powerDocs[0].state === "on"

        if (isOn && pump === "pressure") {
          const obj = { ...newData.powerDocs[0], state: "Pressure running" }
          obj.when = parseJSON(obj.when)
          return { data: [...state.data, obj] }

          // we need to remove Pressure running
          // we only keep one record of when it finnished and
          // how long it ran .. see filter
        } else if (!isOn && pump === "pressure") {
          const obj = { ...newData.powerDocs[0], state: "Pressure ran" }
          obj.when = parseJSON(obj.when)
          return { data: [...state.data.filter((doc) => doc.state !== "Pressure running"), obj] }
        } else if (isOn && pump === "well") {
          const obj = { ...newData.powerDocs[0], state: "Well running" }
          obj.when = parseJSON(obj.when)
          return { data: [...state.data, obj] }
        } else if (!isOn && pump === "well") {
          const obj = { ...newData.powerDocs[0], state: "Well ran" }
          obj.when = parseJSON(obj.when)
          return { data: [...state.data, obj] }
        }
        console.log("We shouldn't be here")
      }
    }),
}))

export default useStore
