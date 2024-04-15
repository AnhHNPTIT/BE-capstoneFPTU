const Customer = require('../models/customer.model');

// Hàm để tạo một khách hàng mới
exports.createCustomer = async (req, res) => {
    try {
        const customer = new Customer({
            name: req.body.name,
            email: req.body.email,
            password: req.body.password
        });
        const newCustomer = await customer.save();
        res.status(201).json(newCustomer);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// Hàm để lấy danh sách tất cả khách hàng
exports.getAllCustomers = async (req, res) => {
    try {
        const customers = await Customer.find();
        res.json(customers);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Hàm để lấy thông tin của một khách hàng dựa trên ID
exports.getCustomerById = async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.id);
        if (!customer) {
            return res.status(404).json({ message: 'Customer not found' });
        }
        res.json(customer);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Hàm để cập nhật thông tin của một khách hàng dựa trên ID
exports.updateCustomer = async (req, res) => {
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
};

// Hàm để xóa một khách hàng dựa trên ID
exports.deleteCustomer = async (req, res) => {
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
};
