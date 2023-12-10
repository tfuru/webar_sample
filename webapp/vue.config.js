const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true,
  publicPath: process.env.NODE_ENV === 'production' ? '/webar_sample/' : './',
  pages: {
    index: {
      entry: 'src/main.ts',
      title: 'webar_sample',
    }
  }  
})
