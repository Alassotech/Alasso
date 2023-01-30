const mongoose = require('mongoose')

const adminSchema = mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  uid: {
    type: String,
    required: true
  },
  course: {
    type: String,
    required: true
  },
  role: {
    type: String,
    required: true
  },
  linkedIn: {
    type: String,
    required: true
  },
  instagram: {
    type: String,
    required: true
  },
  year: {
    type: String,
    required: true
  }
})

module.exports = mongoose.model('Developers', adminSchema)
