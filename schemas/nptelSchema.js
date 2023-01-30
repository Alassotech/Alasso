const mongoose = require('mongoose')

const nptelSchema = mongoose.Schema({
  courseName: {
    type: String,
    required: true
  },
  link: {
    type: String,
    required: true
  },
  assignments: [
    {
      week_num: {
        type: String,
        required: true
      },
      content: [
        {
          question: { type: String },
          answer: { type: String }
        }
      ]
    }
  ]
})

module.exports = mongoose.model('NPTEL', nptelSchema)
