import "font-awesome/css/font-awesome.css"
import "normalize.css"

import "./index.css"

import * as React from "react"
import { render } from "react-dom"

render(
  <h1>
    Hello React TypeScript <span className="fa fa-heart" />
  </h1>,
  document.getElementById("root"))
