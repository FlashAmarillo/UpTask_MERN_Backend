import express from "express";
import { registrar, autenticar, confirmar, olvidePassword, comprobarToken, nuevoPassword, perfil } from '../controllers/usuarioController.js'
import checkAuth from "../middleware/checkAuth.js";

const router = express.Router();

// Autenticacion, Registro y Confirmacion de Usuarios

router.post('/', registrar); //crea un nuevo usuario
router.post('/login', autenticar);
router.get('/confirmar/:token', confirmar);
router.post('/olvide-password', olvidePassword);
router.route('/olvide-password/:token').get(comprobarToken).post(nuevoPassword)

// el checkauth va a proteger el endpoint para comprobar el JWT sea valido y el usuario correcto para darle su perfil
router.get('/perfil', checkAuth, perfil);

export default router;