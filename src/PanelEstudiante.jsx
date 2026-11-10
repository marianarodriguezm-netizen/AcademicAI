
import { useEffect, useState } from "react";
import { db } from "./firebase";
import {
    collection,
    query,
    where,
    onSnapshot,
    addDoc,
    getDocs,
    getDoc,
    doc,
    updateDoc,
    serverTimestamp
} from "firebase/firestore";
import { auth } from "./firebase";
import { signOut } from "firebase/auth";
import {
    responderEstudiante,
    revisarSolicitud
} from "./asistenteAcademico";

function PanelEstudiante({ usuario, onCerrarSesion }) {
    const usuarioAutenticado = auth.currentUser;
    const [solicitudes, setSolicitudes] = useState([]);
    const [mostrarFormulario, setMostrarFormulario] = useState(false);
    const [mostrarMisSolicitudes, setMostrarMisSolicitudes] = useState(false);
    const [mostrarMiPerfil, setMostrarMiPerfil] = useState(false);
    const [editandoPerfil, setEditandoPerfil] = useState(false);
    const [guardandoPerfil, setGuardandoPerfil] = useState(false);

    const [datosPerfil, setDatosPerfil] = useState({
        nombre: usuario.nombre || "",
        tipoDocumento: usuario.tipoDocumento || "",
        numeroDocumento: usuario.numeroDocumento || "",
        correo: usuario.correo || "",
        codigoEstudiante: usuario.codigoEstudiante || "",
        programaAcademico: usuario.programaAcademico || "",
        semestre: usuario.semestre || "",
        periodoAcademico: usuario.periodoAcademico || "",
        jornada: usuario.jornada || "",
        modalidad: usuario.modalidad || ""
    });
    const [tipoSolicitud, setTipoSolicitud] = useState("Consulta académica");
    const [descripcion, setDescripcion] = useState("");
    const [guardando, setGuardando] = useState(false);
    const [resultadoRevision, setResultadoRevision] = useState(null);
    const [descripcionMejorada, setDescripcionMejorada] = useState("");
    const [mostrarAsistente, setMostrarAsistente] = useState(false);
    const [preguntaAsistente, setPreguntaAsistente] = useState("");
    const [mensajesAsistente, setMensajesAsistente] = useState([
        {
            tipo: "ia",
            texto: "¡Hola! Soy el asistente académico de AcademicAI. ¿En qué puedo ayudarte?"
        }
    ]);
    const enviarPreguntaAsistente = () => {
        if (!preguntaAsistente.trim()) return;

        const pregunta = preguntaAsistente.trim();

        const respuesta = responderEstudiante(
            pregunta,
            solicitudes
        );

        setMensajesAsistente((mensajes) => [
            ...mensajes,
            { tipo: "usuario", texto: pregunta },
            { tipo: "ia", texto: respuesta }
        ]);

        setPreguntaAsistente("");
    };
    // Escuchar las solicitudes del estudiante
    useEffect(() => {
        console.log("UID recibido en PanelEstudiante:", usuario.uid);
        console.log("Usuario autenticado:", auth.currentUser?.uid);

        getDocs(
            query(
                collection(db, "solicitudes"),
                where("usuarioId", "==", usuario.uid)
            )
        )
            .then((resultado) => {
                console.log("Solicitudes encontradas:", resultado.size);
            })
            .catch((error) => {
                console.error("Error en consulta filtrada:", error);
            });

        const consulta = query(
            collection(db, "solicitudes"),
            where("usuarioId", "==", usuario.uid)
        );

        const cancelarEscucha = onSnapshot(
            consulta,
            (resultado) => {
                const datos = resultado.docs.map((documento) => ({
                    id: documento.id,
                    ...documento.data()
                }));

                setSolicitudes(datos);
                console.log("Respuestas recibidas:", datos.map(s => ({
                    tipo: s.tipo,
                    respuesta: s.respuestaAdministrador
                })));
            },
            (error) => {
                console.error("Error al consultar solicitudes:", error);
            }
        );

        return () => cancelarEscucha();
    }, [usuario.uid]);

    // Cargar los datos completos del perfil
    useEffect(() => {
        const cargarPerfil = async () => {
            try {
                const referencia = doc(db, "usuarios", usuario.uid);
                const resultado = await getDoc(referencia);

                if (resultado.exists()) {
                    const datos = resultado.data();

                    setDatosPerfil({
                        nombre: datos.nombre || usuario.nombre || "",
                        tipoDocumento: datos.tipoDocumento || "",
                        numeroDocumento: datos.numeroDocumento || "",
                        correo: datos.correo || usuario.correo || "",
                        codigoEstudiante: datos.codigoEstudiante || "",
                        programaAcademico: datos.programaAcademico || "",
                        semestre: datos.semestre || "",
                        periodoAcademico: datos.periodoAcademico || "",
                        jornada: datos.jornada || "",
                        modalidad: datos.modalidad || ""
                    });
                }
            } catch (error) {
                console.error("Error al cargar el perfil:", error);
            }
        };

        cargarPerfil();
    }, [usuario.uid]);

    const guardarPerfil = async () => {
        try {
            setGuardandoPerfil(true);

            const referencia = doc(db, "usuarios", usuario.uid);

            await updateDoc(referencia, {
                nombre: datosPerfil.nombre.trim(),
                tipoDocumento: datosPerfil.tipoDocumento,
                numeroDocumento: datosPerfil.numeroDocumento.trim(),
                codigoEstudiante: datosPerfil.codigoEstudiante.trim(),
                programaAcademico: datosPerfil.programaAcademico.trim(),
                semestre: datosPerfil.semestre,
                periodoAcademico: datosPerfil.periodoAcademico.trim(),
                jornada: datosPerfil.jornada,
                modalidad: datosPerfil.modalidad
            });

            setEditandoPerfil(false);
            alert("¡Perfil actualizado correctamente!");

        } catch (error) {
            console.error("Error al actualizar el perfil:", error);
            alert("No se pudieron guardar los cambios: " + error.message);
        } finally {
            setGuardandoPerfil(false);
        }
    };

    // Calcular indicadores
    const total = solicitudes.length;

    const pendientes = solicitudes.filter(
        (s) => s.estado === "Pendiente de aprobación"
    ).length;

    const enProceso = solicitudes.filter(
        (s) => s.estado === "En proceso"
    ).length;

    const resueltas = solicitudes.filter(
        (s) => s.estado === "Resuelta"
    ).length;

    // Revisar solicitud antes de enviarla
    const ejecutarRevision = () => {
        if (!descripcion.trim()) {
            alert("Primero escribe la descripción de tu solicitud.");
            return;
        }

        const resultado = revisarSolicitud(
            descripcion,
            tipoSolicitud
        );

        setResultadoRevision(resultado);

        let sugerencia = "";

        switch (tipoSolicitud) {
            case "Consulta académica":
                sugerencia = `Solicito orientación sobre una consulta académica.

Descripción de mi situación:
${descripcion.trim()}

Agradezco que puedan revisar mi consulta y brindarme la información correspondiente.`;
                break;

            case "Problema de matrícula":
                sugerencia = `Solicito apoyo para resolver un inconveniente relacionado con mi matrícula.

Descripción de mi situación:
${descripcion.trim()}

Agradezco verificar mi situación y orientarme sobre los pasos necesarios para solucionarla.`;
                break;

            case "Solicitud de certificado":
                sugerencia = `Solicito la expedición de un certificado académico.

Descripción de mi solicitud:
${descripcion.trim()}

Agradezco indicarme los requisitos y el procedimiento necesario para obtener este documento.`;
                break;

            case "Problema con una asignatura":
                sugerencia = `Solicito apoyo con una situación relacionada con una asignatura.

Descripción del inconveniente:
${descripcion.trim()}

Agradezco revisar mi caso y brindarme orientación para encontrar una solución.`;
                break;

            default:
                sugerencia = `Solicito apoyo con la siguiente situación:

Descripción:
${descripcion.trim()}

Agradezco su atención y orientación para resolver esta solicitud.`;
        }

        setDescripcionMejorada(sugerencia);
    };
    // Registrar una solicitud
    const crearSolicitud = async (e) => {
        e.preventDefault();

        if (!descripcion.trim()) {
            alert("Por favor, describe tu solicitud.");
            return;
        }

        try {
            setGuardando(true);
            console.log("Usuario actual:", usuario);
            console.log("UID:", usuario?.uid);
            console.log("Usuario autenticado:", auth.currentUser?.uid);

            await addDoc(collection(db, "solicitudes"), {
                tipo: tipoSolicitud,

                categoria:
                    tipoSolicitud === "Consulta académica" ? "Consultas" :
                        tipoSolicitud === "Problema de matrícula" ? "Matrícula" :
                            tipoSolicitud === "Solicitud de certificado" ? "Documentación" :
                                tipoSolicitud === "Problema con una asignatura" ? "Asuntos académicos" :
                                    "Otros",

                descripcion: descripcion.trim(),
                estado: "Pendiente de aprobación",
                tecnico:
                    tipoSolicitud === "Solicitud de certificado"
                        ? "Secretaría Académica"
                        : tipoSolicitud === "Problema de matrícula"
                            ? "Registro y Control Académico"
                            : tipoSolicitud === "Problema con una asignatura"
                                ? "Coordinación Académica"
                                : "Atención al Estudiante",
                usuarioId: usuarioAutenticado.uid,
                fechaCreacion: serverTimestamp()
            });

            alert("¡Solicitud registrada correctamente!");

            setDescripcion("");
            setTipoSolicitud("Consulta académica");
            setMostrarFormulario(false);

        } catch (error) {
            console.error("Error al registrar solicitud:", error);
            alert("No se pudo registrar la solicitud: " + error.message);

        } finally {
            setGuardando(false);
        }
    };

    return (
        <main className="panel-estudiante">

            <aside className="menu-lateral">
                <div className="logo-academic">
                    <span>✦</span>
                    Academic<span>AI</span>
                </div>

                <p className="menu-titulo">MENÚ PRINCIPAL</p>

                <nav>
                    <button
                        className="menu-opcion"
                        onClick={() => {
                            setMostrarFormulario(false);
                            setMostrarMisSolicitudes(false);
                        }}
                    >
                        <span>⌂</span> Inicio
                    </button>

                    <button
                        className="menu-opcion"
                        onClick={() => {
                            setMostrarFormulario(false);
                            setMostrarMisSolicitudes(true);
                        }}
                    >
                        <span>◷</span> Mis solicitudes
                    </button>
                </nav>

                <div className="menu-inferior">
                    <p className="menu-titulo">CUENTA</p>

                    <button
                        className="menu-opcion"
                        onClick={() => {
                            setMostrarFormulario(false);
                            setMostrarMisSolicitudes(false);
                            setMostrarMiPerfil(true);
                        }}
                    >
                        <span>♙</span> Mi perfil
                    </button>
                    <button
                        className="menu-opcion"
                        onClick={async () => {
                            try {
                                onCerrarSesion();
                                await signOut(auth);
                            } catch (error) {
                                console.error("Error al cerrar sesión:", error);
                                alert("No se pudo cerrar la sesión.");
                            }
                        }}
                    >
                        <span>↪</span> Cerrar sesión
                    </button>
                </div>
            </aside>

            <div className="contenido-principal">

                <header className="panel-header">
                    <div>
                        <h2>Panel del estudiante</h2>
                        <p>Tu espacio académico inteligente</p>
                    </div>

                    <div className="usuario-info">
                        <span>Bienvenido/a</span>
                        <strong>{usuario.nombre}</strong>
                    </div>
                    <button
                        type="button"
                        className="boton-asistente"
                        onClick={() => setMostrarAsistente(!mostrarAsistente)}
                    >
                        ✦ Asistente académico
                    </button>
                </header>


                {mostrarAsistente && (
                    <section className="asistente-estudiante">
                        <div className="asistente-encabezado">
                            <div className="asistente-identidad">
                                <div className="asistente-avatar">✦</div>
                                <div>
                                    <h3>AcademicAI</h3>
                                    <p>
                                        <span className="estado-online"></span>
                                        Asistente académico disponible
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                className="asistente-cerrar"
                                onClick={() => setMostrarAsistente(false)}
                            >
                                ×
                            </button>
                        </div>

                        <div className="asistente-bienvenida">

                            <div className="asistente-orbe">
                                <div className="orbe-anillo"></div>
                                <div className="orbe-centro">✦</div>
                            </div>

                            <span className="asistente-etiqueta">
                                AI ACADEMIC ASSISTANT
                            </span>

                            <h4>Hola, ¿qué necesitas resolver hoy?</h4>

                            <p>
                                Tu espacio inteligente para resolver dudas
                                y gestionar tus solicitudes académicas.
                            </p>

                            <div className="asistente-sugerencias">

                                <button
                                    type="button"
                                    onClick={() => setPreguntaAsistente("¿Cuáles son mis solicitudes?")}
                                >
                                    <span>📋</span>
                                    <div>
                                        <strong>Mis solicitudes</strong>
                                        <small>Consulta su estado</small>
                                    </div>
                                    <b>↗</b>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setPreguntaAsistente("¿Cómo puedo crear una solicitud?")}
                                >
                                    <span>✨</span>
                                    <div>
                                        <strong>Crear solicitud</strong>
                                        <small>Recibe orientación</small>
                                    </div>
                                    <b>↗</b>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setPreguntaAsistente("¿Qué significa cada estado de mi solicitud?")}
                                >
                                    <span>🔎</span>
                                    <div>
                                        <strong>Estados académicos</strong>
                                        <small>Conoce su significado</small>
                                    </div>
                                    <b>↗</b>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setPreguntaAsistente("¿Qué documentos necesito para mis trámites?")}
                                >
                                    <span>📚</span>
                                    <div>
                                        <strong>Documentación</strong>
                                        <small>Consulta los requisitos</small>
                                    </div>
                                    <b>↗</b>
                                </button>

                            </div>
                        </div>

                        <div className="asistente-mensajes">
                            {mensajesAsistente.map((mensaje, indice) => (
                                <div
                                    key={indice}
                                    className={`mensaje-asistente ${mensaje.tipo}`}
                                >
                                    {mensaje.tipo === "ia" && (
                                        <span className="mensaje-avatar">✦</span>
                                    )}
                                    <div className="mensaje-contenido">
                                        {mensaje.texto}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <form
                            className="asistente-formulario"
                            onSubmit={(e) => {
                                e.preventDefault();
                                enviarPreguntaAsistente();
                            }}
                        >
                            <input
                                type="text"
                                value={preguntaAsistente}
                                onChange={(e) => setPreguntaAsistente(e.target.value)}
                                placeholder="Escribe tu pregunta aquí..."
                            />

                            <button
                                type="submit"
                                disabled={!preguntaAsistente.trim()}
                                aria-label="Enviar pregunta"
                            >
                                ➤
                            </button>
                        </form>

                        <p className="asistente-pie">
                            AcademicAI · Orientación académica
                        </p>
                    </section>
                )}


                <section className="panel-contenido">

                    {mostrarMiPerfil ? (

                        <section className="perfil-estudiante">

                            <div className="perfil-encabezado">
                                <div className="perfil-avatar">
                                    {usuario.nombre?.charAt(0).toUpperCase()}
                                </div>

                                <div>
                                    <span>INFORMACIÓN PERSONAL</span>
                                    <h2>{usuario.nombre || "Estudiante"}</h2>
                                    <p>{usuario.correo || "Correo no disponible"}</p>
                                </div>
                            </div>

                            <div className="perfil-datos">

                                <div className="perfil-titulo-fila">
                                    <h3>Datos personales</h3>

                                    <button
                                        type="button"
                                        onClick={() => setEditandoPerfil(!editandoPerfil)}
                                    >
                                        {editandoPerfil ? "Cancelar edición" : "✎ Editar perfil"}
                                    </button>
                                </div>

                                {[
                                    { campo: "nombre", etiqueta: "Nombre completo" },
                                    { campo: "tipoDocumento", etiqueta: "Tipo de documento" },
                                    { campo: "numeroDocumento", etiqueta: "Número de documento" },
                                    { campo: "correo", etiqueta: "Correo electrónico" },
                                ].map((dato) => (
                                    <div key={dato.campo}>
                                        <span>{dato.etiqueta}</span>

                                        {editandoPerfil ? (
                                            <input
                                                value={datosPerfil[dato.campo]}
                                                onChange={(e) =>
                                                    setDatosPerfil({
                                                        ...datosPerfil,
                                                        [dato.campo]: e.target.value
                                                    })
                                                }
                                                placeholder={`Ingresa ${dato.etiqueta.toLowerCase()}`}
                                                disabled={dato.campo === "correo"}
                                            />
                                        ) : (
                                            <strong>
                                                {datosPerfil[dato.campo] || "No registrado"}
                                            </strong>
                                        )}
                                    </div>
                                ))}

                                <h3>Información académica</h3>

                                {[
                                    { campo: "codigoEstudiante", etiqueta: "Código estudiantil" },
                                    { campo: "programaAcademico", etiqueta: "Programa académico" },
                                    { campo: "semestre", etiqueta: "Semestre" },
                                    { campo: "periodoAcademico", etiqueta: "Período académico" },
                                    { campo: "jornada", etiqueta: "Jornada" },
                                    { campo: "modalidad", etiqueta: "Modalidad" },
                                ].map((dato) => (
                                    <div key={dato.campo}>
                                        <span>{dato.etiqueta}</span>

                                        {editandoPerfil ? (
                                            <input
                                                value={datosPerfil[dato.campo]}
                                                onChange={(e) =>
                                                    setDatosPerfil({
                                                        ...datosPerfil,
                                                        [dato.campo]: e.target.value
                                                    })
                                                }
                                                placeholder={`Ingresa ${dato.etiqueta.toLowerCase()}`}
                                            />
                                        ) : (
                                            <strong>
                                                {datosPerfil[dato.campo] || "No registrado"}
                                            </strong>
                                        )}
                                    </div>
                                ))}

                                {editandoPerfil && (
                                    <button
                                        type="button"
                                        onClick={guardarPerfil}
                                        disabled={guardandoPerfil}
                                    >
                                        {guardandoPerfil ? "Guardando..." : "Guardar cambios"}
                                    </button>
                                )}

                            </div>
                        </section>

                    ) : mostrarMisSolicitudes ? (
                        <section className="lista-solicitudes">

                            <div className="formulario-encabezado">
                                <div>
                                    <span>SEGUIMIENTO ACADÉMICO</span>
                                    <h2>Mis solicitudes</h2>
                                    <p>Consulta el estado de tus solicitudes académicas.</p>
                                </div>
                            </div>

                            {solicitudes.length === 0 ? (
                                <p className="sin-solicitudes">
                                    Todavía no has registrado solicitudes.
                                </p>
                            ) : (
                                <div className="solicitudes-grid">

                                    {solicitudes.map((solicitud) => (
                                        <article className="solicitud-card-grafica" key={solicitud.id}>

                                            <div className="solicitud-top">

                                                <div className="solicitud-icono">
                                                    <span>▦</span>
                                                </div>

                                                <div className="solicitud-titulo">
                                                    <h3>{solicitud.tipo}</h3>
                                                    <span>Solicitud académica</span>
                                                </div>

                                                <span className={`estado-solicitud ${solicitud.estado === "Pendiente de aprobación"
                                                    ? "pendiente"
                                                    : solicitud.estado === "En proceso"
                                                        ? "en-proceso"
                                                        : solicitud.estado === "Resuelta"
                                                            ? "resuelta"
                                                            : "rechazada"
                                                    }`}>
                                                    {solicitud.estado === "Pendiente de aprobación"
                                                        ? "Pendiente"
                                                        : solicitud.estado}
                                                </span>

                                            </div>

                                            <div className="solicitud-descripcion">
                                                <p>{solicitud.descripcion}</p>
                                            </div>

                                            <div className="solicitud-info">

                                                <div>
                                                    <span>👤</span>
                                                    <strong>{solicitud.tecnico || "Sin asignar"}</strong>
                                                </div>

                                                <div>
                                                    <span>📅</span>
                                                    <strong>
                                                        {solicitud.fechaCreacion?.toDate
                                                            ? solicitud.fechaCreacion.toDate().toLocaleDateString("es-CO")
                                                            : "No disponible"}
                                                    </strong>
                                                </div>

                                            </div>

                                            {solicitud.respuestaAdministrador && (
                                                <details className="respuesta-desplegable">

                                                    <summary>
                                                        <span>👁️</span>
                                                        <span>→</span>
                                                    </summary>

                                                    <p>{solicitud.respuestaAdministrador}</p>

                                                    {solicitud.enlaceEntregable && (
                                                        <a
                                                            href={solicitud.enlaceEntregable}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                        >
                                                            📎 Ver entregable
                                                        </a>
                                                    )}

                                                </details>
                                            )}

                                        </article>
                                    ))}

                                </div>
                            )}

                        </section>
                    ) : mostrarFormulario ? (

                        <section className="formulario-solicitud">
                            <div className="formulario-encabezado">
                                <div>
                                    <span>NUEVA SOLICITUD</span>
                                    <h2>¿En qué podemos ayudarte?</h2>
                                    <p>
                                        Cuéntanos qué necesitas y nuestro sistema te orientará.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    className="cerrar-formulario"
                                    onClick={() => setMostrarFormulario(false)}
                                >
                                    ×
                                </button>
                            </div>

                            <form onSubmit={crearSolicitud}>
                                <label>Tipo de solicitud</label>

                                <select
                                    value={tipoSolicitud}
                                    onChange={(e) => setTipoSolicitud(e.target.value)}
                                >
                                    <option value="Consulta académica">Consulta académica</option>
                                    <option value="Problema de matrícula">Problema de matrícula</option>
                                    <option value="Solicitud de certificado">Solicitud de certificado</option>
                                    <option value="Problema con una asignatura">Problema con una asignatura</option>
                                    <option value="Otro">Otro</option>
                                </select>

                                <label>Descripción de la solicitud</label>

                                <textarea
                                    value={descripcion}
                                    onChange={(e) => setDescripcion(e.target.value)}
                                    placeholder="Describe detalladamente tu necesidad académica..."
                                    rows="5"
                                    required
                                />

                                <button
                                    type="button"
                                    className="boton-revisar"
                                    onClick={ejecutarRevision}
                                >
                                    ✦ Analizar mi solicitud
                                </button>

                                {resultadoRevision && (
                                    <div className="resultado-revision">

                                        <h3>✦ Resultado del análisis</h3>

                                        <p>
                                            <strong>Categoría detectada:</strong>{" "}
                                            {resultadoRevision.categoria}
                                        </p>

                                        <p>
                                            <strong>Palabras identificadas:</strong>{" "}
                                            {resultadoRevision.palabras}
                                        </p>

                                        {resultadoRevision.adecuada ? (
                                            <p className="revision-correcta">
                                                ✓ Tu solicitud tiene una descripción clara.
                                            </p>
                                        ) : (
                                            <>
                                                <p>
                                                    <strong>Recomendaciones para mejorar:</strong>
                                                </p>

                                                <ul>
                                                    {resultadoRevision.recomendaciones.map(
                                                        (recomendacion, indice) => (
                                                            <li key={indice}>{recomendacion}</li>
                                                        )
                                                    )}
                                                </ul>

                                                <h4>Descripción sugerida</h4>

                                                <textarea
                                                    value={descripcionMejorada}
                                                    onChange={(e) =>
                                                        setDescripcionMejorada(e.target.value)
                                                    }
                                                    rows="4"
                                                />

                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setDescripcion(descripcionMejorada);
                                                        setResultadoRevision(null);
                                                    }}
                                                >
                                                    Aplicar sugerencia
                                                </button>
                                            </>
                                        )}

                                    </div>
                                )}

                                <div className="formulario-pie">
                                    <button
                                        type="button"
                                        className="boton-cancelar"
                                        onClick={() => setMostrarFormulario(false)}
                                    >
                                        Cancelar
                                    </button>

                                    <button
                                        type="submit"
                                        className="boton-enviar"
                                        disabled={guardando}
                                    >
                                        {guardando ? "Guardando..." : "Registrar solicitud →"}
                                    </button>
                                </div>
                            </form>
                        </section>

                    ) : (

                        <>
                            <div className="bienvenida">
                                <span>✦ ESPACIO ACADÉMICO</span>
                                <h1>¡Hola, {usuario.nombre}!</h1>
                                <p>
                                    Gestiona tus solicitudes académicas de manera
                                    inteligente y sencilla.
                                </p>
                            </div>

                            <div className="indicadores-estudiante">
                                <article className="indicador-card">
                                    <span className="indicador-icono azul">▤</span>
                                    <div>
                                        <p>Total de solicitudes</p>
                                        <h2>{total}</h2>
                                    </div>
                                </article>

                                <article className="indicador-card">
                                    <span className="indicador-icono naranja">◷</span>
                                    <div>
                                        <p>Pendientes</p>
                                        <h2>{pendientes}</h2>
                                    </div>
                                </article>

                                <article className="indicador-card">
                                    <span className="indicador-icono morado">↻</span>
                                    <div>
                                        <p>En proceso</p>
                                        <h2>{enProceso}</h2>
                                    </div>
                                </article>

                                <article className="indicador-card">
                                    <span className="indicador-icono verde">✓</span>
                                    <div>
                                        <p>Resueltas</p>
                                        <h2>{resueltas}</h2>
                                    </div>
                                </article>
                            </div>

                            <div className="opciones-estudiante">
                                <article className="opcion-card">
                                    <span className="opcion-icono">✚</span>
                                    <h3>Nueva solicitud</h3>
                                    <p>Registra una nueva solicitud académica.</p>
                                    <button
                                        type="button"
                                        onClick={() => setMostrarFormulario(true)}
                                    >
                                        Crear solicitud →
                                    </button>
                                </article>

                                <article className="opcion-card">
                                    <span className="opcion-icono">◷</span>
                                    <h3>Mis solicitudes</h3>
                                    <p>Consulta el estado de tus solicitudes.</p>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setMostrarFormulario(false);
                                            setMostrarMisSolicitudes(true);
                                        }}
                                    >
                                        Ver solicitudes →
                                    </button>
                                </article>
                            </div>
                        </>
                    )}
                </section>
            </div>
        </main>
    );
}

export default PanelEstudiante;
