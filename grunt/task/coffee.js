/* jshint strict:false */

module.exports = {
  options: {
    join: true
  }, 
  
  "dist": {
    files: {
      'dist/js/angular-luminate-utils.js': [
        'src/coffee/luminate-utils.coffee', 
        'src/coffee/provider/*.coffee', 
        'src/coffee/service/*.coffee', 
        'src/coffee/**/*.coffee'
      ]
    }
  }
}