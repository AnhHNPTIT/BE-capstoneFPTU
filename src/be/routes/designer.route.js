const express = require('express');
const router = express.Router();
const Designer = require('../models/designer.model');
const { checkSchema } = require("express-validator");
const { createDesignerValidatorSchema, updateDesignerValidatorSchema } = require("../validator/designer_validator");
const { authmiddleware } = require('../middleware/authmiddleware');
const { rolemiddleware } = require('../middleware/rolemiddleware');
const { errordatamiddleware } = require('../middleware/errordatamiddleware');
const multer = require('multer');
const path = require('path');

// Get all designers
router.get('/list_designers', async (req, res) => {
    try {
        const designers = await Designer.find();
        res.json(designers);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create a new designer
router.post('/add_designer', checkSchema(createDesignerValidatorSchema), authmiddleware, async (req, res) => {
    const designer = new Designer({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password
    });
    try {
        const newDesigner = await designer.save();
        res.status(201).json(newDesigner);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Update designer
router.patch('/edit_designer/:id', checkSchema(updateDesignerValidatorSchema), authmiddleware, async (req, res) => {
    try {
        const designer = await Designer.findById(req.params.id);
        if (!designer) {
            return res.status(404).json({ message: 'Designer not found' });
        }
        if (req.body.name) {
            designer.name = req.body.name;
        }
        if (req.body.email) {
            designer.email = req.body.email;
        }
        if (req.body.password) {
            designer.password = req.body.password;
        }
        const updatedDesigner = await designer.save();
        res.json(updatedDesigner);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete designer
router.delete('/delete_designer/:id', authmiddleware, async (req, res) => {
    try {
        const designer = await Designer.findById(req.params.id);
        if (!designer) {
            return res.status(404).json({ message: 'Designer not found' });
        }
        await designer.remove();
        res.json({ message: 'Designer deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Upload avatar for designer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'src/uploads');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    },
});

const upload = multer({ storage: storage });

router.post('/upload_avatar/:id', authmiddleware, upload.single('avatar'), async (req, res) => {
    try {
        const designer = await Designer.findById(req.params.id);
        if (!designer) {
            return res.status(404).json({ message: 'Designer not found' });
        }
        designer.avatar = req.file.filename; // Lưu tên file avatar vào trong document của designer
        await designer.save();
        res.json({ message: 'Avatar uploaded successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
