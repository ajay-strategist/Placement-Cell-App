// db.js
// Handles Supabase Database Integration and Local Caching

// =====================================================================
// SUPABASE CONFIGURATION
// Replace these placeholders with your actual Supabase Project URL and Anon Key.
// =====================================================================
const SUPABASE_URL = "https://qcmjmdsoygrfcitnnqac.supabase.co";
const SUPABASE_KEY = "sb_publishable__scO4pQv-Xft14X53GiO0Q_XoD4VwNz";

// =====================================================================
// DATA MAPPING HELPERS (JS camelCase <-> Postgres snake_case)
// =====================================================================

function toSQLStudent(s) {
    if (!s) return null;
    return {
        name: s.name,
        register_number: s.registerNumber,
        phone: s.phoneNumber || s.phone,
        email: s.mailId || s.email,
        course: s.course,
        department: s.department,
        class: s.class,
        gender: s.gender,
        password: s.password || 'password',
        is_coordinator: s.isCoordinator === true || s.isCoordinator === 'true',
        force_password_reset: s.forcePasswordReset === true || s.forcePasswordReset === 'true',
        scores: s.scores || {}
    };
}

function toJSStudent(row) {
    if (!row) return null;
    return {
        id: row.id,
        name: row.name,
        registerNumber: row.register_number,
        phoneNumber: row.phone,
        mailId: row.email,
        course: row.course,
        department: row.department,
        class: row.class,
        gender: row.gender,
        password: row.password || 'password',
        isCoordinator: row.is_coordinator,
        forcePasswordReset: row.force_password_reset,
        scores: row.scores || {}
    };
}

function toSQLTeacher(t) {
    if (!t) return null;
    return {
        name: t.name,
        phone: t.phoneNumber || t.phone,
        email: t.mailId || t.email,
        department: t.department,
        password: t.password || 'password',
        is_coordinator: t.isCoordinator === true || t.isCoordinator === 'true',
        force_password_reset: t.forcePasswordReset === true || t.forcePasswordReset === 'true'
    };
}

function toJSTeacher(row) {
    if (!row) return null;
    return {
        id: row.id,
        name: row.name,
        phoneNumber: row.phone,
        mailId: row.email,
        department: row.department,
        password: row.password || 'password',
        isCoordinator: row.is_coordinator,
        forcePasswordReset: row.force_password_reset
    };
}

function toSQLTrainingProgram(p) {
    if (!p) return null;
    return {
        id: p.id,
        name: p.name,
        description: p.description,
        venue: p.venue,
        date: p.date,
        end_date: p.endDate,
        days: p.days ? parseInt(p.days) : null,
        is_registration_open: p.isRegistrationOpen !== false,
        is_feedback_open: p.isFeedbackOpen === true || p.isFeedbackOpen === 'true',
        target: p.target || { type: 'all' },
        registrations: p.registrations || [],
        sessions: p.sessions || [],
        batches: p.batches || [],
        feedbacks: p.feedbacks || []
    };
}

function toJSTrainingProgram(row) {
    if (!row) return null;
    return {
        id: row.id,
        name: row.name,
        description: row.description,
        venue: row.venue,
        date: row.date,
        endDate: row.end_date,
        days: row.days,
        isRegistrationOpen: row.is_registration_open,
        isFeedbackOpen: row.is_feedback_open,
        target: row.target || { type: 'all' },
        registrations: row.registrations || [],
        sessions: row.sessions || [],
        batches: row.batches || [],
        feedbacks: row.feedbacks || []
    };
}

// Convert placement activity to SQL structure
function toSQLPlacementActivity(a) {
    if (!a) return null;
    return {
        id: a.id,
        name: a.name,
        venue: a.venue,
        date: a.date,
        last_date: a.lastDate,
        description: a.description,
        type: a.type,
        target: a.target || { type: 'all' },
        registrations: a.registrations || [],
        phases: a.phases || []
    };
}

function toJSPlacementActivity(row) {
    if (!row) return null;
    return {
        id: row.id,
        name: row.name,
        venue: row.venue,
        date: row.date,
        lastDate: row.last_date,
        description: row.description,
        type: row.type,
        target: row.target || { type: 'all' },
        registrations: row.registrations || [],
        phases: row.phases || []
    };
}

function toSQLExam(e) {
    if (!e) return null;
    return {
        id: e.id,
        title: e.title,
        duration: e.duration ? parseInt(e.duration) : 0,
        pass_mark: e.passMark ? parseInt(e.passMark) : 40,
        negative: e.negative ? parseFloat(e.negative) : 0,
        questions: e.questions || [],
        target: e.target || { type: 'all' }
    };
}

function toJSExam(row) {
    if (!row) return null;
    return {
        id: row.id,
        title: row.title,
        duration: row.duration,
        passMark: row.pass_mark,
        negative: row.negative,
        questions: row.questions || [],
        target: row.target || { type: 'all' }
    };
}

function toSQLClassIncharge(c) {
    if (!c) return null;
    return {
        class_name: c.className,
        incharge: c.incharge
    };
}

function toJSClassIncharge(row) {
    if (!row) return null;
    return {
        className: row.class_name,
        incharge: row.incharge
    };
}

// =====================================================================
// DATABASE CLASS
// =====================================================================
class Database {
    constructor() {
        this.client = null;
        this.cache = {
            students: [],
            teachers: [],
            trainingPrograms: [],
            placementActivities: [],
            exams: [],
            examAttempts: [],
            classIncharges: [],
            admin: { username: 'admin', password: 'Admin@1234' }
        };
        this.ready = this.init();
    }

