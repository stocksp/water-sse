import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App.jsx"
import "./styles/index.css"
//import { PlasmicRootProvider } from "@plasmicapp/react-web"
// import PlasmicGlobalContextsProvider from "./components/plasmic/doclog_2/PlasmicGlobalContextsProvider.jsx"

console.log("env is dev: ", import.meta.env.DEV)

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
