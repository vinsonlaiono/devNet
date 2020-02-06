const express = require('express');
const router = express.Router();
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const config = require('config'); // *** NOT WORKING ***
const jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator');

const User = require('../../models/Users');

// @route           POST api/users
// @description     Register a new user
// @access          Public
router.post(
    '/',
    [
        // Validation for user information
        check('name', 'Name is required')
            .not()
            .isEmpty(),
        check('email', 'Please include a valid email').isEmail(),
        check('password', 'Password must be 6 or more characters').isLength({
            min: 6
        })
    ],
    // Handles body of POST request
    async (req, res) => {
        const errors = validationResult(req);
        // Check if any errors were stored in the errors object
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, email, password } = req.body; // deconstruct req.body

        try {
            // Check if user exists
            let user = await User.findOne({ email });
            if (user) {
                return res.status(400).json({
                    errors: [{ msg: 'User already exists' }]
                });
            }

            const avatar = gravatar.url(email, {
                s: '200',
                r: 'pg',
                d: 'mm'
            });
            // Create a new user instance
            user = new User({
                name,
                email,
                avatar,
                password
            });
            // Generate bcrypt sale & hash
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, salt);

            await user.save();

            // create payload object for jwt signature
            const payload = {
                user: {
                    id: user.id
                }
            };

            jwt.sign(
                payload,
                // this token "mysecrettoken" should be coming from default.json file but config is not being recognized
                // need to fix config dependency. This is the same issue with db name mongoURI
                'mysecrettoken',    
                { expiresIn: 360000 },
                (err, token) => {
                    if (err) throw err;
                    res.json({ token });
                }
            );
        } catch (err) {
            console.error(`Catch error log: ${err.message}`);
            res.status(500).send('Server error');
        }
    }
);

module.exports = router;
