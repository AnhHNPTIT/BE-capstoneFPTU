const jwt = require('jsonwebtoken')
module.exports.authmiddleware = function(req, res, next){
	const authHeader = req.header('Authorization')
	const token = authHeader && authHeader.split(' ')[1]
	if (!token)
		return res
			.status(401)
			.json({ message: 'Access token not found' })

	try {
		const decoded =  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
		req.dataToken  = decoded
		next()
	} catch (error) {
		return res.status(403).json({ message: 'Invalid token' })
	}
}