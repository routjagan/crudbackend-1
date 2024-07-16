const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const User = require('../models/User');
const Post = require('../models/Post');

const router = express.Router();

// Register
router.post('/register', (req, res) => {
  const { name, email, password } = req.body;
  User.findOne({ email }).then(user => {
    if (user) {
      return res.status(201).json({ message: 'Email already exists' });
    } else {
      const newUser = new User({
        name,
        email,
        password
      });

      bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(newUser.password, salt, (err, hash) => {
          if (err) throw err;
          newUser.password = hash;
          newUser.save()
            .then(user => res.json({user,status:true,message:"Signup successfully"}))
            .catch(err => console.log(err));
        });
      });
    }
  });
});

// Login
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  User.findOne({ email }).then(user => {
    if (!user) {
      return res.status(401).json({message: 'User not found' });
    }

    bcrypt.compare(password, user.password).then(isMatch => {
      if (isMatch) {
        const payload = { id: user.id, name: user.name };

        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: 3600 }, (err, token) => {
          res.json({
            status:true,message:"Login successfully",
            // token: 'Bearer ' + token,
            token: 'Bearer ' + token,
            name:user.name,id:user._id
          });
        });
      } else {
        return res.status(201).json({ status:false,message: 'Password incorrect' });
      }
    });
  });
});
router.get('/nearestlist', async (req, res) => {
  const { longitude, latitude } = req.query;
  const distance = 10000; // 10 kilometers in meters

  if (!longitude || !latitude) {
    return res.status(400).json({ message: 'Longitude and latitude are required' });
  }

  const parsedLongitude = parseFloat(longitude);
  const parsedLatitude = parseFloat(latitude);

  const query = {
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [parsedLongitude, parsedLatitude]
        },
        $maxDistance: distance
      }
    }
  };

  console.log('Constructed query:', JSON.stringify(query, null, 2));

  try {
    const posts = await Post.find(query);
    console.log('Query successful. Number of posts found:', posts.length);
    res.json(posts);
  } catch (error) {
    console.error('Error occurred during query:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Protected route 
router.get('/current', passport.authenticate('jwt', { session: false }), (req, res) => {
  res.json({
    id: req.user.id,
    name: req.user.name,
    email: req.user.email
  });
});

module.exports = router;
