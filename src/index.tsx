import "bulma/css/bulma.css"
import "font-awesome/css/font-awesome.css"

import "./index.css"

import * as React from "react"
import { render } from "react-dom"

import { App } from "./views/App"

function main() {
  render(
    <App />,
    document.getElementById("root"))
}

window.addEventListener("load", main)
