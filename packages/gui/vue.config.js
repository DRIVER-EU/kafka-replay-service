module.exports = {
  lintOnSave: true,
  configureWebpack: {
    output: {
      path: __dirname + "../../service/public"
    },
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
