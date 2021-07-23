const path = require("path");
const CopyWebpackPlugin = require("copy-webpack-plugin");

const cesiumPath = "node_modules/cesium/Build/Cesium";

function pathJoin(dir) {
  return path.join(__dirname, dir);
}

module.exports = {
  configureWebpack: {
    resolve: {
      alias: {
        "@": pathJoin("/src")
      }
    },
    plugins: [
      new CopyWebpackPlugin({
        patterns: [
          {
            from: path.join(__dirname, cesiumPath, "Workers"),
            to: "Workers"
          },
          {
            from: path.join(__dirname, cesiumPath, "ThirdParty"),
            to: "ThirdParty"
          },
          { from: path.join(__dirname, cesiumPath, "Assets"), to: "Assets" },
          { from: path.join(__dirname, cesiumPath, "Widgets"), to: "Widgets" }
        ]
      })
    ]
  }
};
