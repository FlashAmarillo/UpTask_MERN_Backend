import mongoose from "mongoose";
import bcrypt from "bcrypt";

// Definimos un schema, es decir, la estructura de una base de datos

const usuarioSchema = mongoose.Schema(
    {
    nombre: {
        type: String,
        required: true,
        trim: true,
    },
    password: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        trim: true,
        unique: true,
    },
    token: {
        type: String,
    },
    confirmado: {
        type: Boolean,
        default: false,
    },
}, 
{
    timestamps: true, 
}
);

usuarioSchema.pre('save', async function(next) {
    // cuando hagas cambios en tu perfil si el password si ya estaba hasheado no lo vuelve a hashear
    if(!this.isModified ('password')) {
        next(); // te manda al siguiente middleware
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
})

usuarioSchema.methods.comprobarPassword = async function(passwordFormulario) {
    return await bcrypt.compare(passwordFormulario, this.password);
}

// instanciamos el esquema anterior de los datos en el modelo
const Usuario = mongoose.model("Usuario", usuarioSchema);   

// Hacemos disponible el modelo
export default Usuario;