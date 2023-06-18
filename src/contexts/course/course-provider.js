import { createContext, useCallback, useContext, useState } from "react";
import PropTypes from "prop-types";
import CourseDTO from "./course-d-t-o";

/**
 * Contexto de la cursada seleccionada.
 */
const CourseContext = createContext();

/**
 * Proveedor del contexto de la cursada seleccionada.
 */
function CourseProvider({ children, value }) {
    const [currentValue, setCurrentValue] = useState(value);

    /**
     * Función que actualiza la cursada seleccionada. Valida que sea una instancia
     * del DTO.
     * @param {CourseDTO} newValue
     * @throws {TypeError} Si el valor no es una instancia del DTO.
     */
    const changeFn = useCallback(newValue => {
        if (newValue instanceof CourseDTO) {
            setCurrentValue(newValue);
        } else {
            throw new TypeError("El valor debe ser una instancia del DTO");
        }
    }, []);

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
