
//Como se reutiliza en varias partes creamos este archivo
const crearMensaje = ( nombre, mensaje ) => {
    return {
        nombre,
        mensaje,
        fecha: new Date().getTime()
    }
}

module.exports = {
    crearMensaje
}