
const { validationResult } = require('express-validator');

module.exports.errordatamiddleware = function (req, res, next) {

    const resultValidator = validationResult(req);
    if (!resultValidator.isEmpty()) {
        return res.status(400).send({ errors: resultValidator.array() })
    }else {
        next();
    }

}