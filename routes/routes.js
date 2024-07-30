const express = require('express');
const router = express.Router();
const User = require('../models/users');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

// image upload
var storage = multer.diskStorage({
    destination: function (req, file, cb){
        cb(null, './uploads')
    },
    filename: function(req, file, cb){
        cb(null, file.fieldname + "_" + Date.now() + "_" + file.originalname);
    },
});

var upload = multer({
    storage: storage,
}).single("image");

// insert user into database
router.post('/add', upload, async (req, res) => {
    try {
        const user = new User({
            name: req.body.name,
            email: req.body.email,
            phone: req.body.phone,
            image: req.file.filename,
        });
        
        await user.save();
        
        req.session.message = {
            type: 'success',
            message: 'User added successfully'
        };
        res.redirect('/');
    } catch (err) {
        res.json({message: err.message, type: 'danger'});
    }
});

//Get all user route
router.get('/', async (req, res) => {
    try {
        const users = await User.find().exec();
        res.render('index', {
            title: 'Home Page',
            users: users
        });
    } catch (err) {
        res.json({ message: err.message });
    }
});

router.get('/add', (req, res) => {
    res.render('add_users', { title: "Add Users"});
});

// Edit user route
router.get('/edit/:id', async (req, res) => {
    let id = req.params.id;
    try {
        const user = await User.findById(id).exec(); // Use async/await
        if (!user) {
            return res.redirect('/');  // Redirect if user not found
        }
        res.render("edit_users", {
            title: "Edit User",
            user: user,
        });
    } catch (err) {
        console.error(err); // Log the error
        res.redirect('/'); // Redirect on error
    }
});

// Update user route
router.post('/update/:id', upload, async (req, res) => {
    let id = req.params.id;
    let new_image = '';

    if (req.file) {
        new_image = req.file.filename;
        try {
            fs.unlinkSync(path.join(__dirname, '../uploads', req.body.old_image));
        } catch (err) {
            console.error(err); // Log the error
        }
    } else {
        new_image = req.body.old_image;
    }

    try {
        await User.findByIdAndUpdate(id, {
            name: req.body.name,
            email: req.body.email,
            phone: req.body.phone,
            image: new_image
        }).exec();

        req.session.message = {
            type: 'success',
            message: 'User updated successfully',
        };
        res.redirect('/');
    } catch (err) {
        res.json({ message: err.message, type: 'danger' });
    }
});

// Delete user route
router.get('/delete/:id', async (req, res) => {
    let id = req.params.id;
    try {
        // Find the user by ID
        const user = await User.findById(id).exec();

        if (!user) {
            req.session.message = {
                type: 'danger',
                message: 'User not found',
            };
            return res.redirect('/'); // Redirect if user not found
        }

        // Delete the user's image file if it exists
        if (user.image) {
            fs.unlinkSync(path.join(__dirname, '../uploads', user.image));
        }

        // Delete the user from the database
        await User.findByIdAndDelete(id).exec();

        req.session.message = {
            type: 'success',
            message: 'User deleted successfully',
        };
        res.redirect('/');
    } catch (err) {
        console.error(err); // Log the error
        req.session.message = {
            type: 'danger',
            message: 'An error occurred while deleting the user',
        };
        res.redirect('/');
    }
});

module.exports = router;