
import { useState } from "react";
import {
    createUserWithEmailAndPassword,
    updateProfile
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

function Registro({ onVolver }) {
    const [nombre, setNombre] = useState("");
    const [numeroDocumento, setNumeroDocumento] = useState("");
    const [programaAcademico, setProgramaAcademico] = useState("");
    const [periodoAcademico, setPeriodoAcademico] = useState("");
    const [tipoDocumento, setTipoDocumento] = useState("C.C.");
    const [codigoEstudiante, setCodigoEstudiante] = useState("");
    const [semestre, setSemestre] = useState("");
    const [jornada, setJornada] = useState("Diurna");
    const [modalidad, setModalidad] = useState("Presencial");
    const [intensidadHoraria, setIntensidadHoraria] = useState("");
    const [correo, setCorreo] = useState("");
    const [contrasena, setContrasena] = useState("");
    const [mensaje, setMensaje] = useState("");

    const registrarUsuario = async (e) => {
        e.preventDefault();
        setMensaje("");

        try {
            const resultado = await createUserWithEmailAndPassword(
                auth,
                correo,
                contrasena
            );

            await updateProfile(resultado.user, {
                displayName: nombre
            });

            await setDoc(doc(db, "usuarios", resultado.user.uid), {
                nombre,
                numeroDocumento,
                programaAcademico,
                periodoAcademico,
                tipoDocumento,
                codigoEstudiante,
                semestre,
                jornada,
                modalidad,
                intensidadHoraria: Number(intensidadHoraria),
                correo,
                rol: "estudiante"
            });

            setMensaje("¡Tu cuenta fue creada correctamente!");
        } catch (error) {
            if (error.code === "auth/email-already-in-use") {
                setMensaje("Este correo ya está registrado. Por favor, regresa e inicia sesión.");
            } else if (error.code === "auth/weak-password") {
                setMensaje("La contraseña debe tener al menos 6 caracteres.");
            } else if (error.code === "auth/invalid-email") {
                setMensaje("El formato del correo electrónico no es válido.");
            } else {
                setMensaje("No se pudo crear la cuenta: " + error.message);
            }
        }
    };

    return (
        <main className="login-page">
            <section className="hero-section">
                <div className="hero-content">
                    <div className="brand">
                        <div>
                            <h2>Academic<span>AI</span></h2>
                            <p>Gestión inteligente de solicitudes académicas</p>
                        </div>
                    </div>

                    <div className="hero-text">
                        <span className="tag">✦ EDUCACIÓN INTELIGENTE</span>
                        <h1>Comienza tu experiencia<span> académica.</span></h1>
                        <p>
                            Crea tu cuenta y disfruta de una forma más
                            inteligente de gestionar tus solicitudes académicas.
                        </p>
                    </div>

                    <div className="features">
                        <div className="feature">
                            <span>✦</span>
                            <p>Respuestas<br />inteligentes</p>
                        </div>
                        <div className="feature">
                            <span>◷</span>
                            <p>Seguimiento<br />en tiempo real</p>
                        </div>
                        <div className="feature">
                            <span>✓</span>
                            <p>Seguro y<br />confiable</p>
                        </div>
                    </div>
                </div>

                <div className="decoration-circle circle-one"></div>
                <div className="decoration-circle circle-two"></div>

                <div className="hero-footer">
                    Innovación educativa al alcance de todos.
                </div>
            </section>

            <section className="login-section">
                <div className="login-card register-card">
                    <div className="login-heading">
                        <h2>Crear cuenta en <span>AcademicAI</span></h2>
                        <p>Completa tus datos para comenzar</p>
                    </div>

                    <form className="login-form" onSubmit={registrarUsuario}>
                        <label>Nombre completo</label>
                        <div className="input-group">
                            <span>♙</span>
                            <input
                                type="text"
                                placeholder="Ingresa tu nombre"
                                value={nombre}
                                onChange={(e) => setNombre(e.target.value)}
                                required
                            />
                        </div>

                        <label>Número de documento</label>
                        <div className="input-group">
                            <span>▤</span>
                            <input
                                type="text"
                                placeholder="Ingresa tu número de documento"
                                value={numeroDocumento}
                                onChange={(e) => setNumeroDocumento(e.target.value)}
                                required
                            />
                        </div>

                        <label>Programa académico</label>
                        <div className="input-group">
                            <span>🎓</span>
                            <input
                                type="text"
                                placeholder="Ej. Ingeniería en Sistemas"
                                value={programaAcademico}
                                onChange={(e) => setProgramaAcademico(e.target.value)}
                                required
                            />
                        </div>

                        <label>Período académico</label>
                        <div className="input-group">
                            <span>▦</span>
                            <input
                                type="text"
                                placeholder="Ej. Segundo semestre"
                                value={periodoAcademico}
                                onChange={(e) => setPeriodoAcademico(e.target.value)}
                                required
                            />
                        </div>

                        <label>Tipo de documento</label>
                        <div className="input-group">
                            <select
                                value={tipoDocumento}
                                onChange={(e) => setTipoDocumento(e.target.value)}
                            >
                                <option value="C.C.">Cédula de ciudadanía (C.C.)</option>
                                <option value="T.I.">Tarjeta de identidad (T.I.)</option>
                            </select>
                        </div>

                        <label>Código de estudiante o matrícula</label>
                        <div className="input-group">
                            <span>▤</span>
                            <input
                                type="text"
                                placeholder="Ingresa tu código de estudiante"
                                value={codigoEstudiante}
                                onChange={(e) => setCodigoEstudiante(e.target.value)}
                                required
                            />
                        </div>

                        <label>Semestre que cursas</label>
                        <div className="input-group">
                            <span>🎓</span>
                            <input
                                type="text"
                                placeholder="Ej. Segundo semestre"
                                value={semestre}
                                onChange={(e) => setSemestre(e.target.value)}
                                required
                            />
                        </div>

                        <label>Jornada</label>
                        <div className="input-group">
                            <select
                                value={jornada}
                                onChange={(e) => setJornada(e.target.value)}
                            >
                                <option value="Diurna">Diurna</option>
                                <option value="Nocturna">Nocturna</option>
                                <option value="Sabatina">Sabatina</option>
                            </select>
                        </div>

                        <label>Modalidad</label>
                        <div className="input-group">
                            <select
                                value={modalidad}
                                onChange={(e) => setModalidad(e.target.value)}
                            >
                                <option value="Presencial">Presencial</option>
                                <option value="Virtual">Virtual</option>
                                <option value="Distancia">Distancia</option>
                            </select>
                        </div>

                        <label>Intensidad horaria semanal</label>
                        <div className="input-group">
                            <span>◷</span>
                            <input
                                type="number"
                                min="1"
                                placeholder="Ej. 30"
                                value={intensidadHoraria}
                                onChange={(e) => setIntensidadHoraria(e.target.value)}
                                required
                            />
                        </div>


                        <label>Correo electrónico</label>
                        <div className="input-group">
                            <span>✉</span>
                            <input
                                type="email"
                                placeholder="ejemplo@universidad.edu.co"
                                value={correo}
                                onChange={(e) => setCorreo(e.target.value)}
                                required
                            />
                        </div>

                        <label>Contraseña</label>
                        <div className="input-group">
                            <span>♙</span>
                            <input
                                type="password"
                                placeholder="Crea una contraseña"
                                value={contrasena}
                                onChange={(e) => setContrasena(e.target.value)}
                                minLength={6}
                                required
                            />
                        </div>

                        <button type="submit" className="login-button">
                            Crear cuenta <span>→</span>
                        </button>
                    </form>

                    {mensaje && <p className="register-message">{mensaje}</p>}

                    <div className="register">
                        ¿Ya tienes una cuenta?
                        <button
                            type="button"
                            className="register-link"
                            onClick={onVolver}
                        >
                            Iniciar sesión
                        </button>
                    </div>

                    <div className="ai-footer">
                        <span>✦</span> Con el respaldo de Inteligencia Artificial
                    </div>
                </div>
            </section>
        </main>
    );
}

export default Registro;
