const mongoose = require('mongoose')

const helpSchema = mongoose.Schema({
  ques: {
    type: String,
    required: true
  },
  ans: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  }
})

module.exports = mongoose.model('Help', helpSchema)
