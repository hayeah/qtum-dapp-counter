module.exports = {
  options: {
    entry: 'index.jsx',
  },
  use: [
    'neutrino-preset-react',
    (neutrino) => neutrino.config
      .entry('vendor')
        .add('react')
        .add('react-dom')
  ]
};