import React, { useState, useEffect } from "react";
import "./App.css";
import {
    collection,
    onSnapshot,
    doc,
    updateDoc,
    getDoc,
    addDoc,
    serverTimestamp
} from "firebase/firestore";
import { db, auth } from "./firebase";
import { jsPDF } from "jspdf";
import { revisarSolicitud } from "./asistenteAcademico";

function PanelAdministrador({ onCerrarSesion }) {
    const [solicitudes, setSolicitudes] = useState([]);
    const [estudiantes, setEstudiantes] = useState([]);
    const [calificaciones, setCalificaciones] = useState([]);
    const [estudianteCalificacion, setEstudianteCalificacion] = useState("");
    const [asignatura, setAsignatura] = useState("");
    const [nota, setNota] = useState("");
    const [periodoCalificacion, setPeriodoCalificacion] = useState("");
    const [observaciones, setObservaciones] = useState("");
    const [guardandoCalificacion, setGuardandoCalificacion] = useState(false);
    const [datosAdministrador, setDatosAdministrador] = useState(null);
    useEffect(() => {
        const cargarAdministrador = async () => {
            const usuarioActual = auth.currentUser;

            if (!usuarioActual) return;

            try {
                const referencia = doc(db, "usuarios", usuarioActual.uid);
                const documento = await getDoc(referencia);

                if (documento.exists()) {
                    setDatosAdministrador({
                        ...documento.data(),
                        correo: usuarioActual.email
                    });
                } else {
                    setDatosAdministrador({
                        correo: usuarioActual.email
                    });
                }
            } catch (error) {
                console.error("Error al cargar administrador:", error);
            }
        };

        cargarAdministrador();
    }, []);
    const [error, setError] = useState("");
    const [solicitudSeleccionada, setSolicitudSeleccionada] = useState(null);
    const [respuesta, setRespuesta] = useState("");
    const [enlaceEntregable, setEnlaceEntregable] = useState("");
    const [tipoEntregable, setTipoEntregable] = useState("Constancia de estudio");
    const [analisisIA, setAnalisisIA] = useState(null);
    const [analizandoIA, setAnalizandoIA] = useState(false);
    const [guardandoRespuesta, setGuardandoRespuesta] = useState(false);
    const [datosEstudiante, setDatosEstudiante] = useState(null);
    const [busqueda, setBusqueda] = useState("");
    const [estadoFiltro, setEstadoFiltro] = useState("");
    const [tipoFiltro, setTipoFiltro] = useState("");
    const [seccionActiva, setSeccionActiva] = useState("inicio");
    const responsables = [
        "Secretaría Académica",
        "Registro y Control Académico",
        "Coordinación Académica",
        "Bienestar Universitario",
        "Atención al Estudiante"
    ];

    useEffect(() => {

        const cancelarEscucha = onSnapshot(
            collection(db, "solicitudes"),

            (snapshot) => {
                const datos = snapshot.docs.map((documento) => ({
                    id: documento.id,
                    ...documento.data()
                }));

                setSolicitudes(datos);
                setError("");
            },

            (error) => {
                console.error("Error al consultar solicitudes:", error);
                setError("No se pudieron cargar las solicitudes.");
            }
        );

        return () => cancelarEscucha();

    }, []);

    useEffect(() => {
        const consultaEstudiantes = onSnapshot(
            collection(db, "usuarios"),
            (snapshot) => {
                const listaEstudiantes = snapshot.docs
                    .map((documento) => ({
                        id: documento.id,
                        ...documento.data()
                    }))
                    .filter((estudiante) => estudiante.rol === "estudiante");

                setEstudiantes(listaEstudiantes);
            },
            (error) => {
                console.error("Error al consultar estudiantes:", error);
            }
        );

        return () => consultaEstudiantes();
    }, []);

    useEffect(() => {
        const cancelarEscucha = onSnapshot(
            collection(db, "calificaciones"),
            (snapshot) => {
                const lista = snapshot.docs.map((documento) => ({
                    id: documento.id,
                    ...documento.data()
                }));

                setCalificaciones(lista);
            },
            (error) => {
                console.error("Error al consultar calificaciones:", error);
            }
        );

        return () => cancelarEscucha();
    }, []);
    const totalSolicitudes = solicitudes.length;

    const pendientes = solicitudes.filter(
        (solicitud) => solicitud.estado === "Pendiente de aprobación"
    ).length;

    const enProceso = solicitudes.filter(
        (solicitud) => solicitud.estado === "En proceso"
    ).length;

    const resueltas = solicitudes.filter(
        (solicitud) => solicitud.estado === "Resuelta"
    ).length;

    const solicitudesFiltradas = solicitudes.filter((solicitud) => {
        const texto = busqueda.toLowerCase();

        const coincideBusqueda =
            (solicitud.tipo || "").toLowerCase().includes(texto) ||
            (solicitud.descripcion || "").toLowerCase().includes(texto) ||
            (solicitud.usuarioId || "").toLowerCase().includes(texto);

        const coincideEstado =
            estadoFiltro === "" || solicitud.estado === estadoFiltro;

        const coincideTipo =
            tipoFiltro === "" || solicitud.tipo === tipoFiltro;

        return coincideBusqueda && coincideEstado && coincideTipo;
    });

    const guardarCalificacion = async () => {
        if (
            !estudianteCalificacion ||
            !asignatura.trim() ||
            nota === "" ||
            !periodoCalificacion.trim()
        ) {
            alert("Completa los campos obligatorios.");
            return;
        }

        const notaNumerica = Number(nota);

        if (
            Number.isNaN(notaNumerica) ||
            notaNumerica < 0 ||
            notaNumerica > 5
        ) {
            alert("La nota debe estar entre 0.0 y 5.0.");
            return;
        }

        try {
            setGuardandoCalificacion(true);

            await addDoc(collection(db, "calificaciones"), {
                estudianteId: estudianteCalificacion,
                asignatura: asignatura.trim(),
                nota: notaNumerica,
                periodo: periodoCalificacion.trim(),
                observaciones: observaciones.trim(),
                fechaCreacion: serverTimestamp()
            });

            alert("Calificación registrada correctamente.");

            setAsignatura("");
            setNota("");
            setObservaciones("");

        } catch (error) {
            console.error("Error al guardar la calificación:", error);
            alert("No se pudo guardar la calificación. Revisa los permisos de Firebase.");
        } finally {
            setGuardandoCalificacion(false);
        }
    };

    const cambiarEstado = async (id, nuevoEstado) => {

        try {
            await updateDoc(doc(db, "solicitudes", id), {
                estado: nuevoEstado
            });

            console.log("Estado actualizado correctamente");

        } catch (error) {
            console.error("Error al actualizar el estado:", error);
            alert("No se pudo actualizar el estado.");
        }
    };
    const cambiarResponsable = async (id, nuevoResponsable) => {
        try {
            await updateDoc(doc(db, "solicitudes", id), {
                tecnico: nuevoResponsable
            });

            console.log("Responsable actualizado correctamente");

        } catch (error) {
            console.error("Error al cambiar responsable:", error);
            alert("No se pudo cambiar el responsable.");
        }
    };
    const abrirSolicitud = async (solicitud) => {
        setSolicitudSeleccionada(solicitud);
        setRespuesta(solicitud.respuestaAdministrador || "");
        setEnlaceEntregable(solicitud.enlaceEntregable || "");
        setDatosEstudiante(null);

        try {
            const documentoEstudiante = await getDoc(
                doc(db, "usuarios", solicitud.usuarioId)
            );

            if (documentoEstudiante.exists()) {
                setDatosEstudiante(documentoEstudiante.data());
            } else {
                alert("No se encontraron los datos del estudiante.");
            }

        } catch (error) {
            console.error("Error al consultar los datos del estudiante:", error);
            alert("No se pudieron consultar los datos del estudiante.");
        }
    };



    const generarCertificado = () => {
        if (
            tipoEntregable !== "Constancia de estudio" &&
            tipoEntregable !== "Certificado de matrícula" &&
            tipoEntregable !== "Certificado de notas" &&
            tipoEntregable !== "Informe de homologación"
        ) {
            alert("Este tipo de documento todavía está en desarrollo.");
            return;
        }
        if (!datosEstudiante) {
            alert("Primero debes consultar los datos del estudiante.");
            return;
        }

        const ciudad = window.prompt(
            "Ciudad de expedición:",
            "Medellín"
        );

        if (!ciudad || !ciudad.trim()) {
            return;
        }

        const tituloDocumento = tipoEntregable.toUpperCase();
        const calificacionesEstudiante = calificaciones.filter(
            (calificacion) =>
                calificacion.estudianteId === solicitudSeleccionada.usuarioId
        );

        if (tipoEntregable === "Certificado de notas") {
            if (calificacionesEstudiante.length === 0) {
                alert("Este estudiante todavía no tiene calificaciones registradas.");
                return;
            }
        }
        const pdf = new jsPDF();
        pdf.setProperties({
            title: tituloDocumento,
            subject: `Documento generado por AcademicAI para ${datosEstudiante.nombre}`
        });
        const fecha = new Date();

        const dia = fecha.getDate();
        const mes = fecha.toLocaleDateString("es-CO", { month: "long" });
        const anio = fecha.getFullYear();

        const azul = [20, 48, 91];
        const dorado = [180, 145, 75];

        // Fondo y bordes
        pdf.setFillColor(255, 255, 255);
        pdf.rect(0, 0, 210, 297, "F");

        pdf.setDrawColor(...azul);
        pdf.setLineWidth(1.2);
        pdf.rect(10, 10, 190, 277);

        pdf.setDrawColor(...dorado);
        pdf.setLineWidth(0.5);
        pdf.rect(13, 13, 184, 271);

        // Encabezado institucional
        pdf.setTextColor(...azul);
        pdf.setFont("times", "bold");
        pdf.setFontSize(15);

        pdf.text(
            "UNIVERSIDAD ADVENTISTA DE COLOMBIA",
            105,
            32,
            { align: "center" }
        );

        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(9);

        pdf.text(
            "Constancia generada mediante AcademicAI",
            105,
            40,
            { align: "center" }
        );

        pdf.setTextColor(120, 120, 120);
        pdf.text(
            "Resolución o registro oficial: pendiente de validación institucional",
            105,
            48,
            { align: "center" }
        );

        pdf.setDrawColor(...dorado);
        pdf.line(30, 56, 180, 56);

        // Cargo y certificación
        pdf.setTextColor(40, 40, 40);
        pdf.setFont("times", "bold");
        pdf.setFontSize(11);

        pdf.text(
            "EL SUSCRITO AUTORIDAD ACADÉMICA",
            105,
            72,
            { align: "center" }
        );

        pdf.text(
            "DE LA UNIVERSIDAD ADVENTISTA DE COLOMBIA",
            105,
            79,
            { align: "center" }
        );

        pdf.setTextColor(...azul);
        pdf.setFontSize(19);

        pdf.text(tituloDocumento, 105, 98, {
            align: "center"
        });

        // Texto principal
        pdf.setFont("times", "normal");
        pdf.setFontSize(11);
        pdf.setTextColor(40, 40, 40);

        const textoInicial =
            tipoEntregable === "Certificado de notas"
                ? "Se presenta el registro de calificaciones académicas del estudiante:"
                : tipoEntregable === "Informe de homologación"
                    ? "El presente documento reúne las asignaturas y calificaciones registradas del estudiante como información preliminar para la revisión de una posible homologación académica."
                    : tipoEntregable === "Certificado de matrícula"
                        ? "Se hace constar que el estudiante se encuentra registrado en el sistema académico:"
                        : "Se hace constar que el estudiante se encuentra registrado en el sistema académico:";

        const lineasIniciales = pdf.splitTextToSize(textoInicial, 150);

        pdf.text(lineasIniciales, 30, 116);

        let y = 175;
        let ultimaPaginaCalificaciones = 1;
        // Tabla de calificaciones
        if (tipoEntregable === "Certificado de notas") {
            let posicionTabla = y;

            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(11);
            pdf.text(
                tipoEntregable === "Informe de homologación"
                    ? "ASIGNATURAS PARA REVISIÓN DE HOMOLOGACIÓN"
                    : "REGISTRO DE CALIFICACIONES",
                30,
                posicionTabla
            );

            posicionTabla += 12;

            pdf.setFontSize(9);
            pdf.text("ASIGNATURA", 30, posicionTabla);
            pdf.text("NOTA", 115, posicionTabla);
            pdf.text("PERÍODO", 140, posicionTabla);

            posicionTabla += 7;
            pdf.setFont("helvetica", "normal");

            calificacionesEstudiante.forEach((calificacion) => {
                if (
                    posicionTabla + Math.max(
                        pdf.splitTextToSize(calificacion.asignatura, 75).length * 5,
                        9
                    ) > 255
                ) {
                    pdf.addPage();
                    ultimaPaginaCalificaciones++;

                    // Borde institucional de la nueva página
                    pdf.setDrawColor(30, 60, 100);
                    pdf.setLineWidth(0.8);
                    pdf.roundedRect(12, 12, 186, 273, 4, 4, "S");

                    posicionTabla = 25;
                    pdf.setFontSize(11);

                    pdf.setFont("helvetica", "bold");
                    pdf.text("REGISTRO DE CALIFICACIONES (CONTINUACIÓN)", 30, posicionTabla);

                    posicionTabla += 12;
                    pdf.setFontSize(9);
                    pdf.text("ASIGNATURA", 30, posicionTabla);
                    pdf.text("NOTA", 115, posicionTabla);
                    pdf.text("PERÍODO", 140, posicionTabla);

                    posicionTabla += 7;
                    pdf.setFont("helvetica", "normal");
                }
                const asignaturaTexto = pdf.splitTextToSize(
                    calificacion.asignatura,
                    75
                );

                pdf.text(asignaturaTexto, 30, posicionTabla);
                pdf.text(String(calificacion.nota), 115, posicionTabla);
                pdf.text(String(calificacion.periodo || "No registrado"), 140, posicionTabla);

                posicionTabla += Math.max(asignaturaTexto.length * 5, 9);
            });

            y = posicionTabla + 10;
        }

        // Información académica
        if (
            tipoEntregable === "Certificado de notas" ||
            tipoEntregable === "Informe de homologación"
        ) {
            y += 20;
        } else {
            y = 145;
        }

        const datos = tipoEntregable === "Certificado de notas" ? [] : [
            ["Programa académico:", datosEstudiante.programaAcademico],
            ["Semestre:", datosEstudiante.semestre],
            ["Período académico:", datosEstudiante.periodoAcademico],
            ["Jornada:", datosEstudiante.jornada],
            ["Modalidad:", datosEstudiante.modalidad],
            ["Intensidad horaria semanal:", `${datosEstudiante.intensidadHoraria} horas`]
        ];

        datos.forEach(([etiqueta, valor]) => {
            pdf.setFont("helvetica", "bold");
            pdf.text(etiqueta, 30, y);

            pdf.setFont("helvetica", "normal");
            pdf.text(String(valor || "No registrado"), 90, y);

            y += 11;
        });

        // Tabla exclusiva del informe de homologación
        if (tipoEntregable === "Informe de homologación") {

            // Crear una página independiente para la tabla
            pdf.addPage();
            ultimaPaginaCalificaciones++;

            pdf.setDrawColor(30, 60, 100);
            pdf.setLineWidth(0.8);
            pdf.roundedRect(12, 12, 186, 273, 4, 4, "S");

            let posicionTabla = 35;

            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(11);
            pdf.text("ASIGNATURAS PARA REVISIÓN DE HOMOLOGACIÓN", 30, posicionTabla);

            posicionTabla += 15;

            pdf.setFontSize(9);
            pdf.text("ASIGNATURA", 30, posicionTabla);
            pdf.text("NOTA", 115, posicionTabla);
            pdf.text("PERÍODO", 140, posicionTabla);

            posicionTabla += 8;
            pdf.setFont("helvetica", "normal");

            calificacionesEstudiante.forEach((calificacion) => {

                const asignaturaTexto = pdf.splitTextToSize(
                    calificacion.asignatura,
                    75
                );

                const alturaFila = Math.max(asignaturaTexto.length * 5, 9);

                if (posicionTabla + alturaFila > 255) {
                    pdf.addPage();
                    ultimaPaginaCalificaciones++;

                    pdf.setDrawColor(30, 60, 100);
                    pdf.setLineWidth(0.8);
                    pdf.roundedRect(12, 12, 186, 273, 4, 4, "S");

                    posicionTabla = 35;

                    pdf.setFont("helvetica", "bold");
                    pdf.setFontSize(11);
                    pdf.text("INFORME DE HOMOLOGACIÓN (CONTINUACIÓN)", 30, posicionTabla);

                    posicionTabla += 15;

                    pdf.setFontSize(9);
                    pdf.text("ASIGNATURA", 30, posicionTabla);
                    pdf.text("NOTA", 115, posicionTabla);
                    pdf.text("PERÍODO", 140, posicionTabla);

                    posicionTabla += 8;
                    pdf.setFont("helvetica", "normal");
                }

                pdf.text(asignaturaTexto, 30, posicionTabla);
                pdf.text(String(calificacion.nota), 115, posicionTabla);
                pdf.text(String(calificacion.periodo || "No registrado"), 140, posicionTabla);

                posicionTabla += alturaFila;
            });

            y = posicionTabla + 15;
        }

        // Texto de expedición
        pdf.setFont("times", "normal");
        pdf.setFontSize(11);

        const textoFinal =
            `Se genera este documento de demostración en la ciudad de ` +
            `${ciudad.trim()}, a los ${dia} días del mes de ${mes} ` +
            `del año ${anio}.`;

        const lineasFinales = pdf.splitTextToSize(textoFinal, 150);

        let posicionTextoFinal =
            tipoEntregable === "Informe de homologación"
                ? y + 10
                : 225;

        if (tipoEntregable === "Certificado de notas") {
            posicionTextoFinal = y + 10;

            if (posicionTextoFinal > 150) {
                pdf.addPage();
                ultimaPaginaCalificaciones++;

                // Borde institucional de la nueva página
                pdf.setDrawColor(30, 60, 100);
                pdf.setLineWidth(0.8);
                pdf.roundedRect(12, 12, 186, 273, 4, 4, "S");

                posicionTextoFinal = 40;
            }
        }

        pdf.text(lineasFinales, 30, posicionTextoFinal);
        if (tipoEntregable === "Informe de homologación") {
            pdf.setFont("helvetica", "italic");
            pdf.setFontSize(9);

            pdf.text(
                "Nota: Este informe es preliminar. La homologación requiere evaluación y aprobación institucional.",
                30,
                posicionTextoFinal + 12,
                { maxWidth: 150 }
            );
        }

        // Aviso de demostración
        const posicionAviso =
            tipoEntregable === "Informe de homologación"
                ? posicionTextoFinal + 30
                : tipoEntregable === "Certificado de notas"
                    ? posicionTextoFinal + 22
                    : 247;

        const posicionFondoAviso =
            tipoEntregable === "Certificado de notas" ||
                tipoEntregable === "Informe de homologación"
                ? posicionAviso - 8
                : 239;

        pdf.setFillColor(255, 243, 220);
        pdf.roundedRect(25, posicionFondoAviso, 160, 13, 2, 2, "F");

        pdf.setTextColor(150, 80, 20);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(9);

        pdf.text(
            "BORRADOR - SIN VALIDEZ OFICIAL",
            105,
            posicionAviso,
            { align: "center" }
        );

        // Espacio para firma
        pdf.setDrawColor(100, 100, 100);
        const posicionFirma =
            tipoEntregable === "Informe de homologación"
                ? posicionAviso + 25
                : tipoEntregable === "Certificado de notas"
                    ? posicionAviso + 25
                    : 267;
        pdf.line(65, posicionFirma, 145, posicionFirma);

        pdf.setTextColor(50, 50, 50);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(9);

        pdf.text(
            "Autoridad académica autorizada",
            105,
            tipoEntregable === "Certificado de notas" ||
                tipoEntregable === "Informe de homologación"
                ? posicionFirma + 6
                : 273,
            { align: "center" }
        );

        pdf.setFont("helvetica", "normal");
        pdf.text(
            "Firma y sello institucional pendientes",
            105,
            tipoEntregable === "Certificado de notas" ||
                tipoEntregable === "Informe de homologación"
                ? posicionFirma + 12
                : 279,
            { align: "center" }
        );

        // Descargar
        const nombreArchivo = datosEstudiante.nombre
            .replace(/\s+/g, "_");

        const nombreDocumento = tipoEntregable
            .replace(/\s+/g, "_");

        pdf.save(`${nombreDocumento}_${nombreArchivo}.pdf`);
    };

    const analizarConIA = () => {
        if (!solicitudSeleccionada) return;

        try {
            setAnalizandoIA(true);

            const resultado = revisarSolicitud(
                solicitudSeleccionada.descripcion || "",
                solicitudSeleccionada.tipo || ""
            );

            const respuestaSugerida = resultado.adecuada
                ? `Hemos revisado tu solicitud de ${resultado.categoria}. La información proporcionada es clara y puedes continuar con el trámite correspondiente.`
                : `Hemos revisado tu solicitud. Para continuar con el trámite, necesitamos que amplíes la siguiente información: ${resultado.recomendaciones.join(" ")}`;

            setAnalisisIA({
                ...resultado,
                porcentaje: Math.max(
                    0,
                    100 - resultado.recomendaciones.length * 25
                ),
                respuestaSugerida
            });

        } catch (error) {
            console.error("Error al analizar la solicitud:", error);
            alert("No se pudo realizar el análisis.");
        } finally {
            setAnalizandoIA(false);
        }
    };

    const guardarRespuesta = async () => {
        if (!respuesta.trim()) {
            alert("Escribe una respuesta para el estudiante.");
            return;
        }

        try {
            setGuardandoRespuesta(true);

            await updateDoc(
                doc(db, "solicitudes", solicitudSeleccionada.id),
                {
                    respuestaAdministrador: respuesta.trim(),
                    enlaceEntregable: enlaceEntregable.trim(),
                    fechaRespuesta: new Date()
                }
            );

            alert("Respuesta enviada correctamente.");

            setSolicitudSeleccionada(null);
            setRespuesta("");
            setEnlaceEntregable("");

        } catch (error) {
            console.error("Error al guardar la respuesta:", error);
            alert("No se pudo enviar la respuesta.");
        } finally {
            setGuardandoRespuesta(false);
        }
    };

    return (
        <div className="panel-estudiante panel-administrador">

            <aside className="menu-lateral">
                <h2>AcademicAI</h2>
                <p>Panel administrativo</p>

                <nav>
                    <button
                        className={`menu-opcion ${seccionActiva === "inicio" ? "activo" : ""}`}
                        onClick={() => setSeccionActiva("inicio")}
                    >
                        🏠 Inicio
                    </button>

                    <button
                        className={`menu-opcion ${seccionActiva === "solicitudes" ? "activo" : ""}`}
                        onClick={() => setSeccionActiva("solicitudes")}
                    >
                        📋 Solicitudes
                    </button>

                    <button
                        className={`menu-opcion ${seccionActiva === "estudiantes" ? "activo" : ""}`}
                        onClick={() => setSeccionActiva("estudiantes")}
                    >
                        👥 Estudiantes
                    </button>
                    <button
                        className={`menu-opcion ${seccionActiva === "calificaciones" ? "activo" : ""}`}
                        onClick={() => setSeccionActiva("calificaciones")}
                    >
                        📚 Calificaciones
                    </button>
                    <button
                        className={`menu-opcion ${seccionActiva === "estadisticas" ? "activo" : ""}`}
                        onClick={() => setSeccionActiva("estadisticas")}
                    >
                        📊 Estadísticas
                    </button>
                    <button
                        className="menu-opcion"
                        onClick={() => {
                            console.log("Entrando a configuración");
                            setSeccionActiva("configuracion");
                        }}
                    >
                        ⚙️ Configuración
                    </button>
                </nav>
            </aside>

            <main className="contenido-principal">

                <header className="panel-header">
                    <div>
                        <h1>Panel de administrador</h1>
                        <p>Bienvenido al centro de gestión de AcademicAI</p>
                    </div>

                    <div className="admin-perfil">
                        <div className="admin-avatar">
                            {(datosAdministrador?.nombre || "A").charAt(0).toUpperCase()}
                        </div>

                        <div className="admin-info">
                            <strong>{datosAdministrador?.nombre || "Administrador"}</strong>
                            <span>{datosAdministrador?.correo || auth.currentUser?.email}</span>
                        </div>

                        <button
                            className="boton-actualizar"
                            onClick={onCerrarSesion}
                        >
                            Cerrar sesión
                        </button>
                    </div>
                </header>

                <section className="panel-contenido">
                    {seccionActiva === "inicio" && (
                        <>

                            <h2>Resumen general</h2>
                            <p>Desde aquí podrás supervisar y gestionar las solicitudes académicas.</p>

                            <div className="tarjetas-resumen">

                                <div className="tarjeta">
                                    <h3>Total de solicitudes</h3>
                                    <strong>{totalSolicitudes}</strong>
                                </div>

                                <div className="tarjeta">
                                    <h3>Pendientes</h3>
                                    <strong>{pendientes}</strong>
                                </div>

                                <div className="tarjeta">
                                    <h3>En proceso</h3>
                                    <strong>{enProceso}</strong>
                                </div>

                                <div className="tarjeta">
                                    <h3>Resueltas</h3>
                                    <strong>{resueltas}</strong>
                                </div>

                            </div>
                        </>
                    )}

                    {seccionActiva === "solicitudes" && (
                        <div className="gestion-solicitudes">

                            <div className="encabezado-solicitudes">
                                <div>
                                    <h2>Gestión de solicitudes</h2>
                                    <p>Administra y supervisa las solicitudes académicas.</p>
                                </div>

                                <button
                                    className="boton-actualizar"
                                    onClick={() => {
                                        setBusqueda("");
                                        setEstadoFiltro("");
                                        setTipoFiltro("");
                                    }}
                                >
                                    ↻ Mostrar todas
                                </button>
                            </div>

                            <div className="filtros-solicitudes">

                                <input
                                    type="text"
                                    placeholder="Buscar por tipo, descripción o usuario..."
                                    value={busqueda}
                                    onChange={(e) => setBusqueda(e.target.value)}
                                />

                                <select
                                    value={estadoFiltro}
                                    onChange={(e) => setEstadoFiltro(e.target.value)}
                                >
                                    <option value="">Todos los estados</option>
                                    <option value="Pendiente de aprobación">Pendientes</option>
                                    <option value="En proceso">En proceso</option>
                                    <option value="Resuelta">Resueltas</option>
                                    <option value="Rechazada">Rechazadas</option>
                                </select>

                                <select
                                    value={tipoFiltro}
                                    onChange={(e) => setTipoFiltro(e.target.value)}
                                >
                                    <option value="">Todos los tipos</option>

                                    {[...new Set(solicitudes.map((s) => s.tipo).filter(Boolean))].map((tipo) => (
                                        <option key={tipo} value={tipo}>
                                            {tipo}
                                        </option>
                                    ))}
                                </select>

                            </div>

                            <div className="tabla-solicitudes">
                                <table className="tabla-admin">
                                    <thead>
                                        <tr>
                                            <th>Usuario ID</th>
                                            <th>Tipo de solicitud</th>
                                            <th>Clasificación</th>
                                            <th>Fecha</th>
                                            <th>Estado</th>
                                            <th>Descripción</th>
                                            <th>Acciones</th>
                                        </tr>
                                    </thead>


                                    <tbody>
                                        {error ? (
                                            <tr>
                                                <td colSpan="7">{error}</td>
                                            </tr>
                                        ) : solicitudes.length === 0 ? (
                                            <tr>
                                                <td colSpan="7">No hay solicitudes registradas.</td>
                                            </tr>
                                        ) : solicitudesFiltradas.length === 0 ? (
                                            <tr>
                                                <td colSpan="7">No se encontraron solicitudes.</td>
                                            </tr>
                                        ) : (
                                            solicitudesFiltradas.map((solicitud) => (
                                                <tr key={solicitud.id}>
                                                    {/* USUARIO */}
                                                    <td>
                                                        <div className="usuario-tabla">
                                                            <div className="avatar-usuario">
                                                                {(solicitud.usuarioId || "ES")
                                                                    .slice(0, 2)
                                                                    .toUpperCase()}
                                                            </div>

                                                            <span title={solicitud.usuarioId}>
                                                                {(solicitud.usuarioId || "Sin ID").slice(0, 8)}...
                                                            </span>
                                                        </div>
                                                    </td>

                                                    {/* TIPO */}
                                                    <td>
                                                        <div className="tipo-tabla">
                                                            <span className="icono-tipo">
                                                                {solicitud.tipo === "Solicitud de certificado"
                                                                    ? "📄"
                                                                    : solicitud.tipo === "Consulta académica"
                                                                        ? "💬"
                                                                        : solicitud.tipo === "Problema de matrícula"
                                                                            ? "📚"
                                                                            : "📋"}
                                                            </span>
                                                            <span>{solicitud.tipo}</span>
                                                        </div>
                                                    </td>

                                                    {/* CLASIFICACIÓN */}
                                                    <td>
                                                        <span className="etiqueta-clasificacion">
                                                            {solicitud.categoria || "Sin clasificar"}
                                                        </span>
                                                    </td>

                                                    {/* FECHA */}
                                                    <td>
                                                        {solicitud.fechaCreacion?.toDate
                                                            ? solicitud.fechaCreacion.toDate().toLocaleDateString()
                                                            : "Sin fecha"}
                                                    </td>

                                                    {/* ESTADO */}
                                                    <td>
                                                        <span className={`estado-tabla ${solicitud.estado === "Resuelta"
                                                            ? "estado-resuelta"
                                                            : solicitud.estado === "En proceso"
                                                                ? "estado-proceso"
                                                                : solicitud.estado === "Rechazada"
                                                                    ? "estado-rechazada"
                                                                    : "estado-pendiente"
                                                            }`}>
                                                            {solicitud.estado}
                                                        </span>
                                                    </td>

                                                    {/* DESCRIPCIÓN */}
                                                    <td>
                                                        <span className="descripcion-tabla">
                                                            {solicitud.descripcion}
                                                        </span>
                                                    </td>

                                                    {/* ACCIONES */}
                                                    <td>
                                                        <div className="acciones-tabla">
                                                            <button
                                                                className="boton-responder"
                                                                onClick={() => abrirSolicitud(solicitud)}
                                                            >
                                                                💬 Responder
                                                            </button>

                                                            <details className="menu-acciones">
                                                                <summary title="Más opciones">⋮</summary>

                                                                <div className="contenido-menu-acciones">
                                                                    <label>Responsable</label>

                                                                    <select
                                                                        value={solicitud.tecnico || "Atención al Estudiante"}
                                                                        onChange={(e) =>
                                                                            cambiarResponsable(
                                                                                solicitud.id,
                                                                                e.target.value
                                                                            )
                                                                        }
                                                                    >
                                                                        {responsables.map((responsable) => (
                                                                            <option key={responsable} value={responsable}>
                                                                                {responsable}
                                                                            </option>
                                                                        ))}
                                                                    </select>

                                                                    <label>Estado</label>

                                                                    <select
                                                                        value={solicitud.estado}
                                                                        onChange={(e) =>
                                                                            cambiarEstado(
                                                                                solicitud.id,
                                                                                e.target.value
                                                                            )
                                                                        }
                                                                    >
                                                                        <option value="Pendiente de aprobación">Pendiente</option>
                                                                        <option value="En proceso">En proceso</option>
                                                                        <option value="Resuelta">Resuelta</option>
                                                                        <option value="Rechazada">Rechazada</option>
                                                                    </select>
                                                                </div>
                                                            </details>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>

                                </table>
                            </div>

                            {solicitudSeleccionada && (
                                <div className="respuesta-panel">

                                    <div className="respuesta-encabezado">
                                        <div>
                                            <span className="respuesta-etiqueta">CENTRO DE ATENCIÓN</span>
                                            <h2>Responder solicitud</h2>
                                            <p>Revisa la información y proporciona una solución al estudiante.</p>
                                        </div>

                                        <button
                                            className="respuesta-cerrar"
                                            onClick={() => setSolicitudSeleccionada(null)}
                                        >
                                            ✕
                                        </button>
                                    </div>

                                    <div className="respuesta-resumen">
                                        <div className="respuesta-resumen-icono">📋</div>
                                        <div className="respuesta-resumen-info">
                                            <span>TIPO DE SOLICITUD</span>
                                            <h3>{solicitudSeleccionada.tipo}</h3>
                                            <small>{solicitudSeleccionada.tecnico || "Sin responsable asignado"}</small>
                                        </div>

                                        <span className={`respuesta-estado ${solicitudSeleccionada.estado === "Resuelta"
                                            ? "resuelto"
                                            : solicitudSeleccionada.estado === "En proceso"
                                                ? "en-proceso"
                                                : "pendiente"
                                            }`}>
                                            {solicitudSeleccionada.estado}
                                        </span>
                                    </div>

                                    <div className="respuesta-dos-columnas">

                                        <div className="respuesta-seccion">
                                            <h3>👤 Información del estudiante</h3>

                                            {datosEstudiante ? (
                                                <div className="respuesta-datos-grid">
                                                    <div>
                                                        <span>Nombre completo</span>
                                                        <strong>{datosEstudiante.nombre || "No registrado"}</strong>
                                                    </div>

                                                    <div>
                                                        <span>Documento</span>
                                                        <strong>
                                                            {datosEstudiante.tipoDocumento || ""}{" "}
                                                            {datosEstudiante.numeroDocumento || "No registrado"}
                                                        </strong>
                                                    </div>

                                                    <div>
                                                        <span>Programa académico</span>
                                                        <strong>{datosEstudiante.programaAcademico || "No registrado"}</strong>
                                                    </div>

                                                    <div>
                                                        <span>Período académico</span>
                                                        <strong>{datosEstudiante.periodoAcademico || "No registrado"}</strong>
                                                    </div>

                                                    <div>
                                                        <span>Correo electrónico</span>
                                                        <strong>{datosEstudiante.correo || "No registrado"}</strong>
                                                    </div>

                                                    <div>
                                                        <span>Código estudiantil</span>
                                                        <strong>{datosEstudiante.codigoEstudiante || "No registrado"}</strong>
                                                    </div>
                                                </div>
                                            ) : (
                                                <p className="respuesta-cargando">
                                                    Consultando información del estudiante...
                                                </p>
                                            )}
                                        </div>

                                        <div className="respuesta-seccion solicitud-descripcion">
                                            <h3>📝 Descripción de la solicitud</h3>
                                            <p>{solicitudSeleccionada.descripcion}</p>

                                            <div className="respuesta-responsable">
                                                <span>Área responsable</span>
                                                <strong>{solicitudSeleccionada.tecnico || "Sin asignar"}</strong>
                                            </div>
                                        </div>

                                    </div>

                                    <div className="respuesta-seccion analisis-ia">

                                        <div className="respuesta-titulo-editor">
                                            <div>
                                                <h3>✦ Asistente de AcademicAI</h3>
                                                <p>Analiza la solicitud y recibe recomendaciones automáticas.</p>
                                            </div>
                                            <span>ASISTENTE</span>
                                        </div>

                                        <button
                                            type="button"
                                            className="boton-analizar-ia"
                                            onClick={analizarConIA}
                                            disabled={analizandoIA}
                                        >
                                            {analizandoIA ? "Analizando..." : "✦ Analizar con IA"}
                                        </button>
                                        {analisisIA && (
                                            <div className="resultado-analisis-ia">

                                                <div className="ia-resultado-encabezado">
                                                    <div className="ia-icono">✦</div>
                                                    <div>
                                                        <span>INFORME AUTOMÁTICO</span>
                                                        <h3>Análisis de la solicitud</h3>
                                                        <p>AcademicAI · Asistente académico</p>
                                                    </div>
                                                    <div className={`ia-estado ${analisisIA.adecuada ? "ia-correcta" : "ia-advertencia"}`}>
                                                        {analisisIA.adecuada ? "Información clara" : "Requiere atención"}
                                                    </div>
                                                </div>

                                                <div className="ia-grafico-calidad">

                                                    <div
                                                        className="ia-circulo"
                                                        style={{
                                                            "--progreso": `${analisisIA.porcentaje}%`,
                                                            "--color-progreso": analisisIA.porcentaje >= 75
                                                                ? "#46dca5"
                                                                : analisisIA.porcentaje >= 40
                                                                    ? "#65a5ff"
                                                                    : "#ffbd69"
                                                        }}
                                                    >
                                                        <div className="ia-circulo-centro">
                                                            <strong>{analisisIA.porcentaje}%</strong>
                                                            <span>CALIDAD</span>
                                                        </div>
                                                    </div>

                                                    <div className="ia-grafico-info">
                                                        <span>✦ EVALUACIÓN AUTOMÁTICA</span>
                                                        <h3>
                                                            {analisisIA.porcentaje >= 75
                                                                ? "Muy buena descripción"
                                                                : analisisIA.porcentaje >= 40
                                                                    ? "Descripción mejorable"
                                                                    : "Información insuficiente"}
                                                        </h3>
                                                        <p>
                                                            {analisisIA.recomendaciones.length === 0
                                                                ? "No se detectaron aspectos pendientes."
                                                                : `${analisisIA.recomendaciones.length} aspectos necesitan atención.`}
                                                        </p>
                                                    </div>

                                                </div>

                                                <div className="ia-datos-resumen">

                                                    <div className="ia-dato-tarjeta ia-tipo">
                                                        <div className="ia-dato-icono">📁</div>
                                                        <span>TIPO DE SOLICITUD</span>
                                                        <strong>{analisisIA.categoria}</strong>
                                                        <small>Categoría identificada</small>
                                                    </div>

                                                    <div className="ia-dato-tarjeta ia-palabras">
                                                        <div className="ia-dato-icono">📝</div>
                                                        <span>PALABRAS DETECTADAS</span>
                                                        <strong>{analisisIA.palabras}</strong>
                                                        <small>Extensión de la descripción</small>
                                                    </div>

                                                    <div className="ia-dato-tarjeta ia-recomendaciones">
                                                        <div className="ia-dato-icono">✦</div>
                                                        <span>RECOMENDACIONES</span>
                                                        <strong>{analisisIA.recomendaciones.length}</strong>
                                                        <small>Aspectos por revisar</small>
                                                    </div>

                                                </div>

                                                <div className="ia-recomendaciones">

                                                    <div className="ia-seccion-encabezado">
                                                        <div>
                                                            <span>DIAGNÓSTICO</span>
                                                            <h4>Evaluación de la solicitud</h4>
                                                        </div>
                                                        <div className="ia-seccion-icono">✧</div>
                                                    </div>

                                                    {analisisIA.adecuada ? (

                                                        <div className="ia-resultado-correcto">
                                                            <span>✓</span>
                                                            <div>
                                                                <strong>Solicitud clara</strong>
                                                                <small>No se detectaron aspectos pendientes.</small>
                                                            </div>
                                                        </div>

                                                    ) : (

                                                        <div className="ia-alertas-grid">

                                                            {analisisIA.recomendaciones.map((recomendacion, indice) => (
                                                                <div className="ia-alerta-visual" key={indice}>

                                                                    <div className="ia-alerta-numero">
                                                                        0{indice + 1}
                                                                    </div>

                                                                    <div>
                                                                        <strong>
                                                                            {indice === 0 ? "Descripción" : "Justificación"}
                                                                        </strong>
                                                                        <p>{recomendacion}</p>
                                                                    </div>

                                                                    <span className="ia-alerta-punto">!</span>

                                                                </div>
                                                            ))}

                                                        </div>
                                                    )}

                                                </div>

                                                <div className="ia-respuesta-sugerida">

                                                    <div className="ia-propuesta-header">
                                                        <div className="ia-propuesta-icono">✦</div>

                                                        <div>
                                                            <span>ACADEMICAI · ASISTENTE</span>
                                                            <h4>Respuesta inteligente</h4>
                                                        </div>

                                                        <span className="ia-propuesta-badge">SUGERIDA</span>
                                                    </div>

                                                    <div className="ia-propuesta-vista">
                                                        <p>{analisisIA.respuestaSugerida}</p>
                                                    </div>

                                                    <button
                                                        type="button"
                                                        onClick={() => setRespuesta(analisisIA.respuestaSugerida)}
                                                    >
                                                        ✧ Aplicar respuesta
                                                        <span>→</span>
                                                    </button>

                                                </div>

                                                <p className="ia-nota">
                                                    Este resultado es una orientación automática basada en criterios
                                                    predefinidos. El administrador debe revisar la solicitud.
                                                </p>

                                            </div>
                                        )}

                                    </div>

                                    <div className="respuesta-seccion respuesta-editor">
                                        <div className="respuesta-titulo-editor">
                                            <div>
                                                <h3>💬 Respuesta al estudiante</h3>
                                                <p>Escribe la solución, orientación o información correspondiente.</p>
                                            </div>
                                            <span>RESPUESTA</span>
                                        </div>

                                        <textarea
                                            value={respuesta}
                                            onChange={(e) => setRespuesta(e.target.value)}
                                            placeholder="Escribe aquí la respuesta para el estudiante..."
                                        />
                                    </div>

                                    <div className="respuesta-seccion respuesta-entregable">
                                        <label htmlFor="tipoEntregable">
                                            Tipo de documento a generar
                                        </label>

                                        <select
                                            id="tipoEntregable"
                                            className="select-entregable"
                                            value={tipoEntregable}
                                            onChange={(e) => setTipoEntregable(e.target.value)}
                                        >
                                            <option value="Constancia de estudio">Constancia de estudio</option>
                                            <option value="Certificado de notas">Certificado de notas</option>
                                            <option value="Certificado de matrícula">Certificado de matrícula</option>
                                            <option value="Respuesta académica">Respuesta académica</option>
                                            <option value="Informe de homologación">Informe de homologación</option>
                                        </select>
                                        <div className="respuesta-titulo-editor">
                                            <div>
                                                <h3>📎 Documento o entregable</h3>
                                                <p>Adjunta un enlace al documento que debe recibir el estudiante.</p>
                                            </div>
                                            <span>OPCIONAL</span>
                                        </div>

                                        <input
                                            type="url"
                                            value={enlaceEntregable}
                                            onChange={(e) => setEnlaceEntregable(e.target.value)}
                                            placeholder="https://drive.google.com/..."
                                        />

                                        <button
                                            type="button"
                                            className="boton-certificado"
                                            onClick={generarCertificado}
                                            disabled={!datosEstudiante}
                                        >
                                            📄 Generar {tipoEntregable.toLowerCase()}
                                        </button>
                                    </div>

                                    <div className="respuesta-acciones">
                                        <button
                                            className="boton-cancelar-respuesta"
                                            onClick={() => setSolicitudSeleccionada(null)}
                                        >
                                            Cancelar
                                        </button>

                                        <button
                                            className="boton-enviar-respuesta"
                                            onClick={guardarRespuesta}
                                            disabled={guardandoRespuesta}
                                        >
                                            {guardandoRespuesta ? "Guardando..." : "✉ Enviar respuesta"}
                                        </button>
                                    </div>

                                </div>
                            )}

                            <div className="tabla-solicitudes">
                                <h3>📊 Calificaciones registradas</h3>

                                <table className="tabla-admin">
                                    <thead>
                                        <tr>
                                            <th>Estudiante</th>
                                            <th>Asignatura</th>
                                            <th>Nota</th>
                                            <th>Período</th>
                                            <th>Observaciones</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {calificaciones.length === 0 ? (
                                            <tr>
                                                <td colSpan="5">
                                                    Todavía no hay calificaciones registradas.
                                                </td>
                                            </tr>
                                        ) : (
                                            calificaciones.map((calificacion) => {
                                                const estudiante = estudiantes.find(
                                                    (item) => item.id === calificacion.estudianteId
                                                );

                                                return (
                                                    <tr key={calificacion.id}>
                                                        <td>{estudiante?.nombre || "Estudiante no encontrado"}</td>
                                                        <td>{calificacion.asignatura}</td>
                                                        <td>{Number(calificacion.nota).toFixed(1)}</td>
                                                        <td>{calificacion.periodo}</td>
                                                        <td>{calificacion.observaciones || "Sin observaciones"}</td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {seccionActiva === "estudiantes" && (
                        <div className="gestion-solicitudes">

                            <div className="encabezado-solicitudes">
                                <div>
                                    <h2>Estudiantes registrados</h2>
                                    <p>Consulta la información académica de los estudiantes.</p>
                                </div>
                            </div>

                            <div className="tabla-solicitudes">
                                <table className="tabla-admin">
                                    <thead>
                                        <tr>
                                            <th>Nombre</th>
                                            <th>Documento</th>
                                            <th>Código</th>
                                            <th>Programa</th>
                                            <th>Semestre</th>
                                            <th>Correo</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {estudiantes.length === 0 ? (
                                            <tr>
                                                <td colSpan="6">
                                                    No hay estudiantes registrados.
                                                </td>
                                            </tr>
                                        ) : (
                                            estudiantes.map((estudiante) => (
                                                <tr key={estudiante.id}>
                                                    <td>{estudiante.nombre || "Sin nombre"}</td>
                                                    <td>
                                                        {estudiante.tipoDocumento}{" "}
                                                        {estudiante.numeroDocumento || "Sin documento"}
                                                    </td>
                                                    <td>{estudiante.codigoEstudiante || "Sin código"}</td>
                                                    <td>{estudiante.programaAcademico || "Sin programa"}</td>
                                                    <td>{estudiante.semestre || "Sin semestre"}</td>
                                                    <td>{estudiante.correo || "Sin correo"}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {seccionActiva === "calificaciones" && (
                        <div className="gestion-solicitudes">

                            <div className="encabezado-solicitudes">
                                <div>
                                    <h2>Gestión de calificaciones</h2>
                                    <p>Registra y administra las notas de los estudiantes.</p>
                                </div>
                            </div>

                            <div className="respuesta-seccion formulario-calificaciones">
                                <h3>📝 Registrar nueva calificación</h3>

                                <label>Seleccionar estudiante</label>
                                <select
                                    value={estudianteCalificacion}
                                    onChange={(e) => setEstudianteCalificacion(e.target.value)}
                                >
                                    <option value="">Selecciona un estudiante</option>

                                    {estudiantes.map((estudiante) => (
                                        <option key={estudiante.id} value={estudiante.id}>
                                            {estudiante.nombre} - {estudiante.codigoEstudiante}
                                        </option>
                                    ))}
                                </select>

                                <label>Asignatura</label>
                                <input
                                    type="text"
                                    value={asignatura}
                                    onChange={(e) => setAsignatura(e.target.value)}
                                    placeholder="Ej. Álgebra Lineal"
                                />

                                <label>Nota (0.0 a 5.0)</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="5"
                                    step="0.1"
                                    value={nota}
                                    onChange={(e) => setNota(e.target.value)}
                                    placeholder="Ej. 4.5"
                                />

                                <label>Período académico</label>
                                <input
                                    type="text"
                                    value={periodoCalificacion}
                                    onChange={(e) => setPeriodoCalificacion(e.target.value)}
                                    placeholder="Ej. 2026-2"
                                />

                                <label>Observaciones (opcional)</label>
                                <textarea
                                    value={observaciones}
                                    onChange={(e) => setObservaciones(e.target.value)}
                                    placeholder="Observaciones sobre la calificación..."
                                />

                                <button
                                    type="button"
                                    className="boton-enviar-respuesta"
                                    onClick={guardarCalificacion}
                                    disabled={guardandoCalificacion}
                                >
                                    {guardandoCalificacion
                                        ? "Guardando..."
                                        : "💾 Registrar calificación"}
                                </button>
                            </div>

                        </div>
                    )}

                    {seccionActiva === "estadisticas" && (
                        <div className="estadisticas-contenido">

                            <div className="encabezado-solicitudes">
                                <div>
                                    <h2>Estadísticas generales</h2>
                                    <p>Visualiza el comportamiento de las solicitudes académicas.</p>
                                </div>
                            </div>

                            <div className="estadisticas-resumen">
                                <span>Total de solicitudes registradas</span>
                                <strong>{totalSolicitudes}</strong>
                            </div>

                            <div className="graficas-estadisticas">

                                <div className="grafica-card">
                                    <h3>Solicitudes por estado</h3>
                                    <p>Distribución según el estado actual.</p>

                                    {[
                                        { nombre: "Pendientes", cantidad: pendientes, color: "#f59e0b" },
                                        { nombre: "En proceso", cantidad: enProceso, color: "#3b82f6" },
                                        { nombre: "Resueltas", cantidad: resueltas, color: "#22c55e" }
                                    ].map((item) => (
                                        <div className="barra-grupo" key={item.nombre}>
                                            <div className="barra-informacion">
                                                <span>{item.nombre}</span>
                                                <strong>{item.cantidad}</strong>
                                            </div>

                                            <div className="barra-fondo">
                                                <div
                                                    className="barra-valor"
                                                    style={{
                                                        width: totalSolicitudes > 0
                                                            ? `${(item.cantidad / totalSolicitudes) * 100}%`
                                                            : "0%",
                                                        background: item.color
                                                    }}
                                                ></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="grafica-card">
                                    <h3>Solicitudes por tipo</h3>
                                    <p>Cantidad de solicitudes según su categoría.</p>

                                    {[...new Set(solicitudes.map((s) => s.tipo).filter(Boolean))].map((tipo) => {
                                        const cantidad = solicitudes.filter(
                                            (s) => s.tipo === tipo
                                        ).length;

                                        return (
                                            <div className="barra-grupo" key={tipo}>
                                                <div className="barra-informacion">
                                                    <span>{tipo}</span>
                                                    <strong>{cantidad}</strong>
                                                </div>

                                                <div className="barra-fondo">
                                                    <div
                                                        className="barra-valor"
                                                        style={{
                                                            width: totalSolicitudes > 0
                                                                ? `${(cantidad / totalSolicitudes) * 100}%`
                                                                : "0%",
                                                            background: "#8b5cf6"
                                                        }}
                                                    ></div>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {totalSolicitudes === 0 && (
                                        <p className="estadisticas-vacias">
                                            Todavía no hay solicitudes registradas.
                                        </p>
                                    )}
                                </div>

                            </div>
                        </div>
                    )}

                    {seccionActiva === "configuracion" && (
                        <div className="seccion-configuracion">

                            <div className="config-encabezado">
                                <div>
                                    <h2>Configuración del sistema</h2>
                                    <p>Administra y consulta la información de AcademicAI.</p>
                                </div>
                                <span className="config-etiqueta">⚙️ Administración</span>
                            </div>

                            <div className="config-perfil-principal">
                                <div className="config-avatar-grande">
                                    {(datosAdministrador?.nombre || "A").charAt(0).toUpperCase()}
                                </div>

                                <div className="config-datos-perfil">
                                    <span className="config-subtitulo">CUENTA ADMINISTRADORA</span>
                                    <h2>{datosAdministrador?.nombre || "Administrador"}</h2>
                                    <p>{datosAdministrador?.correo || auth.currentUser?.email}</p>
                                    <span className="config-rol">🛡️ Administrador del sistema</span>
                                </div>

                                <div className="config-estado-cuenta">
                                    <span></span>
                                    Cuenta activa
                                </div>
                            </div>

                            <h3 className="config-titulo">Información de la plataforma</h3>

                            <div className="config-grid">

                                <div className="config-card config-azul">
                                    <div className="config-icono">🎓</div>
                                    <h3>AcademicAI</h3>
                                    <p>Gestión inteligente de solicitudes académicas.</p>
                                    <strong>Plataforma académica</strong>
                                </div>

                                <div className="config-card config-morado">
                                    <div className="config-icono">🔥</div>
                                    <h3>Firebase</h3>
                                    <p>Servicio utilizado para almacenar y consultar información.</p>
                                    <strong>Base de datos Firestore</strong>
                                </div>

                                <div className="config-card config-verde">
                                    <div className="config-icono">📋</div>
                                    <h3>Solicitudes</h3>
                                    <p>Registro y seguimiento de las peticiones estudiantiles.</p>
                                    <strong>{totalSolicitudes} solicitudes registradas</strong>
                                </div>

                                <div className="config-card config-naranja">
                                    <div className="config-icono">👥</div>
                                    <h3>Estudiantes</h3>
                                    <p>Consulta de los usuarios registrados en la plataforma.</p>
                                    <strong>{estudiantes.length} estudiantes registrados</strong>
                                </div>

                            </div>

                        </div>
                    )}
                </section>

            </main>

        </div>
    );
}

export default PanelAdministrador;