    async init() {
        console.log("Initializing Supabase Database...");
        
        // Check if credentials are set
        if (typeof supabase === 'undefined' || SUPABASE_URL.includes("YOUR_SUPABASE") || SUPABASE_KEY.includes("YOUR_SUPABASE")) {
            console.warn("Supabase client or credentials not configured yet. Falling back to LocalStorage backup.");
            this.loadLocalStorageBackup();
            return false;
        }

        try {
            // Initialize Supabase Client
            this.client = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

            // Fetch all tables in parallel
            const [
                { data: studentsData, error: sErr },
                { data: teachersData, error: tErr },
                { data: programsData, error: pErr },
                { data: activitiesData, error: aErr },
                { data: examsData, error: eErr },
                { data: attemptsData, error: attErr },
                { data: inchargesData, error: iErr }
            ] = await Promise.all([
                this.client.from('students').select('*'),
                this.client.from('teachers').select('*'),
                this.client.from('training_programs').select('*'),
                this.client.from('placement_activities').select('*'),
                this.client.from('exams').select('*'),
                this.client.from('exam_attempts').select('*'),
                this.client.from('class_incharge').select('*')
            ]);

            if (sErr || tErr || pErr || aErr || eErr || attErr) {
                console.error("Supabase load errors:", { sErr, tErr, pErr, aErr, eErr, attErr });
                throw new Error("One or more tables failed to load from Supabase.");
            }

            if (iErr) {
                console.warn("class_incharge table not found in Supabase (loading from localStorage backup):", iErr);
                const localBackup = localStorage.getItem('db_cache');
                if (localBackup) {
                    try {
                        const parsed = JSON.parse(localBackup);
                        this.cache.classIncharges = parsed.classIncharges || [];
                    } catch(e) {
                        this.cache.classIncharges = [];
                    }
                } else {
                    this.cache.classIncharges = [];
                }
            } else {
                this.cache.classIncharges = (inchargesData || []).map(toJSClassIncharge);
            }

            // Map data to local cache structures
            this.cache.students = (studentsData || []).map(toJSStudent);
            this.cache.teachers = (teachersData || []).map(toJSTeacher);
            this.cache.trainingPrograms = (programsData || []).map(toJSTrainingProgram);
            this.cache.placementActivities = (activitiesData || []).map(toJSPlacementActivity);
            this.cache.exams = (examsData || []).map(toJSExam);
            this.cache.examAttempts = attemptsData || [];

            console.log("Supabase initialization complete.");
            
            // Backup to LocalStorage
            localStorage.setItem('db_cache', JSON.stringify(this.cache));
            return true;
        } catch (error) {
            console.error("Supabase load failed, using LocalStorage backup:", error);
            this.loadLocalStorageBackup();
            return false;
        }
    }

    loadLocalStorageBackup() {
        const backup = localStorage.getItem('db_cache');
        if (backup) {
            this.cache = JSON.parse(backup);
        } else {
            console.log("No LocalStorage backup found. Seeding sample data...");
            this.loadSampleData();
        }
    }

    async sync(tableName, data) {
        if (!this.client) {
            localStorage.setItem('db_cache', JSON.stringify(this.cache));
            return { success: true, message: 'Saved locally.' };
        }

        try {
            let error = null;
            if (tableName === 'Students') {
                const rows = Array.isArray(data) ? data.map(toSQLStudent) : [toSQLStudent(data)];
                const res = await this.client.from('students').upsert(rows);
                error = res.error;
            } else if (tableName === 'Teacher') {
                const rows = Array.isArray(data) ? data.map(toSQLTeacher) : [toSQLTeacher(data)];
                const res = await this.client.from('teachers').upsert(rows);
                error = res.error;
            } else if (tableName === 'Training Program') {
                const rows = Array.isArray(data) ? data.map(toSQLTrainingProgram) : [toSQLTrainingProgram(data)];
                const res = await this.client.from('training_programs').upsert(rows);
                error = res.error;
            } else if (tableName === 'Activity') {
                const rows = Array.isArray(data) ? data.map(toSQLPlacementActivity) : [toSQLPlacementActivity(data)];
                const res = await this.client.from('placement_activities').upsert(rows);
                error = res.error;
            } else if (tableName === 'Exams') {
                const rows = Array.isArray(data) ? data.map(toSQLExam) : [toSQLExam(data)];
                const res = await this.client.from('exams').upsert(rows);
                error = res.error;
            } else if (tableName === 'ClassIncharge') {
                const rows = Array.isArray(data) ? data.map(toSQLClassIncharge) : [toSQLClassIncharge(data)];
                const res = await this.client.from('class_incharge').upsert(rows);
                error = res.error;
            }

            if (error) {
                if (error.code === 'PGRST205' || (error.message && error.message.includes('schema cache'))) {
                    console.warn(`Supabase table missing for ${tableName}, saved locally only.`);
                    localStorage.setItem('db_cache', JSON.stringify(this.cache));
                    return { success: true, message: 'Saved locally (cloud table missing).' };
                }
                throw error;
            }
            localStorage.setItem('db_cache', JSON.stringify(this.cache));
            return { success: true, message: 'Synced with cloud.' };
        } catch (e) {
            console.error(`Sync error for ${tableName}:`, e);
            showToast(`Sync Error: ${e.message}`, 'error');
            return { success: false, message: e.message };
        }
    }

