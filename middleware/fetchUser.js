const jwt = require('jsonwebtoken');

const fetchUser = (req, res, next) =>{
    //Getting the user from JWT token & add id to request object
    const token = req.header("auth");
    if(!token){
        res.status(401).send({error: "Please authenticate using the valid token"})
    }

    try {
        const data = jwt.verify(token, process.env.SECRET_KEY)
        req.user = data.user
        next()
    } catch (error) {
        res.status(401).send({error: "Token unmatched error occured"})
    }
    
}

module.exports = fetchUser;