const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

require('dotenv').config()
const userSchema = mongoose.Schema({
  username: {
    type: String,
    require: true
  },
  email: {
    type: String,
    require: true
  },
  mobile: {
    type: Number,
    require: true
  },
  password: {
    type: String,
    require: true
  },
  cpassword: {
    type: String,
    require: true
  },
  role: {
    type: String,
    default: 'user'
  },
  tokens: [
    {
      token: {
        type: String,
        require: true
      }
    }
  ]
})


userSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 12)
    this.cpassword = await bcrypt.hash(this.cpassword, 12)
  }
  next()
})

userSchema.methods.generateAuthToken = async function () {
  try {
    let token = jwt.sign({ _id: this._id }, process.env.JWTSECRETTOKEN);
    this.tokens = this.tokens.concat({token : token});
    await this.save();
    return token;
  } catch (error) {
    console.log(err)
  }
}

const User = mongoose.model('user', userSchema)
module.exports = User
