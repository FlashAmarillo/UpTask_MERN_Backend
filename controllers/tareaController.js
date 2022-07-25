import Tarea from "../models/Tarea.js";
import Proyecto from "../models/Proyecto.js";

const agregarTarea = async(req, res) => {
    const { proyecto } = req.body; // tomamos el id del proyecto
    //traemos el proyecto 
    const existeProyecto = await Proyecto.findById(proyecto);
    
    // Solo la persona que esta autorizada puede acceder a este proyecto
    if (!existeProyecto) {
        const error = new Error('El proyecto no existe');
        return res.status(404).json({msg: error.message});
    }

    // comprobar si la persona que esta dando de alta es quien creo el proyecto
    if (existeProyecto.creador.toString() !== req.usuario._id.toString() ) {
        const error = new Error('No tienes los permisos adecuados para agregar tareas');
        return res.status(403).json({msg: error.message});
    }

    try {
        // creamos una nueva tarea y  se guarda directamente en la DB 
        const tareaAlmacenada = await Tarea.create(req.body);
        // Almacenar el ID de la tarea en el arreglo de tareas del proyecto
        existeProyecto.tareas.push(tareaAlmacenada._id);
        await existeProyecto.save();
        res.json(tareaAlmacenada);
    } catch (error) {
        console.log(error)
    }
}

const obtenerTarea = async(req, res) => {
    //obtenemos el id para esta peticion
    const { id } = req.params;
    //identificamos la tarea, .populate trae la informacion del proyecto asociado a la tarea
    const tarea = await Tarea.findById(id).populate('proyecto');
    // Validacion de que la tarea exista
    if(!tarea) {
        const error = new Error('Tarea no encontrada');
        return res.status(404).json({msg: error.message});
    }
    // Validacion que el creador de la tarea sea el mismo usuario logeado
    if(tarea.proyecto.creador.toString() !== req.usuario._id.toString()) {
        const error = new Error('Acción no Válida');
        return res.status(403).json({msg: error.message});
    }
    res.json(tarea);

}

const actualizarTarea = async(req, res) => {
    //obtenemos el id para esta peticion
    const { id } = req.params;
    //identificamos la tarea, .populate trae la informacion del proyecto asociado a la tarea
    const tarea = await Tarea.findById(id).populate('proyecto');
    // Validacion de que la tarea exista
    if(!tarea) {
        const error = new Error('Tarea no encontrada');
        return res.status(404).json({msg: error.message});
    }
    // Validacion que el creador de la tarea sea el mismo usuario logeado
    if(tarea.proyecto.creador.toString() !== req.usuario._id.toString()) {
        const error = new Error('Acción no Válida');
        return res.status(403).json({msg: error.message});
    }

    //actualizacion de la instancia con los elementos del formulario
    tarea.nombre = req.body.nombre || tarea.nombre;
    tarea.descripcion = req.body.descripcion || tarea.descripcion;
    tarea.prioridad = req.body.prioridad || tarea.prioridad;
    tarea.fechaEntrega = req.body.fechaEntrega || tarea.fechaEntrega;

    //actualizamos los datos en la DB
    try {
        const tareaActualizada = await tarea.save();
        res.json(tareaActualizada);
    } catch (error) {
        console.log(error)
    }
}

const eliminarTarea = async(req, res) => {
    //obtenemos el id para esta peticion
    const { id } = req.params;
    //identificamos la tarea, .populate trae la informacion del proyecto asociado a la tarea
    const tarea = await Tarea.findById(id).populate('proyecto');
    // Validacion de que la tarea exista
    if(!tarea) {
        const error = new Error('Tarea no encontrada');
        return res.status(404).json({msg: error.message});
    }
    // Validacion que el creador de la tarea sea el mismo usuario logeado
    if(tarea.proyecto.creador.toString() !== req.usuario._id.toString()) {
        const error = new Error('Acción no Válida');
        return res.status(403).json({msg: error.message});
    }

    try {

        const proyecto = await Proyecto.findById(tarea.proyecto);
        proyecto.tareas.pull(tarea._id);
        
        await Promise.allSettled([await proyecto.save(), await tarea.deleteOne()]);
        res.json({msg: "La tarea se eliminó correctamente 🦄"});
    } catch (error) {
        console.log(error)
    }
}

const cambiarEstado = async(req, res) => {
    //obtenemos el id de la tarea en esta peticion
    const { id } = req.params;
    //identificamos la tarea, .populate trae la informacion del proyecto asociado a la tarea
    const tarea = await Tarea.findById(id).populate('proyecto').populate('completado');

    // Validacion de que la tarea exista
    if(!tarea) {
        const error = new Error('Tarea no encontrada');
        return res.status(404).json({msg: error.message});
    }

    // Validacion que el creador de la tarea sea el mismo usuario logeado
    if(tarea.proyecto.creador.toString() !== req.usuario._id.toString() && !tarea.proyecto.colaboradores.some( colaborador => colaborador._id.toString() === req.usuario._id.toString())) {
        const error = new Error('Acción no Válida');
        return res.status(403).json({msg: error.message});
    }

    // cambiamos el estado de la tarea a su opuesto
    tarea.estado = !tarea.estado;
    // agregamos a la DB
    tarea.completado = req.usuario._id;
    // guardamos el nuevo estado
    await tarea.save();

    const tareaAlmacenada = await Tarea.findById(id)
        .populate('proyecto')
        .populate('completado');
    
    res.json(tareaAlmacenada);
}

export {
    agregarTarea,
    obtenerTarea,
    actualizarTarea,
    eliminarTarea,
    cambiarEstado
}