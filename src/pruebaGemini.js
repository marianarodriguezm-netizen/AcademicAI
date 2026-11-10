import { model } from "./firebase";

export async function probarGemini() {
    try {
        const resultado = await model.generateContent(
            "Saluda y di que eres el asistente académico de AcademicAI."
        );

        console.log("Respuesta de Gemini:", resultado.response.text());

    } catch (error) {
        console.error("Error al conectar con Gemini:", error);
    }
}