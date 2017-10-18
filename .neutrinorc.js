const reactTSPreset = require("neutrino-preset-react-typescript")

const customSourcemap = ({ config }) => {
  config.when(!!process.env.SOURCEMAP, config => config.devtool(process.env.SOURCEMAP))
}

module.exports = (neutrino, opts = {}) => {
  neutrino.use(reactTSPreset, {
    ...opts,
    devServer: { port: process.env.PORT || 3000 },
  })

  neutrino.use(customSourcemap)
}
