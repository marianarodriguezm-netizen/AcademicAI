export function responderEstudiante(pregunta, solicitudes = []) {
    const texto = pregunta.toLowerCase();

    const total = solicitudes.length;
    if (total === 0 && !texto.includes("hola") && !texto.includes("buenos")) {
        return "Todavía no tienes solicitudes registradas. Cuando registres una, podré ayudarte a consultar su estado, descripción y progreso.";
    }

    const pendientes = solicitudes.filter(
        s => s.estado === "Pendiente de aprobación"
    );

    const proceso = solicitudes.filter(
        s => s.estado === "En proceso"
    );

    const resueltas = solicitudes.filter(
        s => s.estado === "Resuelta"
    );

    // Consultar cantidad total
    if (
        texto.includes("cuantas") ||
        texto.includes("cuántas") ||
        texto.includes("cuantos") ||
        texto.includes("cuántos") ||
        texto.includes("total") ||
        texto.includes("registrado")
    ) {
        return `Actualmente tienes ${total} solicitudes registradas:

• Pendientes: ${pendientes.length}
• En proceso: ${proceso.length}
• Resueltas: ${resueltas.length}`;
    }

    // Consultar respuestas del administrador
    if (
        texto.includes("respuesta del administrador") ||
        texto.includes("respuesta que recibí") ||
        texto.includes("respuesta que recibi") ||
        texto.includes("qué me respondió") ||
        texto.includes("que me respondio")
    ) {
        const solicitudesRespondidas = solicitudes.filter(
            s => s.respuestaAdministrador &&
                s.respuestaAdministrador.trim() !== ""
        );

        if (solicitudesRespondidas.length === 0) {
            return "Todavía no tienes respuestas del administrador en tus solicitudes.";
        }

        return "Estas son las respuestas que has recibido:\n\n" +
            solicitudesRespondidas.map((s, i) =>
                `${i + 1}. ${s.tipo}\nRespuesta: ${s.respuestaAdministrador}`
            ).join("\n\n");
    }

    // Consultar detalles de las solicitudes
    if (
        texto.includes("detalles") ||
        texto.includes("descripción") ||
        texto.includes("descripcion")
    ) {
        if (total === 0) {
            return "Todavía no tienes solicitudes registradas.";
        }

        return "Estos son los detalles de tus solicitudes:\n\n" +
            solicitudes.map((s, i) =>
                `${i + 1}. ${s.tipo}\nDescripción: ${s.descripcion}\nEstado: ${s.estado}`
            ).join("\n\n");
    }
    // Información necesaria para cada solicitud
    if (
        texto.includes("qué información") ||
        texto.includes("que información") ||
        texto.includes("qué debo incluir") ||
        texto.includes("que debo incluir") ||
        texto.includes("qué datos") ||
        texto.includes("que datos")
    ) {
        if (texto.includes("certificado")) {
            return "Para solicitar un certificado, incluye:\n\n• Qué tipo de certificado necesitas.\n• Para qué lo necesitas.\n• Si tienes alguna fecha límite.\n\nAsí será más fácil atender tu solicitud.";
        }

        if (texto.includes("matrícula") || texto.includes("matricula")) {
            return "Para reportar un problema de matrícula, incluye:\n\n• El período académico correspondiente.\n• La descripción del inconveniente.\n• El mensaje de error, si aparece.\n\nEsto ayudará a revisar tu caso.";
        }

        if (texto.includes("asignatura") || texto.includes("materia")) {
            return "Para reportar un problema con una asignatura, incluye:\n\n• El nombre de la materia.\n• La situación que estás presentando.\n• Qué solución o ayuda necesitas.";
        }

        return "La información depende del tipo de solicitud. Indica si se trata de un certificado, matrícula o asignatura para orientarte mejor.";
    }
    // Recomendar tipo de solicitud
    if (
        texto.includes("qué tipo") ||
        texto.includes("que tipo") ||
        texto.includes("cuál debo elegir") ||
        texto.includes("cual debo elegir") ||
        texto.includes("qué solicitud") ||
        texto.includes("que solicitud")
    ) {
        if (
            texto.includes("certificado") ||
            texto.includes("constancia")
        ) {
            return "Te recomiendo seleccionar: Solicitud de certificado. Allí puedes explicar qué documento necesitas.";
        }

        if (
            texto.includes("matrícula") ||
            texto.includes("matricula") ||
            texto.includes("inscripción") ||
            texto.includes("inscripcion")
        ) {
            return "Te recomiendo seleccionar: Problema de matrícula. Describe el inconveniente relacionado con tu proceso de matrícula.";
        }

        if (
            texto.includes("materia") ||
            texto.includes("asignatura") ||
            texto.includes("calificación") ||
            texto.includes("calificacion")
        ) {
            return "Te recomiendo seleccionar: Problema con una asignatura. Explica qué sucede con la materia.";
        }

        return "Cuéntame qué situación necesitas resolver y te ayudaré a identificar el tipo de solicitud adecuado.";
    }

    // Buscar solicitud por tipo
    if (
        texto.includes("certificado") ||
        texto.includes("matrícula") ||
        texto.includes("matricula") ||
        texto.includes("asignatura") ||
        texto.includes("consulta académica")
    ) {
        const solicitudEncontrada = solicitudes.filter(s =>
            texto.includes(s.tipo.toLowerCase())
        );

        if (solicitudEncontrada.length === 0) {
            return "No encontré solicitudes de ese tipo. Verifica si tienes alguna registrada.";
        }

        return "Encontré estas solicitudes:\n\n" +
            solicitudEncontrada.map((s, i) =>
                `${i + 1}. ${s.tipo}\nEstado: ${s.estado}\nDescripción: ${s.descripcion}`
            ).join("\n\n");
    }

    // Consultar estado general de las solicitudes
    if (
        texto.includes("estado de mis") ||
        texto.includes("qué ha pasado") ||
        texto.includes("que ha pasado") ||
        texto.includes("mis trámites") ||
        texto.includes("mis tramites")
    ) {
        return `Este es el estado actual de tus solicitudes:

• Pendientes: ${pendientes.length}
• En proceso: ${proceso.length}
• Resueltas: ${resueltas.length}

Puedes preguntarme por cualquiera de estos estados para conocer más detalles.`;
    }

    // Explicar el significado de los estados
    if (
        texto.includes("qué significa") ||
        texto.includes("que significa") ||
        texto.includes("significado de los estados") ||
        texto.includes("qué es pendiente") ||
        texto.includes("que es pendiente") ||
        texto.includes("qué es en proceso") ||
        texto.includes("que es en proceso") ||
        texto.includes("qué es resuelta") ||
        texto.includes("que es resuelta")
    ) {
        return `Estos son los estados de AcademicAI:

• Pendiente de aprobación: tu solicitud está esperando que el administrador la revise.

• En proceso: tu solicitud ya fue revisada y se está atendiendo.

• Resuelta: tu solicitud ya recibió atención y fue finalizada.

Puedes consultar cualquiera de estos estados desde Mis solicitudes.`;
    }
    // Recomendar acciones según el estado
    if (
        texto.includes("qué debo hacer") ||
        texto.includes("que debo hacer") ||
        texto.includes("cómo proceder") ||
        texto.includes("como proceder") ||
        texto.includes("qué hago") ||
        texto.includes("que hago")
    ) {
        return `Te recomiendo lo siguiente según el estado de tus solicitudes:

• Pendiente de aprobación: espera la revisión del administrador y consulta periódicamente Mis solicitudes.

• En proceso: revisa los avances y mantente atento a cualquier respuesta.

• Resuelta: consulta la respuesta del administrador y verifica la solución ofrecida.

Recuerda que puedes consultar el estado de tus solicitudes en cualquier momento.`;
    }
    // Consultar solicitudes pendientes
    if (texto.includes("pendiente")) {
        if (pendientes.length === 0) {
            return "¡Excelente! No tienes solicitudes pendientes de aprobación.";
        }

        return `Tienes ${pendientes.length} solicitudes pendientes:\n\n` +
            pendientes.map(s => `• ${s.tipo}`).join("\n");
    }

    // Consultar solicitudes en proceso
    if (texto.includes("proceso")) {
        if (proceso.length === 0) {
            return "Actualmente no tienes solicitudes en proceso.";
        }

        return `Tienes ${proceso.length} solicitudes en proceso:\n\n` +
            proceso.map(s => `• ${s.tipo}`).join("\n");
    }

    // Consultar solicitudes resueltas
    if (texto.includes("resuelta") || texto.includes("resueltas")) {
        if (resueltas.length === 0) {
            return "Todavía no tienes solicitudes resueltas.";
        }

        return `Tienes ${resueltas.length} solicitudes resueltas:\n\n` +
            resueltas.map(s => `• ${s.tipo}`).join("\n");
    }

    // Ayuda para registrar solicitudes
    if (
        texto.includes("cómo crear") ||
        texto.includes("como crear") ||
        texto.includes("cómo registrar") ||
        texto.includes("como registrar") ||
        texto.includes("qué tipo de solicitud") ||
        texto.includes("que tipo de solicitud") ||
        texto.includes("cómo redactar") ||
        texto.includes("como redactar")
    ) {
        return `¡Claro! Te puedo orientar para registrar una solicitud:

1. Selecciona el tipo de solicitud que corresponda a tu necesidad.
2. Describe claramente tu situación.
3. Explica qué necesitas y por qué.
4. Incluye los datos importantes para comprender tu caso.
5. Utiliza el botón "Analizar mi solicitud" para recibir recomendaciones.
6. Finalmente, registra tu solicitud.

Procura escribir de forma clara y proporcionar información suficiente.`;
    }


    // Saludo
    if (texto.includes("hola") || texto.includes("buenos")) {
        return "¡Hola! Soy el asistente académico de AcademicAI. Puedo consultar tus solicitudes y orientarte con tus trámites. ¿Qué necesitas saber?";
    }

    return "Puedo ayudarte a consultar tus solicitudes reales. Prueba preguntándome cuántas tienes, cuáles están pendientes o cuáles han sido resueltas.";
}

