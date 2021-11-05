const { io } = require('../server');
const { Usuarios } = require('../classes/usuarios');

const { crearMensaje } = require('../utilidades/utilidades');

const usuarios = new Usuarios();

io.on('connection', (client) => {

    client.on('entrarChat', (data, callback) => {

        if( !data.nombre || !data.sala ){
            return callback({
                error: true,
                mensaje: 'El nombre/sala es necesario'
            })
        }

        //Unir un cliente a una sala
        client.join(data.sala);

        let personas = usuarios.agregarPersona( client.id, data.nombre, data.sala )

        //Cada vez que un cliente se conecta emitir un evento a todos los usuarios para Informar las personas conectadas
        // client.broadcast.emit('listaPersona', usuarios.getPersonas() );
        
        //Cuando un cliente se conecta a una sala en particular, notificar solo a los clientes que esten conectados a esa sala
        client.broadcast.to(data.sala).emit('listaPersona', usuarios.getPersonasPorSala(data.sala) );

        //Enviar mensaje a los usuarios de la sala cuando un cliente se conecta a la sala
        client.broadcast.to(data.sala).emit('crearMensaje', crearMensaje({nombre:'Administrador'}, `${data.nombre} se unio`) );//crearMensaje es un metodo que esta en un archivo aparte, creado asi porque ese codigo se esta reutilizando en varias partes


        // callback( personas );
        callback( usuarios.getPersonasPorSala( data.sala ) )

    });

    client.on('crearMensaje', (data, callback) => {

        let persona = usuarios.getPersona( client.id );

        let mensaje = crearMensaje( persona, data.mensaje );

        // client.broadcast.emit( 'crearMensaje', mensaje );
        
        //Enviar mensaje solo a los usuarios de la sala al que esta conectado el cliente
        client.broadcast.to(persona.sala).emit( 'crearMensaje', mensaje );

        callback( mensaje );

    });

    client.on('disconnect', () => {

        let personaBorrada = usuarios.borrarPersona( client.id );

        //Informar a todos los usuarios
        // client.broadcast.emit('crearMensaje', { usuario: 'Administrador', mensaje: `${ personaBorrada.nombre } abandono el chat` });
        // client.broadcast.emit('crearMensaje', crearMensaje('Administrador', `${personaBorrada.nombre} salio`) );//crearMensaje es un metodo que esta en un archivo aparte, creado asi porque ese codigo se esta reutilizando en varias partes

        //Informar a todos los usuarios que estan conectados a la sala del usuario que se esta desconectando
        client.broadcast.to(personaBorrada.sala).emit('crearMensaje', crearMensaje({nombre:'Administrador'}, `${personaBorrada.nombre} salio`) );//crearMensaje es un metodo que esta en un archivo aparte, creado asi porque ese codigo se esta reutilizando en varias partes
        
        //CAda vez que un cliente se desconecta emitir un evento a todos los usuarios para Informar las personas conectadas
        // client.broadcast.emit('listaPersona', usuarios.getPersonas() );

        //CAda vez que un cliente se desconecta emitir un evento a todos los usuarios CONECTADOS A LA SALA para Informar la nueva lista de las personas conectadas
        client.broadcast.to(personaBorrada.sala).emit('listaPersona', usuarios.getPersonasPorSala(personaBorrada.sala) );


    });

    // Mensajes privados
    client.on('mensajePrivado', data => {

        //Persona que envia el mje
        let persona = usuarios.getPersona( client.id );
                            //data.para tiene como valor el id del cliente socket
        client.broadcast.to(data.para).emit( 'mensajePrivado', crearMensaje( persona.nombre, data.mensaje ) );
    });

});