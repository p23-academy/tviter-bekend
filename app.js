const express = require('express')
const app = express()
const port = 3000
const cors = require('cors');
const mongoose = require('mongoose');

app.get('/', (req, res) => {
  res.send('Tviter bekend')
})

app.use(cors());
app.use(express.json());

mongoose.connect('mongodb://localhost:27017/tviter')
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error);
  })

app.listen(port, () => {
  console.log(`Tviter bekend pokrenut na portu ${port}`)
})

const tweetSchema = new mongoose.Schema({
  author: String,
  tweet: String,
  time: Date,
});

const TweetModel = mongoose.model('tweet', tweetSchema)

app.get("/api/tweets", async (req, res) => {
  try {
    const tweets = await TweetModel.find({})
    return res.status(200).json(tweets)
  } catch (error) {
    console.log(error)
    return res.status(400).json({error: "Cannot access tweets", message: error.message})
  }
})

app.get("/api/tweets/:id", async (req, res) => {
  try {
    const tweetId = req.params.id
    if (!tweetId) {
      throw Error(`No tweetId found`)
    }
    const tweet = await TweetModel.findById(tweetId)
    return res.status(200).json(tweet)
  } catch (error) {
    console.log(error)
    return res.status(404).json({error: `No tweet with that ID found`, message: error.message})
  }
})

app.post('/api/tweets', async (req, res) => {
  try {
    const tweetBody = {
      author: req.body.author,
      tweet: req.body.tweet,
      time: req.body.time,
    }
    const tweet = await TweetModel.create(tweetBody)
    return res.status(200).json(tweet)
  } catch (error) {
    console.log(error)
    return res.status(400).json({error: "Cannot create tweet", message: error.message})
  }
})

app.post('/api/tweets/:id', async (req, res) => {
  try {
    const tweetId = req.params.id
    if (!tweetId) {
      throw Error(`No tweetId found`)
    }
    const tweetBody = {
      tweet: req.body.tweet,
    }
    const tweet = await TweetModel.updateOne({_id: tweetId}, tweetBody)
    return res.status(200).json(tweet)
  } catch (error) {
    console.log(error)
    return res.status(400).json({error: "Cannot update tweet", message: error.message})
  }
})

app.get("/api/users/:userId/tweets", async (req, res) => {
  try {
    const userId = req.params.userId
    if (!userId) {
      throw Error(`No userId found`)
    }
    const tweets = await TweetModel.find({author: userId})
    return res.status(200).json(tweets)
  } catch (error) {
    console.log(error)
    return res.status(404).json({error: "Cannot find user", message: error.message})
  }
})

app.delete("/api/tweets", async (req, res) => {
  try {
    const tweetId = req.body.id
    if (!tweetId) {
      throw Error(`No tweetId found`)
    }
    await TweetModel.deleteOne({_id: tweetId})
    return res.status(200).json({})
  } catch (error) {
    console.log(error)
    return res.status(400).json({error: "Cannot delete tweet", message: error.message})
  }
})