    async deleteRecord(tableName, id) {
        if (!this.client) {
            localStorage.setItem('db_cache', JSON.stringify(this.cache));
            return { success: true };
        }

        try {
            let error = null;
            if (tableName === 'Students') {
                const res = await this.client.from('students').delete().eq('register_number', id);
                error = res.error;
            } else if (tableName === 'Teacher') {
                const res = await this.client.from('teachers').delete().eq('phone', id);
                error = res.error;
            } else if (tableName === 'Training Program') {
                const res = await this.client.from('training_programs').delete().eq('id', id);
                error = res.error;
            } else if (tableName === 'Activity') {
                const res = await this.client.from('placement_activities').delete().eq('id', id);
                error = res.error;
            } else if (tableName === 'Exams') {
                const res = await this.client.from('exams').delete().eq('id', id);
                error = res.error;
            } else if (tableName === 'ClassIncharge') {
                const res = await this.client.from('class_incharge').delete().eq('class_name', id);
                error = res.error;
            }

            if (error) {
                if (error.code === 'PGRST205' || (error.message && error.message.includes('schema cache'))) {
                    console.warn(`Supabase table missing for deleting ${tableName}, deleted locally only.`);
                    localStorage.setItem('db_cache', JSON.stringify(this.cache));
                    return { success: true };
                }
                throw error;
            }
            localStorage.setItem('db_cache', JSON.stringify(this.cache));
            return { success: true };
        } catch (e) {
            console.error(`Delete error for ${tableName}:`, e);
            showToast(`Delete Error: ${e.message}`, 'error');
            return { success: false, message: e.message };
        }
    }

    // --- Students ---
    getStudents() {
        return this.cache.students;
    }

    async addStudent(student) {
        if (this.cache.students.find(s => s.registerNumber === student.registerNumber)) {
            return { success: false, message: 'Student already exists.' };
        }
        student.password = (student.password || 'password').trim();
        student.forcePasswordReset = true;
        this.cache.students.push(student);
        const res = await this.sync("Students", student);
        if (res.success) showToast('Student added successfully!', 'success');
        return res;
    }

    async updateStudent(regNo, updatedData) {
        const index = this.cache.students.findIndex(s => s.registerNumber === regNo);
        if (index !== -1) {
            this.cache.students[index] = { ...this.cache.students[index], ...updatedData };
            const res = await this.sync("Students", this.cache.students[index]);
            if (res.success) showToast('Student profile updated!', 'success');
            return res;
        }
        return { success: false, message: 'Student not found.' };
    }

    async deleteStudent(regNo) {
        this.cache.students = this.cache.students.filter(s => s.registerNumber !== regNo);
        const res = await this.deleteRecord("Students", regNo);
        if (res.success) showToast('Student record deleted.', 'success');
        return res;
    }

    async addStudentsBulk(newStudents) {
        const toAdd = [];
        let duplicateCount = 0;

        newStudents.forEach(student => {
            if (this.cache.students.find(s => s.registerNumber === student.registerNumber)) {
                duplicateCount++;
            } else {
                student.password = (student.password || 'password').trim();
                student.forcePasswordReset = true;
                this.cache.students.push(student);
                toAdd.push(student);
            }
        });

        if (toAdd.length > 0) {
            const res = await this.sync("Students", toAdd);
            if (res.success) {
                showToast(`Uploaded ${toAdd.length} students.`, 'success');
                return {
                    success: true,
                    message: `Bulk upload complete. ${toAdd.length} students synced to Cloud.${duplicateCount > 0 ? ` ${duplicateCount} duplicates skipped.` : ''}`
                };
            }
            return res;
        }

        return { success: true, message: `No new students added. ${duplicateCount} duplicates skipped.` };
    }

    async saveStudents(students) {
        this.cache.students = students;
        return await this.sync("Students", students);
    }

    // --- Teachers ---
    getTeachers() {
        return this.cache.teachers;
    }

    async addTeacher(teacher) {
        if (this.cache.teachers.find(t => t.phoneNumber === teacher.phoneNumber)) {
            return { success: false, message: 'Teacher already exists.' };
        }
        teacher.password = (teacher.password || 'password').trim();
        teacher.forcePasswordReset = true;
        this.cache.teachers.push(teacher);
        const res = await this.sync("Teacher", teacher);
        if (res.success) showToast('Teacher coordinator added!', 'success');
        return res;
    }

    async updateTeacher(phoneNumber, updatedData) {
        const index = this.cache.teachers.findIndex(t => t.phoneNumber === phoneNumber);
        if (index !== -1) {
            this.cache.teachers[index] = { ...this.cache.teachers[index], ...updatedData };
            const res = await this.sync("Teacher", this.cache.teachers[index]);
            if (res.success) showToast('Teacher coordinator updated!', 'success');
            return res;
        }
        return { success: false, message: 'Teacher not found.' };
    }

    async deleteTeacher(phoneNumber) {
        this.cache.teachers = this.cache.teachers.filter(t => t.phoneNumber !== phoneNumber);
        const res = await this.deleteRecord("Teacher", phoneNumber);
        if (res.success) showToast('Teacher record deleted.', 'success');
        return res;
    }

    async saveTeachers(teachers) {
        this.cache.teachers = teachers;
        return await this.sync("Teacher", teachers);
    }

    async resetPassword(role, id) {
        if (role === 'student') {
            const index = this.cache.students.findIndex(s => s.registerNumber === id);
            if (index !== -1) {
                this.cache.students[index].password = 'password';
                this.cache.students[index].forcePasswordReset = true;
                const res = await this.sync("Students", this.cache.students[index]);
                if (res.success) showToast('Password reset to default.', 'success');
                return { success: true, message: "Password reset to 'password' for " + id };
            }
        }
        return { success: false, message: "User not found." };
    }

    // --- Training Programs ---
    getTrainingPrograms() {
        return this.cache.trainingPrograms;
    }

    async addTrainingProgram(program) {
        program.id = 'TRN' + Date.now();
        program.registrations = [];
        program.sessions = [];
        program.feedbacks = [];
        program.batches = [];
        this.cache.trainingPrograms.push(program);
        const res = await this.sync("Training Program", program);
        if (res.success) showToast('Training program created!', 'success');
        return res;
    }

