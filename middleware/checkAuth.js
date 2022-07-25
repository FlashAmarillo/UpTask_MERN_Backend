import jwt from "jsonwebtoken";
import Usuario from "../models/Usuario.js";

//Este checkAuth verifica el JWT que sea valido, que exista, que este enviado via headers
// si todo esta bien se va al siguiente middleware llamado perfil 

const checkAuth = async (req, res, next) => {
    let token;
    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Defino en una variable el token completo del usuario via headers
            token = req.headers.authorization.split(' ')[1];
            // Autenticacion del JWT
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            //  Una vez el usuario autenticado se almacena en el req.usuario
            req.usuario = await Usuario.findById(decoded.id).select("-password -confirmado -token  -createdAt -updatedAt -__v");
            return next();
        } catch (error) {
            return res.status(404).json({msg: 'Hubo un error'})
        }
    }

    // si existe un error lanzamos un error
    if(!token) {
        const error = new Error('Token no válido');
        return res.status(401).send({msg: error.message});
    }

    next();
}

export default checkAuth;