export function analizarSolicitud(descripcion) {
    const texto = descripcion.toLowerCase();

    if (
        texto.includes("nota") ||
        texto.includes("calificacion") ||
        texto.includes("calificación") ||
        texto.includes("materia")
    ) {
        return {
            clasificacion: "Consulta académica",
            prioridad: "Media",
            sugerencia: "Revisar la información académica del estudiante."
        };
    }

    if (
        texto.includes("certificado") ||
        texto.includes("constancia") ||
        texto.includes("documento")
    ) {
        return {
            clasificacion: "Solicitud de documentos",
            prioridad: "Media",
            sugerencia: "Verificar los requisitos y la documentación necesaria."
        };
    }

    if (
        texto.includes("matricula") ||
        texto.includes("matrícula") ||
        texto.includes("inscripcion") ||
        texto.includes("inscripción")
    ) {
        return {
            clasificacion: "Trámite académico",
            prioridad: "Alta",
            sugerencia: "Verificar el trámite y las fechas académicas correspondientes."
        };
    }

    return {
        clasificacion: "Solicitud general",
        prioridad: "Normal",
        sugerencia: "Leer la descripción y determinar el área responsable."
    };
}

export function revisarSolicitud(descripcion, tipoSolicitud) {
    const texto = descripcion.trim().toLowerCase();
    const palabras = texto.split(/\s+/).filter(Boolean);

    const recomendaciones = [];

    if (palabras.length < 8) {
        recomendaciones.push(
            "Amplía la descripción para explicar mejor tu situación."
        );
    }

    if (!texto.includes("porque") &&
        !texto.includes("ya que") &&
        !texto.includes("debido")) {
        recomendaciones.push(
            "Explica por qué necesitas realizar esta solicitud."
        );
    }

    switch (tipoSolicitud) {
        case "Consulta académica":
            if (!texto.includes("materia") &&
                !texto.includes("asignatura") &&
                !texto.includes("nota")) {
                recomendaciones.push(
                    "Indica qué tema o aspecto académico deseas consultar."
                );
            }
            break;

        case "Problema de matrícula":
            if (!texto.includes("periodo") &&
                !texto.includes("semestre")) {
                recomendaciones.push(
                    "Indica a qué período o semestre corresponde el inconveniente."
                );
            }
            break;

        case "Solicitud de certificado":
            if (!texto.includes("notas") &&
                !texto.includes("estudio") &&
                !texto.includes("matrícula") &&
                !texto.includes("matricula")) {
                recomendaciones.push(
                    "Especifica qué tipo de certificado necesitas."
                );
            }
            break;

        case "Problema con una asignatura":
            if (!texto.includes("materia") &&
                !texto.includes("asignatura")) {
                recomendaciones.push(
                    "Menciona el nombre de la asignatura involucrada."
                );
            }
            break;
    }

    return {
        palabras: palabras.length,
        recomendaciones,
        categoria: tipoSolicitud,
        adecuada: recomendaciones.length === 0
    };
}