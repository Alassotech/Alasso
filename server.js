const express = require('express')
const cors = require('cors')
const { default: mongoose } = require('mongoose')

// Schemas
const Admin = require('./schemas/adminSchema')
const CourseSchema = require('./schemas/courseSchema')
const HelpSchema = require('./schemas/helpSchema')
const File = require('./schemas/fileSchema')
const NPTEL = require('./schemas/nptelSchema')
const User = require('./schemas/userSchema')

require('dotenv').config()
const app = express()
const path = require('path')
const bodyParser = require('body-parser')

const multer = require('multer')
const methodOverride = require('method-override')
const PORT = process.env.PORT || 8000
const bcrypt = require('bcryptjs')
const BASE_URL = process.env.BASE_URL

// Middlewares

app.use(express.json())
app.use(cors())
app.use(bodyParser.json())
app.use(methodOverride('_method'))
app.use(bodyParser.urlencoded({ extended: true }))


// DataBase

mongoose.set('strictQuery', false)
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log('database Connected'))
  .catch(err => console.log('database not connected'))
const conn = mongoose.createConnection(process.env.MONGODB_URI)



app.get('/', (req, res) => {
  res.send('Hello From Server');
})




// Register User
app.post('/user/register', async (req, res) => {
  const { username, email, mobile, password, cpassword } = req.body

  if (!username || !email || !mobile || !password || !cpassword) {
    return res.json({ erro: 'Please fill all the fields' })
  }

  try {
    const userExists = await User.findOne({ email: email })

    if (userExists) {
      return res.status(422).json({ error: 'User already Exists' })
    }

    const user = new User({ username, email, mobile, password, cpassword })
    const newUser = await user.save()

    if (newUser) {
      res.status(201).json({ message: 'Registered' })
    } else {
      res.status(500).json({ message: 'Failed to Register' })
    }
  } catch (error) {
    console.log(error)
  }
})

// Login User

app.post('/user/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      console.log('no email')
      return res.status(400).json({ error: 'please fill all the fields' })
    }

    const userLogin = await User.findOne({ email: email })

    if (userLogin) {
      const isMatch = await bcrypt.compare(password, userLogin.password)
      const token = await userLogin.generateAuthToken()

      if (!isMatch) {
        res.status(400).json({ error: 'Check Your Password' })
      } else {
        if (userLogin.role === 'admin') {
          const user = JSON.stringify(userLogin)
          res.send({ data: { user, token } })
        } else {
          res.send({ data: { token } })
        }
      }
    } else {
      res.status(400).json({ error: 'Check Your Email' })
    }
  } catch (err) {
    console.log('error in node')
    console.log(err)
  }
})

// Add Admin
app.post('/add-developer', (req, res) => {
  const adminDetails = req.body
  console.log(adminDetails)
  Admin.create(adminDetails, (err, data) => {
    if (err) {
      res.status(500).send(err.message)
    } else {
      res.status(201).send(data)
      console.log('data sent to mongo')
    }
  })
})

// Get Admin
app.get('/developers', (req, res) => {
  Admin.find((err, data) => {
    if (err) {
      res.status(500).send(err.message)
    } else {
      res.status(200).send(data)
    }
  })
})

// Multer
const upload = multer({
  storage: multer.diskStorage({
    destination (req, file, cb) {
      cb(null, './files')
    },
    filename (req, file, cb) {
      cb(null, `${new Date().getTime()}_${file.originalname}`)
    }
  }),
  limits: {
    fileSize: 1000000000000000 // max file size 1MB = 1000000000000000 bytes
  },
  fileFilter (req, file, cb) {
    if (!file.originalname.match(/\.(jpeg|jpg|png|pdf|doc|docx|xlsx|xls)$/)) {
      return cb(
        new Error(
          'only upload files with jpg, jpeg, png, pdf, doc, docx, xslx, xls format.'
        )
      )
    }
    cb(undefined, true) // continue with upload
  }
})

// Upload Files
app.post(
  '/upload',
  upload.single('file'),
  async (req, res) => {
    const title = req.body.title
    const subject = req.body.subject
    const semester = req.body.semester
    const unit = req.body.unit
    const worksheet_number = req.body.worksheet_number
    const file_category = req.body.file_category

    const { path, mimetype } = req.file
    const file = new File({
      title,
      subject,
      semester,
      unit,
      worksheet_number,
      file_category,
      file_path: path,
      file_mimetype: mimetype
    })

    await file.save()
    res.send('file uploaded successfully.')
  },
  (error, req, res, next) => {
    if (error) {
      res.status(500).send(error.message)
    }
  }
)

