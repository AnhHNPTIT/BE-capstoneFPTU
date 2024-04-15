const Designer = require('../models/designer.model');

// Hàm để tạo một người thiết kế mới
exports.createDesigner = async (req, res) => {
    try {
        const designer = new Designer({
            fullName: req.body.fullName,
            email: req.body.email,
            password: req.body.password,
            phoneNumber: req.body.phoneNumber,
            address: req.body.address,
            role: req.body.role,
            designerCode: req.body.designerCode,
            isActive: req.body.isActive
        });
        const newDesigner = await designer.save();
        res.status(201).json(newDesigner);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// Hàm để lấy danh sách tất cả người thiết kế
exports.getAllDesigners = async (req, res) => {
    try {
        const designers = await Designer.find();
        res.json(designers);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Hàm để lấy thông tin của một người thiết kế dựa trên ID
exports.getDesignerById = async (req, res) => {
    try {
        const designer = await Designer.findById(req.params.id);
        if (!designer) {
            return res.status(404).json({ message: 'Designer not found' });
        }
        res.json(designer);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Hàm để cập nhật thông tin của một người thiết kế dựa trên ID
exports.updateDesigner = async (req, res) => {
    try {
        const designer = await Designer.findById(req.params.id);
        if (!designer) {
            return res.status(404).json({ message: 'Designer not found' });
        }
        designer.set(req.body);
        const updatedDesigner = await designer.save();
        res.json(updatedDesigner);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// Hàm để xóa một người thiết kế dựa trên ID
exports.deleteDesigner = async (req, res) => {
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
};
