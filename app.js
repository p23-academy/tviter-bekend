const express = require('express')
const app = express()
const port = 3000
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

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

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  username: String,
});

const UserModel = mongoose.model('user', userSchema)

app.post("/api/register", async (req, res) => {
  try {
    const email = req.body.email;
    const existingUser = await UserModel.findOne({email});
    if (existingUser) {
      throw Error(`User already exists`);
    }
    const password = req.body.password;
    const hashedPassword = await bcrypt.hash(password, 10);
    const userBody = {
      email: email,
      password: hashedPassword,
      username: req.body.username,
    }
    const user = await UserModel.create(userBody)
    const token = jwt.sign({id: user.id, email: user.email, username: user.username}, "p23-akademija")
    return res.status(200).json(token)
  } catch (error) {
    console.log(error)
    return res.status(400).json({error: "Cannot register user", message: error.message})
  }
})

app.post("/api/login", async (req, res) => {
  try {
    const email = req.body.email;
    const user = await UserModel.findOne({email});
    if (!user) {
      throw Error(`User doesn't exists`);
    }
    const password = req.body.password
    const matchingPassword = await bcrypt.compare(password, user.password);
    if (!matchingPassword) {
      throw Error(`Invalid password`);
    }
    const token = jwt.sign({id: user.id, email: user.email, username: user.username}, "p23-akademija")
    return res.status(200).json(token)
  } catch (error) {
    console.log(error)
    return res.status(400).json({error: "Cannot log in user", message: error.message})
  }
})

app.post("/api/verify", async (req, res) => {
  try {
    const token = req.body.token;
    await jwt.verify(token, "p23-akademija");
    return res.status(200).json(token)
  } catch (error) {
    console.log(error)
    return res.status(401).json({error: "Cannot log in user", message: error.message})
  }
})

// get user po id-u
app.get("/api/users/:id", async (req, res) => {
  try {
    const userId = req.params.id
    if (!userId) {
      throw Error(`No userId found`)
    }
    const user = await UserModel.findById(userId)
    return res.status(200).json(user)
  } catch (error) {
    console.log(error)
    return res.status(404).json({error: `No user with that ID found`, message: error.message})
  }
})

// pretraga user-a po username
app.post("/api/search", async (req, res) => {
  try {
    const username = req.body.username;
    console.log(username)
    if (!username) {
      throw Error(`No username found`)
    }
    const users = await UserModel.find({username: {$regex: username}});
    return res.status(200).json(users)
  } catch (error) {
    console.log(error)
    return res.status(404).json({error: `No user with that ID found`, message: error.message})
  }
})

const tweetSchema = new mongoose.Schema({
  author: String,
  authorId: String,
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

// get tvit po id-u
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

// novi tvit
app.post('/api/tweets', async (req, res) => {
  try {
    const tweetBody = {
      author: req.body.author,
      authorId: req.body.authorId,
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
    const tweets = await TweetModel.find({authorId: userId})
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

const followsSchema = new mongoose.Schema({
  follower: String,
  following: String,
  time: Date,
});

const FollowModel = mongoose.model('follow', followsSchema)

app.post("/api/follows", async (req, res) => {
  try {
    const followsBody = {
      follower: req.body.follower,
      following: req.body.following,
      time: req.body.time,
    }
    const follow = await FollowModel.create(followsBody)
    return res.status(200).json(follow)
  } catch (error) {
    console.log(error)
    return res.status(400).json({error: "Cannot create following", message: error.message})
  }
})

app.delete("/api/follows", async (req, res) => {
  try {
    const follower = req.body.follower
    const following = req.body.following
    await FollowModel.deleteMany({follower: follower, following: following})
    return res.status(200).json({})
  } catch (error) {
    console.log(error)
    return res.status(400).json({error: "Cannot create following", message: error.message})
  }
})

app.get("/api/follows/:follower/:following", async (req, res) => {
  try {
    const follower = req.params.follower
    const following = req.params.following
    const follow = await FollowModel.find({follower: follower, following: following})
    return res.status(200).json(follow)
  } catch (error) {
    console.log(error)
    return res.status(400).json({error: "Cannot create following", message: error.message})
  }
})

app.get("/api/feed/:userId", async (req, res) => {
  try {
    const userId = req.params.userId
    const followings = await FollowModel.find({follower: userId})
    const followingIds = followings.map(following => following.following)
    const tweets = await TweetModel.find({authorId: {$in: followingIds}})
    return res.status(200).json(tweets)
  } catch (error) {
    console.log(error)
    return res.status(400).json({error: "Cannot get feed", message: error.message})
  }
})