    async updateTrainingProgram(id, updatedData) {
        const index = this.cache.trainingPrograms.findIndex(p => p.id === id);
        if (index !== -1) {
            this.cache.trainingPrograms[index] = { ...this.cache.trainingPrograms[index], ...updatedData };
            const res = await this.sync("Training Program", this.cache.trainingPrograms[index]);
            if (res.success) showToast('Training program updated!', 'success');
            return res;
        }
        return { success: false };
    }

    async deleteTrainingProgram(id) {
        this.cache.trainingPrograms = this.cache.trainingPrograms.filter(p => p.id !== id);
        const res = await this.deleteRecord("Training Program", id);
        if (res.success) showToast('Program deleted.', 'success');
        return res;
    }

    async toggleRegistration(id) {
        const program = this.cache.trainingPrograms.find(p => p.id === id);
        if (program) {
            program.isRegistrationOpen = !program.isRegistrationOpen;
            const res = await this.sync("Training Program", program);
            return {
                success: res.success,
                message: `Registration is now ${program.isRegistrationOpen ? 'OPEN' : 'CLOSED'} for ${program.name}.`
            };
        }
        return { success: false, message: 'Program not found.' };
    }

    async toggleFeedback(id) {
        const program = this.cache.trainingPrograms.find(p => p.id === id);
        if (program) {
            program.isFeedbackOpen = !program.isFeedbackOpen;
            const res = await this.sync("Training Program", program);
            return {
                success: res.success,
                message: `Feedback is now ${program.isFeedbackOpen ? 'ENABLED' : 'DISABLED'} for ${program.name}.`
            };
        }
        return { success: false, message: 'Program not found.' };
    }

    async updateAttendance(programId, day, session, regNumbers) {
        const index = this.cache.trainingPrograms.findIndex(p => p.id === programId);
        if (index !== -1) {
            const program = this.cache.trainingPrograms[index];
            program.sessions = program.sessions || [];
            let sess = program.sessions.find(s => s.date === day && s.time === session);
            if (!sess) {
                sess = {
                    id: 'SESS' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
                    date: day,
                    time: session,
                    venue: 'Uploaded via Excel',
                    attendance: regNumbers
                };
                program.sessions.push(sess);
            } else {
                sess.attendance = regNumbers;
            }
            const res = await this.sync("Training Program", program);
            return {
                success: res.success,
                message: `Attendance updated for ${day} ${session}.`
            };
        }
        return { success: false, message: 'Program not found.' };
    }

    async updatePhaseCompletions(activityId, phaseId, regNumbers) {
        const index = this.cache.placementActivities.findIndex(a => a.id === activityId);
        if (index === -1) return { success: false, message: 'Activity not found.' };
        const activity = this.cache.placementActivities[index];
        activity.phases = activity.phases || [];
        const phaseIndex = activity.phases.findIndex(p => p.id === phaseId);
        if (phaseIndex === -1) return { success: false, message: 'Phase not found.' };
        const phase = activity.phases[phaseIndex];
        
        let invalidRegNo = null;
        if (phaseIndex > 0) {
            const prevPhase = activity.phases[phaseIndex - 1];
            const prevCompletions = prevPhase.completions || [];
            for (let reg of regNumbers) {
                if (!prevCompletions.includes(reg)) {
                    invalidRegNo = reg;
                    break;
                }
            }
        }
        
        if (invalidRegNo) {
            const student = this.cache.students.find(s => s.registerNumber === invalidRegNo);
            const name = student ? student.name : invalidRegNo;
            const prevPhaseName = activity.phases[phaseIndex - 1].name;
            return { 
                success: false, 
                message: `Cannot qualify student ${name}: they must clear the previous round (${prevPhaseName}) first.` 
            };
        }
        
        phase.completions = regNumbers;
        
        for (let i = phaseIndex + 1; i < activity.phases.length; i++) {
            activity.phases[i].completions = (activity.phases[i].completions || []).filter(x => regNumbers.includes(x));
        }
        
        const res = await this.sync("Activity", activity);
        if (res.success) showToast('Qualifications updated successfully!', 'success');
        return res;
    }


    async clearAllTrainingPrograms() {
        if (this.client) {
            const { error } = await this.client.from('training_programs').delete().neq('id', '');
            if (error) return { success: false, message: error.message };
        }
        this.cache.trainingPrograms = [];
        localStorage.setItem('db_cache', JSON.stringify(this.cache));
        showToast('All programs cleared.', 'success');
        return { success: true, message: 'All training programs deleted.' };
    }

    // --- Placement Activities ---
    getPlacementActivities() {
        return this.cache.placementActivities.map(a => ({
            ...a,
            phases: a.phases || [],
            registrations: a.registrations || [],
            target: a.target || { type: 'all' }
        }));
    }

    async addPlacementActivity(activity) {
        activity.id = 'PLC' + Date.now();
        activity.phases = [];
        activity.registrations = [];
        this.cache.placementActivities.push(activity);
        const res = await this.sync("Activity", activity);
        if (res.success) showToast('Placement drive created!', 'success');
        return res;
    }

    async updatePlacementActivity(id, updatedData) {
        const index = this.cache.placementActivities.findIndex(a => a.id === id);
        if (index !== -1) {
            this.cache.placementActivities[index] = { ...this.cache.placementActivities[index], ...updatedData };
            const res = await this.sync("Activity", this.cache.placementActivities[index]);
            if (res.success) showToast('Placement activity updated!', 'success');
            return res;
        }
        return { success: false };
    }

    async deletePlacementActivity(id) {
        this.cache.placementActivities = this.cache.placementActivities.filter(a => a.id !== id);
        const res = await this.deleteRecord("Activity", id);
        if (res.success) showToast('Placement activity deleted.', 'success');
        return res;
    }

