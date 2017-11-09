const webpack = require("webpack")
const reactTSPreset = require("neutrino-preset-react-typescript")
const dappConfig = require("config")

const customSourcemap = ({ config }) => {
  config.when(!!process.env.SOURCEMAP, config => config.devtool(process.env.SOURCEMAP))
}

const defineGlobals = ({ config }) => {
  const globals = {}
  Object.keys(dappConfig).map((key) => {
    const val = dappConfig[key]
    globals[key] = JSON.stringify(val, null, "  ")
  })

  // console.log("define plugin", webpack.DefinePlugin)

  config.plugin("globals")
    .use(webpack.DefinePlugin, [globals])
}

module.exports = (neutrino, opts = {}) => {
  neutrino.use(reactTSPreset, {
    ...opts,
    html: {
      links: [
        "https://fonts.googleapis.com/css?family=Lato:100,100i,300,300i,400,400i,700,700i,900,900i",
      ],
    },
    devServer: { port: process.env.PORT || 3000 },
  })

  neutrino.use(customSourcemap)

  neutrino.use(defineGlobals)
}
