const express = require('express')
const app = express()
const cors = require('cors')
const mongoose = require('mongoose')
require('dotenv').config()

app.use(cors())
app.use(express.static('public'))
app.use(express.urlencoded({ extended: true }))
app.use(express.json())

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
})

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})

// User schema and model
const userSchema = new mongoose.Schema({
  username: String
})
const User = mongoose.model('User', userSchema)

// Exercise schema and model
const exerciseSchema = new mongoose.Schema({
  userId: String,
  description: String,
  duration: Number,
  date: Date
})
const Exercise = mongoose.model('Exercise', exerciseSchema)

// Create new user
app.post('/api/users', async (req, res) => {
  const newUser = new User({ username: req.body.username })
  await newUser.save()
  res.json({ username: newUser.username, _id: newUser._id })
})

// Get all users
app.get('/api/users', async (req, res) => {
  const users = await User.find({}, 'username _id')
  res.json(users)
})

// Add exercise
app.post('/api/users/:_id/exercises', async (req, res) => {
  const { description, duration, date } = req.body
  const user = await User.findById(req.params._id)
  if (!user) return res.send('User not found')

  const exercise = new Exercise({
    userId: user._id,
    description,
    duration: parseInt(duration),
    date: date ? new Date(date) : new Date()
  })

  await exercise.save()

  res.json({
    _id: user._id,
    username: user.username,
    date: exercise.date.toDateString(),
    duration: exercise.duration,
    description: exercise.description
  })
})

// Get exercise log
app.get('/api/users/:_id/logs', async (req, res) => {
  const user = await User.findById(req.params._id)
  if (!user) return res.send('User not found')

  let query = { userId: user._id }
  const from = req.query.from ? new Date(req.query.from) : null
  const to = req.query.to ? new Date(req.query.to) : null
  const limit = parseInt(req.query.limit) || 500

  if (from || to) {
    query.date = {}
    if (from) query.date.$gte = from
    if (to) query.date.$lte = to
  }

  const exercises = await Exercise.find(query).limit(limit)

  const log = exercises.map(e => ({
    description: e.description,
    duration: e.duration,
    date: e.date.toDateString()
  }))

  res.json({
    username: user.username,
    count: log.length,
    _id: user._id,
    log
  })
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
