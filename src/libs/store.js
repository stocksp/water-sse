import { create } from "zustand"
import convert from "./convertToPower"

const useStore = create((set) => ({
  data: [],
  setData: (newData) =>
    set((state) => {
      if (state.data.length === 0) {
        const theData = convert(newData)
        return { data: theData }
      }
      // Check for new distDocs
      if (newData.distDocs.length > 0) {
        console.log("distDoc is ", newData.distDocs[0])
        const obj = { ...newData.distDocs[0] }
        return [...state.data, obj]
      }
      // Check for new powerDocs
      if (newData.powerDocs.length > 0) {
        console.log("powerdoc is ", newData.powerDocs[0])
        const pump = newData.powerDocs[0].pump
        const isOn = newData.powerDocs[0].state === "on"

        if (isOn && pump === "pressure") {
          const obj = { ...newData.powerDocs[0], state: "Pressure running" }
          return [...state.data, obj]

          // we need to remove Pressure running
          // we only keep one record of when it finnished and
          // how long it ran .. see filter
        } else if (!isOn && pump === "pressure") {
          const obj = { ...newData.powerDocs[0], state: "Pressure ran" }
          return [...state.data.filter((doc) => doc.state !== "Pressure running"), obj]
        } else if (isOn && pump === "well") {
          const obj = { ...newData.powerDocs[0], state: "Well running" }
          return [...state.data, obj]
        } else if (!isOn && pump === "well") {
          const obj = { ...newData.powerDocs[0], state: "Well ran" }
          return [...state.data, obj]
        }
        console.log("We shouldn't be here")
      }
      
    }),
}))

export default useStore
