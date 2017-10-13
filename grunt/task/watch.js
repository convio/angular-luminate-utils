/* jshint strict:false */

module.exports = {
  "grunt-config": {
    files: [
      'grunt/task/*.js', 
      'grunt/.jshintrc'
    ], 
    tasks: [
      'jshint:grunt-config', 
      'notify:grunt-config'
    ]
  }, 
  
  "dist": {
    files: [
      'src/coffee/**/*'
    ], 
    tasks: [
      'clean:dist', 
      'js-dist:dist', 
      'notify:dist'
    ]
  }
}