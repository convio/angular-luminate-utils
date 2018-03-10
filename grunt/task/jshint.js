/* jshint strict:false */

module.exports = {
  options: {
    jshintrc: 'grunt/.jshintrc'
  }, 
  
  "grunt-config": {
    files: [
      {
        src: [
          'grunt/task/*.js', 
          'grunt/.jshintrc'
        ]
      }
    ]
  }
}