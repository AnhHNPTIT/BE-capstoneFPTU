const router = require('express').Router()
const User = require('./../controllers/user.controller')
const Schedule = require('./../controllers/schedule.controller')
const { checkSchema } = require("express-validator")
const { createUserValidatorSchema, validatorPasswordChange, validatorPasswordChangeOTP } = require("../validator/user_validator")
const { authmiddleware } = require('../middleware/authmiddleware')
const { rolemiddleware } = require('../middleware/rolemiddleware');
const { errordatamiddleware } = require('../middleware/errordatamiddleware');
const multer = require('multer');
const path = require('path');
router.post('/register', checkSchema(createUserValidatorSchema), User.register_user)
router.route('/login_email').post(User.login_email)
router.route('/login_phone').post(User.login_phone)
router.get('/list_user_role_admin', authmiddleware, (req, res, next) => {
    req.dataRole = { list_role: ['ADMIN'] };
    next();
}, rolemiddleware, User.get_list_user);

router.post('/search_user_role_admin', authmiddleware, (req, res, next) => {
    req.dataRole = { list_role: ['ADMIN'] };
    next();
}, rolemiddleware, User.search_list_user);


router.delete('/delete_user/:id', authmiddleware, (req, res, next) => {
    req.dataRole = { list_role: ['ADMIN'] };
    next();
}, rolemiddleware, User.delete_user);

router.post('/change-password', checkSchema(validatorPasswordChange), authmiddleware, User.change_password);

router.post('/send-otp', User.send_otp);

router.post('/change-password-otp', checkSchema(validatorPasswordChangeOTP), errordatamiddleware, User.change_password_otp);

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

router.post('/upload-file', upload.single('file'), User.uploadFile);

router.post('/upload--multi-file', upload.array('files', 15), User.uploadMultiFile);

router.get('/information-user', authmiddleware, User.informationController);

router.post('/update-user', authmiddleware, (req, res, next) => {
    req.dataRole = { list_role: ['ADMIN'] };
    next();
}, rolemiddleware, User.updateUser);

router.post('/list-user', authmiddleware, (req, res, next) => {
    req.dataRole = { list_role: ['ADMIN', "STAFF", "DESIGNER", "CUSTOMER"] }
    next();
}, rolemiddleware, User.get_list_for_role);

router.post('/update-designer', authmiddleware, (req, res, next) => {
    req.dataRole = { list_role: ["DESIGNER"] }
    next();
}, rolemiddleware, User.updateInformationDESIGNER);

router.post('/update-designer/:id', authmiddleware, (req, res, next) => {
    req.dataRole = { list_role: ["ADMIN", "DESIGNER", "STAFF", "CUSTOMER", "GUEST"] }
    next();
}, rolemiddleware, User.getInformationDESIGNER);

router.get('/cv/:designerId', authmiddleware, (req, res, next) => {
    req.dataRole = { list_role: ["ADMIN", "STAFF"] }
    next();
}, rolemiddleware, User.getDesignerInfo);

router.get('/list-all-schedule', authmiddleware, (req, res, next) => {
    req.dataRole = { list_role: ["ADMIN", "STAFF"] }
    next();
}, rolemiddleware, Schedule.getAllListSchedule);

router.post('/list-search-all-schedule', authmiddleware, (req, res, next) => {
    req.dataRole = { list_role: ["ADMIN", "STAFF"] }
    next();
}, rolemiddleware, Schedule.searchListSchedule);

router.get('/create-schedule', authmiddleware, (req, res, next) => {
    req.dataRole = { list_role: ["DESIGNER"] }
    next();
}, rolemiddleware, Schedule.createSchedule);

router.get('/schedule/designer-info', authmiddleware, (req, res, next) => {
    req.dataRole = { list_role: ["ADMIN", "STAFF", "DESIGNER"] }
    next();
}, rolemiddleware, Schedule.getScheduleInfoByDesigner)

router.get('/schedule/user-info', authmiddleware, (req, res, next) => {
    req.dataRole = { list_role: ["ADMIN", "CUSTOMER", "STAFF"] }
    next();
}, rolemiddleware, Schedule.getScheduleInfoByCustomer)

router.get('/schedule/:designerId/graySchedule', authmiddleware, (req, res, next) => {
    req.dataRole = { list_role: ["ADMIN", "DESIGNER", "STAFF", "CUSTOMER"] }
    next();
}, rolemiddleware, Schedule.getGraySchedule)

router.get('/schedule/user-list-schedule', authmiddleware, (req, res, next) => {
    req.dataRole = { list_role: ["CUSTOMER"] }
    next();
}, rolemiddleware, Schedule.getListScheduleByUser)

router.get('/schedule/:designerId/busy-dates', authmiddleware, (req, res, next) => {
    req.dataRole = { list_role: ["ADMIN", "DESIGNER", "STAFF", "CUSTOMER"] }
    next();
}, rolemiddleware, Schedule.getDesignerCalendar);

router.get('/schedule/:scheduleId', authmiddleware, (req, res, next) => {
    req.dataRole = { list_role: ["ADMIN", "DESIGNER", "STAFF", "CUSTOMER"] }
    next();
}, rolemiddleware, Schedule.getScheduleById);

router.post('/schedule/:designerId/book', authmiddleware, (req, res, next) => {
    req.dataRole = { list_role: ["ADMIN", "DESIGNER", "STAFF", "CUSTOMER"] }
    next();
}, rolemiddleware, Schedule.book_for_customer);

router.post('/schedule/confirm', authmiddleware, (req, res, next) => {
    req.dataRole = { list_role: ["ADMIN", "DESIGNER"] }
    next();
}, rolemiddleware, Schedule.register_schedule_on);

router.patch('/schedule/:designerId/update', authmiddleware, (req, res, next) => {
    req.dataRole = { list_role: ["ADMIN", "STAFF"] }
    next();
}, rolemiddleware, Schedule.updateSchedule);


router.get('/profile-me', authmiddleware , User.get_profile);
router.post('/update_profile', authmiddleware , User.update_user);


module.exports = router
