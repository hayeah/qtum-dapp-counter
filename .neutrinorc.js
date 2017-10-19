const reactTSPreset = require("neutrino-preset-react-typescript")

const customSourcemap = ({ config }) => {
  config.when(!!process.env.SOURCEMAP, config => config.devtool(process.env.SOURCEMAP))
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
}
