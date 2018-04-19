module.exports = {
  lintOnSave: true,
  configureWebpack: {
    module: {
      rules: [
        {
          test: /\.html$/,
          loader: "raw-loader",
          exclude: ["./public/index.html"]
        }
      ]
    }
  }
}
