import Proyecto from "../models/Proyecto.js";
import Usuario from "../models/Usuario.js";

//plural, obtiene varios proyectos para quien los creo segun su usuario/id
const obtenerProyectos = async(req, res) => {
    const proyectos = await Proyecto.find({
        '$or' : [
            {'colaboradores': { $in: req.usuario}},
            {'creador': { $in: req.usuario}}
        ]
    }).select('-tareas'); //el ._id lo coloco yo 
    
    res.json(proyectos);
}

// crea un nuevo proyecto
const nuevoProyecto = async(req, res) => {
    // instanciamos el proyecto
    const proyecto = new Proyecto(req.body);
    
    // al proyecto instanciado le agregamos el creador que es el usuario de la cuenta
    proyecto.creador = req.usuario._id;

    try {
        const proyectoAlmacenado = await proyecto.save();
        res.json(proyectoAlmacenado);
    } catch (error) {
        console.log(error)
    }
}

// singular, obtiene un solo proyecto y las tareas asociadas a el
const obtenerProyecto = async(req, res) => {
    // esta funcion se utiliza en un routing dinamico
    const { id } = req.params; // id del proyecto a buscar

    const proyecto = await Proyecto.findById(id)
        .populate({ 
            path: 'tareas', 
            populate: { path: 'completado', select: "nombre"},
        })
        .populate('colaboradores', 'nombre email');

    // validacion de que el proyecto exista
    if(!proyecto) {
        const error = new Error('Proyecto no encontrado');
        return res.status(404).send({ msg: error.message});
    }

    // solo la persona que lo creo y colaboradores puede acceder al proyecto y si ambas se cumples entonces es una accion no valida
    if(proyecto.creador.toString() !== req.usuario._id.toString() && !proyecto.colaboradores.some( colaborador => colaborador._id.toString() === req.usuario._id.toString())) {
        const error = new Error('Acción no Válida');
        return res.status(401).send({ msg: error.message});
    }

    // Obtener las tareas del proyecto
    //const tareas = await Tarea.find().where('proyecto').equals(proyecto._id);
    
    res.json(proyecto);
}

// edita un proyecto
const editarProyecto = async(req, res) => {
    // esta funcion se utiliza en un routing dinamico
    const { id } = req.params; // id del proyecto a editar

    // traemos el proyecto que queremos editar
    const proyecto = await Proyecto.findById(id); 

    // validacion de que el proyecto exista
    if(!proyecto) {
        const error = new Error('Proyecto no encontrado');
        return res.status(404).send({ msg: error.message});
    }

    // solo la persona que lo creo puede acceder al proyecto
    if(proyecto.creador.toString() !== req.usuario._id.toString()) {
        const error = new Error('Acción no Válida');
        return res.status(401).send({ msg: error.message});
    }

    //Si ha llegado hasta aqui es que paso las validaciones
    proyecto.nombre = req.body.nombre || proyecto.nombre; //lo reasigna o se queda con lo que tenia en la DB
    proyecto.descripcion = req.body.descripcion || proyecto.descripcion;
    proyecto.fechaEntrega = req.body.fechaEntrega || proyecto.fechaEntrega;
    proyecto.cliente = req.body.cliente || proyecto.cliente;

    // Guardamos los datos en la BD
    try {
        const proyectoActualizaedo = await proyecto.save();
        res.json(proyectoActualizaedo);
    } catch (error) {
        console.log(error)
    }
}   

// elimina un proyecto
const eliminarProyecto = async(req, res) => {
    // esta funcion se utiliza en un routing dinamico
    const { id } = req.params; // id del proyecto a editar

    // traemos el proyecto que queremos editar
    const proyecto = await Proyecto.findById(id); 

    // validacion de que el proyecto exista
    if(!proyecto) {
        const error = new Error('Proyecto no encontrado');
        return res.status(404).send({ msg: error.message});
    }

    // solo la persona que lo creo puede acceder al proyecto
    if(proyecto.creador.toString() !== req.usuario._id.toString()) {
        const error = new Error('Acción no Válida');
        return res.status(401).send({ msg: error.message});
    }

    try {
        await proyecto.deleteOne();
        res.json({msg: "Proyecto eliminado correctamente"});
    } catch (error) {
        console.log(error)
    }
}
// buscar el colaborador
const buscarColaborador = async(req, res) => {
    const { email } = req.body;

    const usuario = await Usuario.findOne({email}).select('-password -confirmado -createdAt -token -updatedAt -__v');

    // Validación
    if(!usuario) {
        const error = new Error('Usuario no encontrado');
        return res.status(404).json({ msg: error.message });
    }

    res.json(usuario);
}

// Agrega Colaboradores
const agregarColaborador = async(req, res) => {

    const proyecto = await Proyecto.findById(req.params.id);

    //validacion
    if(!proyecto) {
        const error = new Error('Proyecto no encontrado 😔');
        return res.status(404).json({msg: error.msg});
    }

    // validar de que el creador no se pueda agregar como colaborador
    if(proyecto.creador.toString() !== req.usuario._id.toString()) {
        const error = new Error('Acción no valida 💁‍♂️');
        return res.status(404).json({msg: error.msg});
    }

    const { email } = req.body;
     const usuario = await Usuario.findOne({email}).select('-password -confirmado -createdAt -token -updatedAt -__v');

    // Validación de que existe el usuario
    if(!usuario) {
        const error = new Error('Usuario no encontrado');
        return res.status(404).json({ msg: error.message });
    }

    //El colaborador NO es el admin del proyecto
    if(proyecto.creador.toString() === usuario._id.toString()) {
        const error = new Error('El creador del proyecto no puede ser colaborador');
        return res.status(404).json({ msg: error.message });
    }

    //Revisar que no este ya agregado al proyecto
    if(proyecto.colaboradores.includes(usuario._id)) {
        const error = new Error('El usuario ya pertenece al proyecto');
        return res.status(404).json({ msg: error.message });
    }

    // Despues de todas estas validacion, esta bien, se puede agregar el colaborador
    proyecto.colaboradores.push(usuario._id);
    await proyecto.save();
    res.json({msg: 'Colaborador Agregado Correctamente'});
}

// Eliminar un colaborador
const eliminarColaborador = async(req, res) => {

    const proyecto = await Proyecto.findById(req.params.id);

    //validacion
    if(!proyecto) {
        const error = new Error('Proyecto no encontrado 😔');
        return res.status(404).json({msg: error.msg});
    }

    // validar de que el creador no se pueda agregar como colaborador
    if(proyecto.creador.toString() !== req.usuario._id.toString()) {
        const error = new Error('Acción no valida 💁‍♂️');
        return res.status(404).json({msg: error.msg});
    }

    // Despues de todas estas validacion, se puede eliminar
    proyecto.colaboradores.pull(req.body.id);

    await proyecto.save();
    res.json({msg: 'Colaborador Eliminado Correctamente'});

    
}

export {
    obtenerProyecto,
    obtenerProyectos,
    nuevoProyecto,
    editarProyecto,
    eliminarProyecto,
    buscarColaborador,
    agregarColaborador,
    eliminarColaborador
}