    // --- Auth & Generic ---
    getAdmin() { return this.cache.admin; }

    // --- MCQ Exams ---
    getExams() {
        return this.cache.exams;
    }

    async addExam(exam) {
        exam.id = 'EXM' + Date.now();
        this.cache.exams.push(exam);
        const res = await this.sync('Exams', exam);
        if (res.success) showToast('MCQ Exam created!', 'success');
        return { ...res, id: exam.id };
    }

    async updateExam(id, updated) {
        const i = this.cache.exams.findIndex(e => e.id === id);
        if (i !== -1) {
            this.cache.exams[i] = { ...this.cache.exams[i], ...updated };
            const res = await this.sync('Exams', this.cache.exams[i]);
            if (res.success) showToast('MCQ Exam updated!', 'success');
            return res;
        }
        return { success: false };
    }

    async deleteExam(id) {
        this.cache.exams = this.cache.exams.filter(e => e.id !== id);
        const res = await this.deleteRecord('Exams', id);
        if (res.success) showToast('Exam deleted.', 'success');
        return res;
    }

    // --- MCQ Attempts ---
    getExamAttempts() {
        return this.cache.examAttempts || [];
    }

    async addExamAttempt(attempt) {
        if (!this.client) {
            if (!attempt.id) attempt.id = 'ATT' + Date.now();
            attempt.submitted_at = new Date().toISOString();
            this.cache.examAttempts.push(attempt);
            localStorage.setItem('db_cache', JSON.stringify(this.cache));
            return { success: true };
        }

        try {
            const { data, error } = await this.client
                .from('exam_attempts')
                .insert([{
                    exam_id: attempt.exam_id,
                    register_number: attempt.register_number,
                    answers: attempt.answers,
                    score: attempt.score,
                    passed: attempt.passed
                }])
                .select();

            if (error) throw error;
            if (data && data.length) {
                this.cache.examAttempts.push(data[0]);
            }
            localStorage.setItem('db_cache', JSON.stringify(this.cache));
            showToast('Exam attempt submitted successfully!', 'success');
            return { success: true };
        } catch (e) {
            console.error("Submit attempt failed:", e);
            showToast(`Submit failed: ${e.message}`, 'error');
            return { success: false, message: e.message };
        }
    }

    // --- Class Incharges ---
    getClassIncharges() {
        return this.cache.classIncharges || [];
    }

    getClassIncharge(className) {
        const row = (this.cache.classIncharges || []).find(c => c.className === className);
        return row ? row.incharge : '';
    }

    async setClassIncharge(className, incharge) {
        this.cache.classIncharges = this.cache.classIncharges || [];
        const index = this.cache.classIncharges.findIndex(c => c.className === className);
        const row = { className, incharge };
        if (index !== -1) {
            this.cache.classIncharges[index] = row;
        } else {
            this.cache.classIncharges.push(row);
        }
        const res = await this.sync('ClassIncharge', row);
        if (res.success) showToast(`Class incharge updated for ${className}.`, 'success');
        return res;
    }

    async deleteClass(className) {
        this.cache.classIncharges = this.cache.classIncharges || [];
        this.cache.classIncharges = this.cache.classIncharges.filter(c => c.className !== className);
        
        // Clear class for students assigned to this class
        this.cache.students = this.cache.students || [];
        const affectedStudents = [];
        this.cache.students.forEach(s => {
            if (s.class === className) {
                s.class = '';
                affectedStudents.push(s);
            }
        });
        
        if (affectedStudents.length > 0) {
            await this.sync('Students', affectedStudents);
        }
        
        const res = await this.deleteRecord('ClassIncharge', className);
        if (res.success) showToast(`Class "${className}" deleted successfully.`, 'success');
        return res;
    }

    async changePassword(role, id, newPassword) {
        if (role === 'student') {
            const index = this.cache.students.findIndex(s => s.registerNumber === id);
            if (index !== -1) {
                this.cache.students[index].password = newPassword;
                delete this.cache.students[index].forcePasswordReset;
                const res = await this.sync("Students", this.cache.students[index]);
                if (res.success) showToast('Password updated!', 'success');
                return { success: true, message: 'Password updated successfully.' };
            }
        } else if (role === 'teacher') {
            const index = this.cache.teachers.findIndex(t => t.phoneNumber === id);
            if (index !== -1) {
                this.cache.teachers[index].password = newPassword;
                delete this.cache.teachers[index].forcePasswordReset;
                const res = await this.sync("Teacher", this.cache.teachers[index]);
                if (res.success) showToast('Password updated!', 'success');
                return { success: true, message: 'Password updated successfully.' };
            }
        }
        return { success: false, message: 'User not found.' };
    }

    async registerForPlacement(activityId, regNo) {
        const index = this.cache.placementActivities.findIndex(a => a.id === activityId);
        if (index === -1) return { success: false, message: 'Placement activity not found.' };
        const activity = this.cache.placementActivities[index];
        activity.registrations = activity.registrations || [];
        if (activity.registrations.includes(regNo)) {
            return { success: false, message: 'You are already registered.' };
        }
        activity.registrations.push(regNo);
        const res = await this.sync("Activity", activity);
        if (res.success) showToast('Registered for drive!', 'success');
        return res;
    }

