
module.exports.rolemiddleware = function (req, res, next) {

    const roleUser = req?.dataToken?.role;
    const roleHavePermission = req.dataRole.list_role;
    try {
        if (roleHavePermission.includes(roleUser)) {
            next()
        } else {
            res.status(401).json({ message: 'Access token not found or permission denied' });
        }
    } catch (error) {

    }

}