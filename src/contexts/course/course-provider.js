import { createContext, useCallback, useContext, useState } from "react";
import PropTypes from "prop-types";
import CourseDTO from "./course-d-t-o";
import { useSpreadsheetContext } from "../spreadsheet/spreadsheet-provider";

/**
 * Contexto de la cursada seleccionada.
 */
const CourseContext = createContext();

/**
 * Proveedor del contexto de la cursada seleccionada.
 */
function CourseProvider({ children, value }) {
    // Inicializar desde localStorage o el valor por defecto
    const [currentValue, setCurrentValue] = useState(() => {
        try {
            const stored = localStorage.getItem("selectedCourse");
            if (stored) {
                return CourseDTO.fromJSON(JSON.parse(stored));
            }
        } catch (error) {
            console.error("Error recuperando la cursada de localStorage:", error);
        }
        return value;
    });

    // Solo podemos usar useSpreadsheetContext si el CourseProvider está dentro de SpreadsheetProvider.
    // Esto es cierto de acuerdo a la estructura en index.js.
    const { clearAllSpreadsheetData } = useSpreadsheetContext() || {};

    /**
     * Función que actualiza la cursada seleccionada. Valida que sea una instancia
     * del DTO.
     * @param {CourseDTO} newValue
     * @throws {TypeError} Si el valor no es una instancia del DTO.
     */
    const changeFn = useCallback(newValue => {
        if (newValue === null || newValue instanceof CourseDTO) {
            setCurrentValue(newValue);
            
            // Persistir en localStorage
            if (newValue) {
                localStorage.setItem("selectedCourse", JSON.stringify(newValue));
            } else {
                localStorage.removeItem("selectedCourse");
            }

            // Si cambia la cursada, limpiamos los datos de planillas cacheadas en memoria
            if (clearAllSpreadsheetData) {
                clearAllSpreadsheetData();
            }
        } else {
            throw new TypeError("El valor debe ser una instancia del DTO o null");
        }
    }, [clearAllSpreadsheetData]);

    return <CourseContext.Provider value={{ value: currentValue, change: changeFn }}>
        {children}
    </CourseContext.Provider>;
}

CourseProvider.propTypes = {
    /**
     * DTO de la cursada seleccionada.
     */
    value: PropTypes.instanceOf(CourseDTO)
};

/**
 * Hook que permite obtener la cursada seleccionada y/o actualizarla. Si no se
 * seleccionó ninguna cursada aún, el valor actual será `null`.
 * @param {boolean} asArray Si es `true` devolverá un array al estilo del `useState`:
 *                          tendrá el valor actual y una función para actualizarlo.
 *                          Si es `false` devolverá solo el valor actual.
 * @returns {(array|CourseDTO|null)}
 */
export function useSelectedCourse(asArray) {
    const context = useContext(CourseContext);
    const value = context.value ? context.value : null;
    return asArray ? [value, context.change] : value;
}

export default CourseProvider;
