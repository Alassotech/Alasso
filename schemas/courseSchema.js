const mongoose = require('mongoose')

const courseSchema = mongoose.Schema({
  courseName: {
    type: String,
    required: true
  },
  semester: [
    {
      sem_num: {
        type: String,
        required: true
      },
      link: {
        type: String,
        required: true
      },
      subjects: [
        {
          sub_name: { type: String },
          sub_code: { type: String },
          sub_credit:{type:Number}
        }
      ]
    }
  ]
})

module.exports = mongoose.model('course', courseSchema)
