const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const bcrypt = require('bcryptjs');
const config = require('config'); // *** NOT WORKING ***
const jwt = require('jsonwebtoken');
const User = require('../../models/Users');
const { check, validationResult } = require('express-validator');

// @route   GET api/auth
// @desc    Get one user
// @access  Public

router.get('/', auth, async (req, res) => {
    const { id } = req.user;
    try {
        const user = await User.findById(id).select('-password');
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});
// @route   POST api/auth
// @desc    Register new user
// @access  Public
router.post(
    '/',
    [
        // Validation for login information
        check('email', 'Please include a valid email').isEmail(),
        check('password', 'Password is required').exists()
    ],
    // Handles body of POST request
    async (req, res) => {
        const errors = validationResult(req);
        // Check if any errors were stored in the errors object
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password } = req.body; // deconstruct req.body

        try {
            // Check if user exists
            let user = await User.findOne({ email });
            if (!user) {
                return res.status(400).json({
                    errors: [{ msg: 'Failed to login' }]
                });
            }

            const isMatch = await bcrypt.compare(password, user.password);

            if (!isMatch) {
                return res.status(400).json({
                    errors: [{ msg: 'Failed to login' }]
                });
            }

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
