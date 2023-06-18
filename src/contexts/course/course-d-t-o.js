/**
 * DTO de cursada a la que pertenece un docente.
 */
export default class CourseDTO {

    /**
     * ID de la cursada.
     * @type {number}
     */
    #id;

    /**
     * Nombre de la asignatura.
     * @type {string}
     */
    #subject;

    /**
     * Nombre de la carrera.
     * @type {string}
     */
    #career;

    /**
     * Número de comisión.
     * @type {number}
     */
    #commission;

    /**
     * Año de la cursada.
     * @type {number}
     */
    #year;

    /**
     * Nivel de permisos del docente en la cursada.
     * @type {number}
     */
    #permission;

    constructor(id, subject, career, commission, year, permission) {
        this.#id = id;
        this.#subject = subject;
        this.#career = career;
        this.#commission = commission;
        this.#year = year;
        this.#permission = permission;
    }

    /**
     * Crea una instancia a partir del objeto plano devuelto por el backend.
     * @param {Object} obj
     * @returns {CourseDTO}
     */
    static createFrom(obj) {
        const { id, nombreAsignatura, nombreCarrera, numeroComision, anio, nivelPermiso } = obj;
        return new CourseDTO(id, nombreAsignatura, nombreCarrera, numeroComision, anio, nivelPermiso);
    }

    getId() {
        return this.#id;
    }

    getSubject() {
        return this.#subject;
    }

    getCareer() {
        return this.#career;
    }

    getCommission() {
        return this.#commission;
    }

    getYear() {
        return this.#year;
    }

    getPermission() {
        return this.#permission;
    }

    /**
     * Reemplaza los valores de este DTO con los de otra instancia.
     * @param {CourseDTO} dto
     */
    replace(dto) {
        this.#id = dto.getId();
        this.#subject = dto.getSubject();
        this.#career = dto.getCareer();
        this.#commission = dto.getCommission();
        this.#year = dto.getYear();
        this.#permission = dto.getPermission();
    }

}
