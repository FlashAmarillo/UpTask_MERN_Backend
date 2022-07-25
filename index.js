import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import conectarDB from "./config/db.js";
import usuarioRoutes from "./routes/usuarioRoutes.js";
import proyectoRoutes from "./routes/proyectoRoutes.js";
import tareaRoutes from "./routes/tareaRoutes.js";

//instanciamos el paquete de express
const app = express();

// permitimos que pueda leer la informacion que viene como json y se pueda procesar correctamente
app.use(express.json());

// permite la ejecucion de variables de entorno
dotenv.config();

// llamamos la funcion para conectarnso a la base de datos
conectarDB();

//configuracion de cors
const whitelist = [process.env.FRONTEND_URL];
const corsOptions = {
    origin: function (origin, callback) {
        if(whitelist.includes(origin)) {
            // puede consultar la API
            callback(null, true);
        } else { 
            // no esta permitido su request
            callback(new Error('Error de cors'));
        }
    },
}

app.use(cors(corsOptions));

//Routing de las diferentes paginas
app.use('/api/usuarios', usuarioRoutes) // .use soporta TODOS los vervos para las peticiones http
app.use('/api/proyectos', proyectoRoutes)  
app.use('/api/tareas', tareaRoutes)  

//definimos nuestro puerto
const PORT = process.env.PORT || 4000;

//definimos nuestro servidor para que use el puerto
const servidor = app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT} 😎`);
})

// Socket.io
import { Server } from "socket.io";

const io = new Server(servidor, {
    pingTimeout: 60000,
    cors: {
        origin: process.env.FRONTEND_URL,

    }
});

// Abriendo conexion de socket.io

io.on('connection', (socket) => {

    //Definir los eventos de socket io
    socket.on('abrir proyecto', (proyecto) => {
        // cuando el usuario entre al proyecto, sera como una sala aparte (room)
        socket.join(proyecto);
    })

    // evento para cuando creamos una nueva tarea
    socket.on('nueva tarea', (tarea) => {
        const proyecto = tarea.proyecto;
        socket.to(proyecto).emit('tarea agregada', tarea)
    })

    // evento cuando se elimina una tarea
    socket.on('eliminar tarea', (tarea) => {
        const proyecto = tarea.proyecto;
        socket.to(proyecto).emit('tarea eliminada', tarea)
    })

    socket.on('actualizar tarea', (tarea) => {
        // identificamos primero el proyecto al que esta vinculada la tarea
        const proyecto = tarea.proyecto._id;
        socket.to(proyecto).emit('tarea actualizada', tarea);
    })

    socket.on('cambiar estado', (tarea) => {
        const proyecto = tarea.proyecto._id;
        socket.to(proyecto).emit('nuevo estado', tarea);
    });
})