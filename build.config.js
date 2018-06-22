const nodeExternals = require('webpack-node-externals');

module.exports = {
  webpack: {
    externals: [
      nodeExternals(),
      { leaflet: 'L' },
      { 'leaflet-imageoverlay-rotated': 'leaflet-imageoverlay-rotated' },
    ],
  },
};