    async togglePhaseCompletion(activityId, phaseId, regNo, isNowComplete) {
        const index = this.cache.placementActivities.findIndex(a => a.id === activityId);
        if (index === -1) return { success: false, message: 'Activity not found.' };
        const activity = this.cache.placementActivities[index];
        activity.phases = activity.phases || [];
        const phaseIndex = activity.phases.findIndex(p => p.id === phaseId);
        if (phaseIndex === -1) return { success: false, message: 'Phase not found.' };
        const phase = activity.phases[phaseIndex];
        phase.completions = phase.completions || [];
        
        if (isNowComplete) {
            if (phaseIndex > 0) {
                const prevPhase = activity.phases[phaseIndex - 1];
                const prevCompletions = prevPhase.completions || [];
                if (!prevCompletions.includes(regNo)) {
                    return { success: false, message: `Cannot qualify: Student must clear previous round (${prevPhase.name}) first.` };
                }
            }
            if (!phase.completions.includes(regNo)) {
                phase.completions.push(regNo);
            }
        } else {
            phase.completions = phase.completions.filter(x => x !== regNo);
            for (let i = phaseIndex + 1; i < activity.phases.length; i++) {
                activity.phases[i].completions = (activity.phases[i].completions || []).filter(x => x !== regNo);
            }
        }
        
        const res = await this.sync("Activity", activity);
        if (res.success) showToast('Qualification updated!', 'success');
        return res;
    }

    getStudentAttendance(regNo) {
        const student = this.cache.students.find(s => s.registerNumber === regNo);
        if (!student) return [];
        
        return this.cache.trainingPrograms.map(p => {
            const isRegistered = (p.registrations || []).includes(regNo);
            const myBatch = (p.batches || []).find(b => (b.students || []).includes(regNo));
            
            const studentSessions = (p.sessions || []).filter(s => {
                if (!s.batchId) return true;
                return myBatch && s.batchId === myBatch.id;
            }).map(s => {
                return {
                    id: s.id,
                    date: s.date,
                    time: s.time,
                    venue: s.venue,
                    present: (s.attendance || []).includes(regNo)
                };
            });

            return {
                id: p.id,
                name: p.name,
                isRegistered,
                sessions: studentSessions
            };
        });
    }

    async registerForProgram(programId, regNo) {
        const index = this.cache.trainingPrograms.findIndex(p => p.id === programId);
        if (index === -1) return { success: false, message: 'Program not found.' };
        const program = this.cache.trainingPrograms[index];
        program.registrations = program.registrations || [];
        if (program.registrations.includes(regNo)) {
            return { success: false, message: 'You are already registered.' };
        }
        program.registrations.push(regNo);
        const res = await this.sync("Training Program", program);
        if (res.success) showToast('Registered for program!', 'success');
        return res;
    }

    async submitTrainingFeedback(programId, regNo, feedback) {
        const index = this.cache.trainingPrograms.findIndex(p => p.id === programId);
        if (index === -1) return { success: false, message: 'Program not found.' };
        const program = this.cache.trainingPrograms[index];
        program.feedbacks = program.feedbacks || [];
        program.feedbacks = program.feedbacks.filter(f => f.studentId !== regNo);
        program.feedbacks.push({
            studentId: regNo,
            rating: Number(feedback.rating),
            comment: feedback.comment,
            date: new Date().toISOString().split('T')[0]
        });
        const res = await this.sync("Training Program", program);
        if (res.success) showToast('Feedback submitted.', 'success');
        return res;
    }

    async setStudentScore(regNo, programId, score) {
        const idx = this.cache.students.findIndex(s => s.registerNumber === regNo);
        if (idx === -1) return { success: false, message: 'Student not found.' };
        const s = this.cache.students[idx];
        s.scores = s.scores || {};
        s.scores[programId] = score;
        return await this.sync('Students', s);
    }

    async addTrainingSession(programId, date, time, batchId = '', venue = '') {
        const index = this.cache.trainingPrograms.findIndex(p => p.id === programId);
        if (index !== -1) {
            const program = this.cache.trainingPrograms[index];
            program.sessions = program.sessions || [];

            let formattedTime = time;
            if (time && time.includes(':')) {
                const [h, m] = time.split(':');
                const hour = parseInt(h);
                if (!isNaN(hour)) {
                    const period = hour >= 12 ? 'PM' : 'AM';
                    const hour12 = hour % 12 || 12;
                    formattedTime = `${hour12}:${m} ${period}`;
                }
            }

            const newSession = {
                id: 'sess_' + Date.now(),
                date: date,
                time: formattedTime,
                venue: venue || '',
                attendance: []
            };
            if (batchId) {
                newSession.batchId = batchId;
            }
            program.sessions.push(newSession);
            const res = await this.sync("Training Program", program);
            if (res.success) showToast('Session scheduled.', 'success');
            return res;
        }
        return { success: false, message: 'Program not found.' };
    }

    async deleteSession(programId, sessionId) {
        const index = this.cache.trainingPrograms.findIndex(p => p.id === programId);
        if (index !== -1) {
            const program = this.cache.trainingPrograms[index];
            program.sessions = (program.sessions || []).filter(s => s.id !== sessionId);
            const res = await this.sync("Training Program", program);
            if (res.success) showToast('Session deleted.', 'success');
            return res;
        }
        return { success: false };
    }

    async updateSession(programId, sessionId, date, time, batchId = '') {
        const index = this.cache.trainingPrograms.findIndex(p => p.id === programId);
        if (index !== -1) {
            const program = this.cache.trainingPrograms[index];
            program.sessions = program.sessions || [];
            const sessionIndex = program.sessions.findIndex(s => s.id === sessionId);
            if (sessionIndex !== -1) {
                program.sessions[sessionIndex].date = date;
                program.sessions[sessionIndex].time = time;
                if (batchId) {
                    program.sessions[sessionIndex].batchId = batchId;
                } else {
                    delete program.sessions[sessionIndex].batchId;
                }
                const res = await this.sync("Training Program", program);
                if (res.success) showToast('Session details updated.', 'success');
                return res;
            }
        }
        return { success: false };
    }

