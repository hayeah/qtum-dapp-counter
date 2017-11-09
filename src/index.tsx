import "font-awesome/css/font-awesome.css"
import "normalize.css"

import "./index.css"

import {
  Contract,
  IContractInfo,
  QtumRPC,
} from "qtumjs"
import * as React from "react"
import { render } from "react-dom"

import { App } from "./views/App"

const { Buffer } = require("buffer")
Object.assign(window, {
  Buffer,
})

const rpc = new QtumRPC(QTUM_RPC)
const msgboard = new Contract(rpc, CONTRACTS.msgboard)

async function getCount() {
  const r = await msgboard.call("getCount")
  const [count] = r.outputs

  console.log("msg count", count)
}
// const messageBoardDeployInfo = CONTRACTS.msgboard

function main() {

  getCount()

  render(
    <App />,
    document.getElementById("root"))
}

window.addEventListener("load", main)
