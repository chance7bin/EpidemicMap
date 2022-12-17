'use strict'
// Template version: 1.3.1
// see http://vuejs-templates.github.io/webpack for documentation.

const path = require('path')

module.exports = {
  dev: {

    // Paths
    assetsSubDirectory: 'static',
    assetsPublicPath: '/',
    proxyTable: {
      // 这里配置 '/api' 就等价于 target , 你在链接里访问 /api === http://localhost:54321
      // '/ChinaOnlineCommunity': {
      //   target: 'https://map.geoq.cn/arcgis/rest/services/ChinaOnlineCommunity',
      //   secure: true, // 如果是 https ,需要开启这个选项
      //   changeOrigin: true, // 是否是跨域请求?肯定是啊,不跨域就没有必要配置这个proxyTable了.
      //   pathRewrite: { // 重写路径  例如浏览器请求地址http://localhost:12345/xxx,实际请求的是你代理的地址：http:xxx/11111
      //     // 这里是追加链接,比如真是接口里包含了 /api,就需要这样配置.
      //     '^/ChinaOnlineCommunity': '/ChinaOnlineCommunity', // 和下边两种写法，因人而异根据需求。
      //     // 等价于    /api + /api  ==  http://localhost:54321/api
      //     // 如果写为 '^/api' : '/'
      //     // 等价于   /api + /  ==  http://localhost:54321/
      //     // 这里的 /api ==  http://localhost:54321
      //   }
      // }
    },

    // Various Dev Server settings
    host: 'localhost', // can be overwritten by process.env.HOST
    port: 8080, // can be overwritten by process.env.PORT, if port is in use, a free one will be determined
    autoOpenBrowser: false,
    errorOverlay: true,
    notifyOnErrors: true,
    poll: false, // https://webpack.js.org/configuration/dev-server/#devserver-watchoptions-


    /**
     * Source Maps
     */

    // https://webpack.js.org/configuration/devtool/#development
    devtool: 'cheap-module-eval-source-map',

    // If you have problems debugging vue-files in devtools,
    // set this to false - it *may* help
    // https://vue-loader.vuejs.org/en/options.html#cachebusting
    cacheBusting: true,

    cssSourceMap: true
  },

  build: {
    // Template for index.html
    index: path.resolve(__dirname, '../dist/index.html'),

    // Paths
    assetsRoot: path.resolve(__dirname, '../dist'),
    assetsSubDirectory: 'static',
    assetsPublicPath: '/studentmap/',

    /**
     * Source Maps
     */

    productionSourceMap: true,
    // https://webpack.js.org/configuration/devtool/#production
    devtool: '#source-map',

    // Gzip off by default as many popular static hosts such as
    // Surge or Netlify already gzip all static assets for you.
    // Before setting to `true`, make sure to:
    // npm install --save-dev compression-webpack-plugin
    productionGzip: false,
    productionGzipExtensions: ['js', 'css'],

    // Run the build command with an extra argument to
    // View the bundle analyzer report after build finishes:
    // `npm run build --report`
    // Set to `true` or `false` to always turn it on or off
    bundleAnalyzerReport: process.env.npm_config_report
  }
}