    async updateSessionAttendance(programId, sessionId, regNumbers) {
        const index = this.cache.trainingPrograms.findIndex(p => p.id === programId);
        if (index !== -1) {
            const program = this.cache.trainingPrograms[index];
            program.sessions = program.sessions || [];
            const sessionIndex = program.sessions.findIndex(s => s.id === sessionId);
            if (sessionIndex !== -1) {
                program.sessions[sessionIndex].attendance = regNumbers;
                const res = await this.sync("Training Program", program);
                if (res.success) showToast('Attendance saved.', 'success');
                return res;
            }
        }
        return { success: false, message: 'Session not found.' };
    }

    async addTrainingBatch(programId, name) {
        const index = this.cache.trainingPrograms.findIndex(p => p.id === programId);
        if (index !== -1) {
            const program = this.cache.trainingPrograms[index];
            program.batches = program.batches || [];
            const newBatch = {
                id: 'batch_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
                name: name,
                students: []
            };
            program.batches.push(newBatch);
            const res = await this.sync("Training Program", program);
            if (res.success) showToast('Batch created successfully!', 'success');
            return res;
        }
        return { success: false, message: 'Program not found.' };
    }

    async deleteTrainingBatch(programId, batchId) {
        const index = this.cache.trainingPrograms.findIndex(p => p.id === programId);
        if (index !== -1) {
            const program = this.cache.trainingPrograms[index];
            program.batches = (program.batches || []).filter(b => b.id !== batchId);
            
            program.sessions = program.sessions || [];
            program.sessions.forEach(s => {
                if (s.batchId === batchId) delete s.batchId;
            });

            const res = await this.sync("Training Program", program);
            if (res.success) showToast('Batch deleted.', 'success');
            return res;
        }
        return { success: false };
    }

    async assignStudentsToBatch(programId, studentRegNos, batchId) {
        const index = this.cache.trainingPrograms.findIndex(p => p.id === programId);
        if (index !== -1) {
            const program = this.cache.trainingPrograms[index];
            program.batches = program.batches || [];
            
            program.batches.forEach(b => {
                b.students = (b.students || []).filter(regNo => !studentRegNos.includes(regNo));
            });

            if (batchId) {
                const targetBatch = program.batches.find(b => b.id === batchId);
                if (targetBatch) {
                    targetBatch.students = targetBatch.students || [];
                    studentRegNos.forEach(regNo => {
                        if (!targetBatch.students.includes(regNo)) {
                            targetBatch.students.push(regNo);
                        }
                    });
                }
            }

            const res = await this.sync("Training Program", program);
            if (res.success) showToast('Batch student assignments updated.', 'success');
            return res;
        }
        return { success: false, message: 'Program not found.' };
    }

    async autoSplitTrainingBatches(programId, method, value) {
        const index = this.cache.trainingPrograms.findIndex(p => p.id === programId);
        if (index !== -1) {
            const program = this.cache.trainingPrograms[index];
            const registrations = program.registrations || [];
            if (registrations.length === 0) {
                return { success: false, message: 'No registered students to split.' };
            }

            if (method === 'by_class' || method === 'by_department') {
                const field = method === 'by_class' ? 'class' : 'department';
                const studentMap = {};
                this.cache.students.forEach(s => { studentMap[s.registerNumber] = s; });
                const groups = {};
                registrations.forEach(regNo => {
                    const s = studentMap[regNo];
                    const key = (s && s[field]) ? s[field] : 'Unspecified';
                    (groups[key] = groups[key] || []).push(regNo);
                });
                const groupBatches = Object.keys(groups).sort().map((key, i) => ({
                    id: 'batch_' + Date.now() + '_' + i + '_' + Math.random().toString(36).substr(2, 5),
                    name: String(key),
                    students: groups[key]
                }));
                program.batches = groupBatches;
                const res = await this.sync("Training Program", program);
                if (res.success) showToast(`Split registrations into ${groupBatches.length} batch(es).`, 'success');
                return res;
            }

            let numBatches = 1;
            if (method === 'num_batches') {
                numBatches = parseInt(value) || 1;
            } else if (method === 'batch_size') {
                const size = parseInt(value) || 60;
                numBatches = Math.ceil(registrations.length / size) || 1;
            }

            if (numBatches <= 0) numBatches = 1;

            const newBatches = [];
            for (let i = 0; i < numBatches; i++) {
                newBatches.push({
                    id: 'batch_' + Date.now() + '_' + i + '_' + Math.random().toString(36).substr(2, 5),
                    name: `Batch ${i + 1}`,
                    students: []
                });
            }

            registrations.forEach((regNo, idx) => {
                const batchIdx = idx % numBatches;
                newBatches[batchIdx].students.push(regNo);
            });

            program.batches = newBatches;
            const res = await this.sync("Training Program", program);
            if (res.success) showToast(`Split registrations into ${numBatches} batches.`, 'success');
            return res;
        }
        return { success: false, message: 'Program not found.' };
    }

