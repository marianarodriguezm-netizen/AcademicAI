import { useState } from "react";
import Registro from "./Registro";
import './App.css';
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "./firebase";
import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebase";
import PanelEstudiante from "./PanelEstudiante";
import PanelAdministrador from "./PanelAdministrador";

function App() {

  const [mostrarRegistro, setMostrarRegistro] = useState(false);
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [usuarioActual, setUsuarioActual] = useState(null);

  const iniciarSesion = async (e) => {
    e.preventDefault();

    try {
      const resultado = await signInWithEmailAndPassword(
        auth,
        correo,
        contrasena
      );

      const usuario = resultado.user;

      // Buscar los datos del usuario en Firestore
      const documento = await getDoc(
        doc(db, "usuarios", usuario.uid)
      );

      if (documento.exists()) {
        const datosUsuario = documento.data();

        setUsuarioActual({
          uid: usuario.uid,
          nombre: datosUsuario.nombre,
          correo: datosUsuario.correo,
          rol: datosUsuario.rol
        });

        console.log("Usuario identificado:", datosUsuario.rol);

      } else {
        alert("No se encontraron los datos del usuario.");
      }

    } catch (error) {
      console.error("Error al iniciar sesión:", error);
      alert("No se pudo iniciar sesión: " + error.message);
    }
  };

  if (mostrarRegistro) {
    return (
      <Registro
        onVolver={() => setMostrarRegistro(false)}
      />
    );
  }
  if (usuarioActual?.rol === "estudiante") {
    return (
      <PanelEstudiante
    usuario={usuarioActual}
    onCerrarSesion={() => setUsuarioActual(null)}
/>
    );
  }
 if (usuarioActual?.rol === "admin") {
  return (
    <PanelAdministrador
      onCerrarSesion={() => setUsuarioActual(null)}
    />
  );
}
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

            <h1>
              Tu vida académica,
              <span> más sencilla.</span>
            </h1>

            <p>
              Analiza, gestiona y da seguimiento a tus
              solicitudes académicas con el poder de la
              inteligencia artificial.
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

        <div className="login-card">


          <div className="login-heading">
            <h2>Bienvenido a <span>AcademicAI</span></h2>
            <p>Inicia sesión para continuar</p>
          </div>

          <form className="login-form" onSubmit={iniciarSesion}>

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
                placeholder="Ingresa tu contraseña"
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="login-button">
              Iniciar sesión <span>→</span>
            </button>

          </form>

          <div className="register">
            ¿No tienes una cuenta?
            <button
              type="button"
              className="register-link"
              onClick={() => setMostrarRegistro(true)}
            >
              Regístrate
            </button>
          </div>

          <div className="ai-footer">
            <span>✦</span>
            Con el respaldo de Inteligencia Artificial
          </div>

        </div>

      </section>

    </main>
  );
}

export default App;
