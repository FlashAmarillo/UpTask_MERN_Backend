import Usuario from "../models/Usuario.js";
import generarId from "../helpers/generarId.js";
import generarJWT from "../helpers/generarJWT.js";
import { emailRegistro, emailOlvidePassword } from "../helpers/email.js";

const registrar = async (req, res) => {
    // req es lo que le mandas al servdor, res es la respuesta del servidor

    //evitar registros duplicados de emails
    const { email } = req.body;
    const existeUsuario = await Usuario.findOne({ email });
    if(existeUsuario) {
        const error = new Error('Usuario ya registrado');
        res.status(400).json({msg: error.message});
    }
    
    //ingresamos la informacion del req en la DB
    try {
        const usuario = new Usuario(req.body); // Crea una nueva instancia de usuario siguiendo el schema Usuario con la informacion de la peticion
        usuario.token = generarId(); // genera un id y lo agrega al token 
        await usuario.save(); // lo guarda en la DB

        //llamamos la funcion para enviar email de confirmacion
        emailRegistro({
            email: usuario.email,
            nombre: usuario.nombre,
            token: usuario.token
        })

        // enviamos respuesta del servidor
        res.json({msg: "Usuario Creado Correctamente, Revisa tu Email para confirmar tu cuenta"});

    } catch (error) {
        console.log(error)
    }
}

const autenticar = async (req, res) => {
    const {email, password} = req.body;

    //Comprobar si el usuario existe
    const usuario = await Usuario.findOne({ email });
    if(!usuario) {
        const error = new Error('El usuario no existe');
        return res.status(404).send({ msg: error.message});
    }
    //comprobar si el usuario esta confirmado
    if(!usuario.confirmado) {
        const error = new Error('Tu cuenta no ha sido confirmada');
        return res.status(404).send({ msg: error.message});
    }

    //comprobar el password
    if(await usuario.comprobarPassword(password)) {
        res.send({
            _id: usuario._id,
            nombre: usuario.nombre,
            email: usuario.email,
            token: generarJWT(usuario._id),
        })
    } else {
        const error = new Error('El password ingresado es incorrecto');
        return res.status(404).send({ msg: error.message});
    }
}

const confirmar = async (req, res) => {
    // aqui extraemos de la URL el token que validaremos via email
    const { token } = req.params;
    const usuarioConfirmar = await Usuario.findOne({ token });
    if(!usuarioConfirmar) {
        const error = new Error('Token no valido');
        return res.status(404).send({ msg: error.message});
    }
    // actualizamos y confirmamos al usuario en la base de datos
    try {
        usuarioConfirmar.confirmado = true
        usuarioConfirmar.token = "";
        await usuarioConfirmar.save(); // lo almacena en la DB
        res.json({msg: "Usuario Confirmado Correctamente"});
    } catch (error) {
        console.log(error)
    }
}

const olvidePassword = async (req, res) => {
    const { email } = req.body;

    //Comprobar si el usuario existe
    const usuario = await Usuario.findOne({ email });
    if(!usuario) {
        const error = new Error('El usuario no existe');
        return res.status(404).send({ msg: error.message});
    }
    //comprobar si el usuario esta confirmado
    if(!usuario.confirmado) {
        const error = new Error('Tu cuenta no ha sido confirmada');
        return res.status(404).send({ msg: error.message});
    }

    try {
        usuario.token = generarId();
        await usuario.save();

        // Enviamos el email con las instrucciones
        emailOlvidePassword({
            email: usuario.email,
            nombre: usuario.nombre,
            token: usuario.token
        })

        res.send({msg: "Hemos enviado un email con las instrucciones para recuperar tu contraseña"})
    } catch (error) {
        console.log(error)
    }
}

const comprobarToken = async(req, res) => {
    const { token } = req.params; // extraemos el token de la url
    
    //Comprobar si el token existe
    const tokenValido = await Usuario.findOne({ token });
    
    if(tokenValido) {
        res.json({ msg: "token valido"})
    } else {
        const error = new Error('El token no es válido');
        return res.status(404).send({ msg: error.message});
    }
}

const nuevoPassword = async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;

    //Comprobar si el token existe
    const usuario = await Usuario.findOne({ token });

    if(usuario) {
        usuario.password = password; //actualiza el password
        usuario.token = ''; // elimina el token 
        try {
            await usuario.save(); // guarda el usuario con el password modificado
            res.send({ msg: "Password modificado correctamente"});
        } catch (error) {
            console.log(error)
        }
    } else {
        const error = new Error('El token no es válido');
        return res.status(404).send({ msg: error.message});
    }
}

const perfil = async (req, res) => {
    // traemos al usuario guardado en el req despues del middleware
    const { usuario } = req

    res.json(usuario)
}

export {
    registrar,
    autenticar,
    confirmar,
    olvidePassword,
    comprobarToken,
    nuevoPassword,
    perfil
}