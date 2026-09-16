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
     * Código de la asignatura.
     * @type {number}
     */
    #subjectCode;

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

    constructor(id, subjectCode, subject, career, commission, year, permission) {
        this.#id = id;
        this.#subjectCode = subjectCode;
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
        const {
            id,
            codigoAsignatura,
            nombreAsignatura,
            nombreCarrera,
            numeroComision,
            anio,
            nivelPermiso
        } = obj;

        return new CourseDTO(
            id,
            codigoAsignatura,
            nombreAsignatura,
            nombreCarrera,
            numeroComision,
            anio,
            nivelPermiso
        );
    }

    /**
     * Serializa la instancia a JSON.
     * Necesario porque los campos privados no son serializados por defecto.
     * @returns {Object}
     */
    toJSON() {
        return {
            id: this.#id,
            subjectCode: this.#subjectCode,
            subject: this.#subject,
            career: this.#career,
            commission: this.#commission,
            year: this.#year,
            permission: this.#permission
        };
    }

    /**
     * Crea una instancia a partir de un objeto parseado de JSON.
     * @param {Object} obj
     * @returns {CourseDTO}
     */
    static fromJSON(obj) {
        if (!obj) return null;
        return new CourseDTO(
            obj.id,
            obj.subjectCode,
            obj.subject,
            obj.career,
            obj.commission,
            obj.year,
            obj.permission
        );
    }

    getId() {
        return this.#id;
    }

    getSubjectCode() {
        return this.#subjectCode;
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
        this.#subjectCode = dto.getSubjectCode();
        this.#subject = dto.getSubject();
        this.#career = dto.getCareer();
        this.#commission = dto.getCommission();
        this.#year = dto.getYear();
        this.#permission = dto.getPermission();
    }

}