    validateLogin(username, password, type) {
        const checkPass = (user, inputPass) => {
            const storedPass = user.password || 'password';
            const isFirstLogin = user.forcePasswordReset === true || user.forcePasswordReset === 'true' || storedPass === 'password';
            return storedPass === inputPass || (isFirstLogin && inputPass === 'password');
        };

        if (type === 'admin') {
            const admin = this.cache.admin;
            if (username === admin.username && password === admin.password) {
                return { success: true, user: { name: 'Admin', username } };
            }
            return { success: false, message: 'Invalid admin credentials.' };
        } else if (type === 'teacherCoordinator') {
            const teacher = this.cache.teachers.find(t => t.phoneNumber === username);
            if (teacher) {
                if (checkPass(teacher, password)) {
                    if (teacher.isCoordinator === true || teacher.isCoordinator === 'true') {
                        return { success: true, user: teacher };
                    } else {
                        return { success: false, message: 'You do not have Teacher Coordinator privileges.' };
                    }
                }
            }
            return { success: false, message: 'Invalid teacher credentials.' };
        } else if (type === 'studentCoordinator') {
            const student = this.cache.students.find(s => s.registerNumber.trim().toLowerCase() === username.trim().toLowerCase());
            if (student) {
                if (checkPass(student, password)) {
                    if (student.isCoordinator === true || student.isCoordinator === 'true') {
                        return { success: true, user: student };
                    } else {
                        return { success: false, message: 'You do not have Student Coordinator privileges.' };
                    }
                }
            }
            return { success: false, message: 'Invalid register number or password.' };
        } else if (type === 'student') {
            const student = this.cache.students.find(s => s.registerNumber.trim().toLowerCase() === username.trim().toLowerCase());
            if (student) {
                if (checkPass(student, password)) {
                    return { success: true, user: student };
                }
            }
            return { success: false, message: 'Invalid register number or password.' };
        } else {
            const teacher = this.cache.teachers.find(t => t.phoneNumber === username);
            if (teacher) {
                if (checkPass(teacher, password)) {
                    return { success: true, user: teacher };
                }
            }
            return { success: false, message: 'Invalid credentials.' };
        }
    }

    // --- Seeding ---
    loadSampleData() {
        this.cache.students = [
            { name: "Arjun Mehta", registerNumber: "CC_CS_01", phoneNumber: "9876500001", mailId: "arjun@christ.edu", course: "BCA", department: "Computer Science", class: "1 BCA A", gender: "Male", password: "password", isCoordinator: true },
            { name: "Diya Sharma", registerNumber: "CC_CS_02", phoneNumber: "9876500002", mailId: "diya@christ.edu", course: "B.Sc CS", department: "Computer Science", class: "2 BSc CS A", gender: "Female", password: "password", isCoordinator: false },
            { name: "Meera Nair", registerNumber: "CC_CS_04", phoneNumber: "9876500004", mailId: "meera@christ.edu", course: "B.Sc CS", department: "Computer Science", class: "2 BSc CS A", gender: "Female", password: "password", isCoordinator: false },
            { name: "Siddharth V", registerNumber: "CC_CM_01", phoneNumber: "9876500005", mailId: "sid@christ.edu", course: "B.Com", department: "Commerce", class: "3 BCom B", gender: "Male", password: "password", isCoordinator: false },
            { name: "Ananya S", registerNumber: "CC_CM_04", phoneNumber: "9876500008", mailId: "ananya@christ.edu", course: "B.Com", department: "Commerce", class: "3 BCom B", gender: "Female", password: "password", isCoordinator: false }
        ];

        this.cache.teachers = [
            { name: "Dr. Mahesh Kumar", phoneNumber: "9876599999", mailId: "mahesh@christ.edu", department: "Computer Science", password: "password", isCoordinator: true },
            { name: "Prof. Priya Sen", phoneNumber: "9876588888", mailId: "priya@christ.edu", department: "Commerce", password: "password", isCoordinator: false }
        ];

        this.cache.trainingPrograms = [
            {
                id: 'TRN_001', name: 'Soft Skills Mastery', venue: 'Auditorium', date: '2026-06-01', endDate: '2026-06-05',
                description: '<b>Corporate communication</b> training.', target: { type: 'all' },
                registrations: ['CC_CS_01', 'CC_CS_02', 'CC_CM_01'],
                sessions: [{ id: 'sess_1', date: '2026-06-01', time: '10:00 AM', attendance: ['CC_CS_01', 'CC_CS_02'] }],
                batches: [], feedbacks: []
            }
        ];

        this.cache.placementActivities = [
            {
                id: 'PLC_001', name: 'Google Recruitment', venue: 'Virtual', date: '2026-07-15', lastDate: '2026-07-20',
                description: 'Software Engineer role.', type: 'recruitment', target: { type: 'all' },
                registrations: ['CC_CS_01', 'CC_CS_02'],
                phases: [
                    { id: 'PHS_1', name: 'Technical', completions: ['CC_CS_01', 'CC_CS_02'] },
                    { id: 'PHS_2', name: 'Final', completions: ['CC_CS_01', 'CC_CS_02'] }
                ]
            }
        ];

        this.cache.classIncharges = [
            { className: '1 BCA A', incharge: 'Dr. Mahesh Kumar' },
            { className: '3 BCom B', incharge: 'Prof. Priya Sen' }
        ];
    }
}

// Global Toast System
window.showToast = function(message, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.style.position = 'fixed';
        container.style.bottom = '24px';
        container.style.right = '24px';
        container.style.zIndex = '9999';
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.gap = '8px';
        document.body.appendChild(container);
    }
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <div class="toast-content" style="display:flex; align-items:center; gap:0.75rem;">
            <span class="toast-icon" style="font-size: 1.1rem; line-height: 1;">${type === 'success' ? '✓' : '✕'}</span>
            <span class="toast-msg">${message}</span>
        </div>
    `;
    
    // Toast Styles
    toast.style.background = type === 'success' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
    toast.style.color = '#ffffff';
    toast.style.padding = '12px 24px';
    toast.style.borderRadius = '12px';
    toast.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
    toast.style.fontWeight = '600';
    toast.style.fontSize = '0.875rem';
    toast.style.minWidth = '250px';
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(20px)';
    toast.style.transition = 'transform 250ms cubic-bezier(0.2, 0.8, 0.2, 1), opacity 250ms cubic-bezier(0.2, 0.8, 0.2, 1)';
    
    container.appendChild(toast);
    
    // Force reflow
    toast.offsetHeight;
    
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-20px)';
        setTimeout(() => toast.remove(), 250);
    }, 3000);
};

const db = new Database();
