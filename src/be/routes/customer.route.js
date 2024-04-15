const express = require('express');
const router = express.Router();
const Customer = require('../models/customer.model');
const Designer = require('../models/designer.model');
const { checkSchema } = require("express-validator");
const { createCustomerValidatorSchema, updateCustomerValidatorSchema } = require("../validator/customer_validator");
const { createDesignerValidatorSchema, updateDesignerValidatorSchema } = require("../validator/designer_validator");
const { authmiddleware } = require('../middleware/authmiddleware');
const { rolemiddleware } = require('../middleware/rolemiddleware');
const { errordatamiddleware } = require('../middleware/errordatamiddleware');
const multer = require('multer');
const path = require('path');

// APIs for Customers
router.get('/list_customers', async (req, res) => {
    try {
        const customers = await Customer.find();
        res.json(customers);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.post('/add_customer', checkSchema(createCustomerValidatorSchema), async (req, res) => {
    const customer = new Customer({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password
    });
    try {
        const newCustomer = await customer.save();
        res.status(201).json(newCustomer);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.patch('/edit_customer/:id', checkSchema(updateCustomerValidatorSchema), async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.id);
        if (!customer) {
            return res.status(404).json({ message: 'Customer not found' });
        }
        if (req.body.name) {
            customer.name = req.body.name;
        }
        if (req.body.email) {
            customer.email = req.body.email;
        }
        if (req.body.password) {
            customer.password = req.body.password;
        }
        const updatedCustomer = await customer.save();
        res.json(updatedCustomer);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.delete('/delete_customer/:id', async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.id);
        if (!customer) {
            return res.status(404).json({ message: 'Customer not found' });
        }
        await customer.remove();
        res.json({ message: 'Customer deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});
module.exports = router;