// Get Files
app.get('/getAllFiles', async (req, res) => {
  try {
    const files = await File.find({})
    const sortedByCreationDate = files.sort((a, b) => b.createdAt - a.createdAt)
    res.status(200).send(sortedByCreationDate)
  } catch (error) {
    res.status(400).send('Error while getting list of files. Try again later.')
  }
})

// Download Files
app.get('/download/:id', async (req, res) => {
  try {
    const file = await File.findById(req.params.id)
    res.set({
      'Content-Type': file.file_mimetype
    })
    res.sendFile(path.join(__dirname, file.file_path))
  } catch (error) {
    res.status(400).send('Error while downloading file. Try again later.')
  }
})

// Add Course
app.post('/add-subjects', async (req, res) => {
  try {
    const { courseName, sem_num, link, subs } = req.body

    // check if the courseName already exists in the database
    const existingCourse = await CourseSchema.findOne({ courseName })
    if (existingCourse) {
      // check if the weekNum already exists in the assignments array
      const existingWsem_num = existingCourse.semester.find(
        semester => semester.sem_num === sem_num
      )
      if (existingWsem_num) {
        // update the content field of the existing assignment object
        existingWsem_num.subjects = [...existingWsem_num.subjects, ...subs]
        await existingCourse.save()
        res.status(200).json({ message: 'Assignment content updated' })
      } else {
        // create a new assignment object with the provided weekNum and content
        existingCourse.semester.push({
          sem_num: sem_num,
          subjects: subs
        })
        await existingCourse.save()
        res.status(201).json({ message: 'New assignment created' })
      }
    } else {
      // create a new NPTEL document with the provided courseName, link, and assignments array
      const newCourse = new CourseSchema({
        courseName,
        semester: [{ sem_num, link, subjects: subs }]
      })
      await newCourse.save()
      res.status(201).json({ message: 'New NPTEL course created' })
    }
  } catch (err) {
    res.status(500).json({ message: 'Error saving NPTEL course', error: err })
  }
})

// Get Course
app.get('/getcourse', (req, res) => {
  CourseSchema.find((err, data) => {
    if (err) {
      res.status(500).send(err.message)
    } else {
      res.status(200).send(data)
    }
  })
})

// Upload Help
app.post('/upload-help', (req, res) => {
  const helpQuestions = req.body

  HelpSchema.create(helpQuestions, (err, data) => {
    if (err) {
      res.status(500).send(err.message)
    } else {
      res.status(201).send(data)
      console.log('data sent to mongo')
    }
  })
})

// get help
app.get('/get-doubts', (req, res) => {
  HelpSchema.find((err, data) => {
    if (err) {
      res.status(500).send(err.message)
    } else {
      res.status(200).send(data)
    }
  })
})

// Get Nptel course
app.get('/nptel-courses', (req, res) => {
  NPTEL.find((err, data) => {
    if (err) {
      res.status(500).send(err.message)
    } else {
      res.status(200).send(data)
    }
  })
})

// Add NPTEL

app.post('/api/nptel', async (req, res) => {
  try {
    const { courseName, link, weekNum, questions } = req.body

    const existingCourse = await NPTEL.findOne({ courseName })
    if (existingCourse) {
      const existingWeekNum = existingCourse.assignments.find(
        assignment => assignment.week_num === weekNum
      )
      if (existingWeekNum) {
        existingWeekNum.content = [...existingWeekNum.content, ...questions]
        await existingCourse.save()
        res.status(200).json({ message: 'Assignment content updated' })
      } else {
        existingCourse.assignments.push({
          week_num: weekNum,
          content: questions
        })
        await existingCourse.save()
        res.status(201).json({ message: 'New assignment created' })
      }
    } else {
      const newNPTEL = new NPTEL({
        courseName,
        link,
        assignments: [{ week_num: weekNum, content: questions }]
      })
      await newNPTEL.save()
      res.status(201).json({ message: 'New NPTEL course created' })
    }
  } catch (err) {
    res.status(500).json({ message: 'Error saving NPTEL course', error: err })
  }
})

app.listen(PORT, () => {
  console.log(`Server connected on ${PORT}`)
})
