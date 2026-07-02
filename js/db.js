// db.js
// Handles Google Sheets API integration and local caching

class Database {
    constructor() {
        this.apiUrl = "https://script.google.com/macros/s/AKfycbwdm_zml1owMqdpMzGFIu8UE-hfTBEeJ7adDqrJqGYUtFC7ICEwe9pWE3-8URi0fF24qQ/exec";
        this.cache = {
            students: [],
            teachers: [],
            trainingPrograms: [],
            placementActivities: [],
            exams: [],
            classIncharges: [],
            admin: { username: 'admin', password: 'Admin@1234' }
        };
        this.ready = this.init();
    }

    async init() {
        console.log("Initializing Google Sheets DB...");
        try {
            const response = await fetch(`${this.apiUrl}?action=readAll`);
            const data = await response.json();
            
            if (data) {
                // Map Sheet names to cache keys
                if (data["Students"] && data["Students"].length > 0) this.cache.students = data["Students"];
                if (data["Teacher"] && data["Teacher"].length > 0) this.cache.teachers = data["Teacher"];
                if (data["Training Program"] && data["Training Program"].length > 0) this.cache.trainingPrograms = data["Training Program"];
                if (data["Activity"] && data["Activity"].length > 0) this.cache.placementActivities = data["Activity"];
                if (data["Exams"] && data["Exams"].length > 0) this.cache.exams = data["Exams"];
                if (data["ClassIncharge"] && data["ClassIncharge"].length > 0) this.cache.classIncharges = data["ClassIncharge"];
                
                this.parseCache();

                // If cloud is empty, seed with samples
                if (this.cache.students.length === 0) {
                    console.log("Cloud DB is empty. Seeding sample data...");
                    this.loadSampleData();
                    this.parseCache();
                }

                // Backup to LocalStorage for offline/fast load
                localStorage.setItem('db_cache', JSON.stringify(this.cache));
            }
            return true;
        } catch (error) {
            console.error("Failed to load from Google Sheets, using LocalStorage backup:", error);
            const backup = localStorage.getItem('db_cache');
            if (backup) {
                this.cache = JSON.parse(backup);
                this.parseCache();
            } else {
                console.log("No LocalStorage backup found. Seeding sample data...");
                this.loadSampleData();
                this.parseCache();
                localStorage.setItem('db_cache', JSON.stringify(this.cache));
            }
            return false;
        }
    }

    parseCache() {
        // Parse Students
        if (this.cache.students) {
            this.cache.students = this.cache.students.map(s => {
                let scores = {};
                try {
                    scores = typeof s.scores === 'string' ? JSON.parse(s.scores || '{}') : (s.scores || {});
                } catch(e) {
                    scores = {};
                }
                return {
                    ...s,
                    scores,
                    isCoordinator: s.isCoordinator === true || s.isCoordinator === 'true'
                };
            });
        }
        
        // Parse Teachers
        if (this.cache.teachers) {
            this.cache.teachers = this.cache.teachers.map(t => {
                return {
                    ...t,
                    isCoordinator: t.isCoordinator === true || t.isCoordinator === 'true'
                };
            });
        }

        // Parse Training Programs
        if (this.cache.trainingPrograms) {
            this.cache.trainingPrograms = this.cache.trainingPrograms.map(p => {
                let sessions = [], registrations = [], feedbacks = [], batches = [];
                try { sessions = typeof p.sessions === 'string' ? JSON.parse(p.sessions || '[]') : (p.sessions || []); } catch(e) { sessions = []; }
                try { registrations = typeof p.registrations === 'string' ? JSON.parse(p.registrations || '[]') : (p.registrations || []); } catch(e) { registrations = []; }
                try { feedbacks = typeof p.feedbacks === 'string' ? JSON.parse(p.feedbacks || '[]') : (p.feedbacks || []); } catch(e) { feedbacks = []; }
                try { batches = typeof p.batches === 'string' ? JSON.parse(p.batches || '[]') : (p.batches || []); } catch(e) { batches = []; }
                let target = { type: 'all' };
                try { target = typeof p.target === 'string' ? JSON.parse(p.target || '{"type":"all"}') : (p.target || { type: 'all' }); } catch(e) { target = { type: 'all' }; }
                return {
                    ...p,
                    sessions,
                    registrations,
                    feedbacks,
                    batches,
                    target,
                    isRegistrationOpen: p.isRegistrationOpen === true || p.isRegistrationOpen === 'true' || p.isRegistrationOpen === undefined,
                    isFeedbackOpen: p.isFeedbackOpen === true || p.isFeedbackOpen === 'true'
                };
            });
        }

        // Parse Activities
        if (this.cache.placementActivities) {
            this.cache.placementActivities = this.cache.placementActivities.map(a => {
                let registrations = [], phases = [];
                try { registrations = typeof a.registrations === 'string' ? JSON.parse(a.registrations || '[]') : (a.registrations || []); } catch(e) { registrations = []; }
                try { phases = typeof a.phases === 'string' ? JSON.parse(a.phases || '[]') : (a.phases || []); } catch(e) { phases = []; }
                let target = { type: 'all' };
                try { target = typeof a.target === 'string' ? JSON.parse(a.target || '{"type":"all"}') : (a.target || { type: 'all' }); } catch(e) { target = { type: 'all' }; }
                return {
                    ...a,
                    registrations,
                    phases,
                    target
                };
            });
        }

        // Parse Exams
        if (this.cache.exams) {
            this.cache.exams = this.cache.exams.map(e => {
                let questions = [];
                try { questions = typeof e.questions === 'string' ? JSON.parse(e.questions || '[]') : (e.questions || []); } catch(x) { questions = []; }
                return {
                    ...e,
                    questions
                };
            });
        }
    }

    serializeFields(sheetName, item) {
        if (!item) return item;
        const copy = { ...item };
        if (sheetName === 'Training Program') {
            if (copy.sessions && typeof copy.sessions !== 'string') copy.sessions = JSON.stringify(copy.sessions);
            if (copy.batches && typeof copy.batches !== 'string') copy.batches = JSON.stringify(copy.batches);
            if (copy.registrations && typeof copy.registrations !== 'string') copy.registrations = JSON.stringify(copy.registrations);
            if (copy.target && typeof copy.target !== 'string') copy.target = JSON.stringify(copy.target);
            if (copy.feedbacks && typeof copy.feedbacks !== 'string') copy.feedbacks = JSON.stringify(copy.feedbacks);
        } else if (sheetName === 'Activity') {
            if (copy.registrations && typeof copy.registrations !== 'string') copy.registrations = JSON.stringify(copy.registrations);
            if (copy.phases && typeof copy.phases !== 'string') copy.phases = JSON.stringify(copy.phases);
            if (copy.target && typeof copy.target !== 'string') copy.target = JSON.stringify(copy.target);
        } else if (sheetName === 'Exams') {
            if (copy.questions && typeof copy.questions !== 'string') copy.questions = JSON.stringify(copy.questions);
        } else if (sheetName === 'Students') {
            if (copy.scores && typeof copy.scores !== 'string') copy.scores = JSON.stringify(copy.scores);
        }
        return copy;
    }

    async sync(sheetName, data) {
        try {
            let serializedData = data;
            if (Array.isArray(data)) {
                serializedData = data.map(item => this.serializeFields(sheetName, item));
            } else {
                serializedData = this.serializeFields(sheetName, data);
            }

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                body: JSON.stringify({
                    action: 'save',
                    sheet: sheetName,
                    data: serializedData
                })
            });
            const result = await response.json();
            if (result && !result.success) {
                console.error(`Sync failed for ${sheetName}:`, result.error || result.message);
                return { success: false, message: result.message || 'Sync failed.' };
            }
            // Update local backup
            localStorage.setItem('db_cache', JSON.stringify(this.cache));
            return { success: true, message: 'Synced successfully.' };
        } catch (error) {
            console.error(`Sync failed for ${sheetName}:`, error);
            localStorage.setItem('db_cache', JSON.stringify(this.cache));
            return { success: false, message: 'Sync failed: saved locally.' };
        }
    }

    async deleteRecord(sheetName, id) {
        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                body: JSON.stringify({
                    action: 'delete',
                    sheet: sheetName,
                    id: id
                })
            });
            const result = await response.json();
            if (result && !result.success) {
                console.error(`Delete failed for ${sheetName}:`, result.error || result.message);
                return { success: false, message: result.message || 'Delete failed.' };
            }
            localStorage.setItem('db_cache', JSON.stringify(this.cache));
            return { success: true };
        } catch (error) {
            console.error(`Delete failed for ${sheetName}:`, error);
            localStorage.setItem('db_cache', JSON.stringify(this.cache));
            return { success: false, message: 'Delete failed: removed locally.' };
        }
    }

    // --- Students ---
    getStudents() {
        return this.cache.students;
    }

    addStudent(student) {
        if (this.cache.students.find(s => s.registerNumber === student.registerNumber)) {
            return { success: false, message: 'Student already exists.' };
        }
        this.cache.students.push(student);
        this.sync("Students", student);
        return { success: true, message: 'Student added to Cloud.' };
    }

    updateStudent(regNo, updatedData) {
        const index = this.cache.students.findIndex(s => s.registerNumber === regNo);
        if (index !== -1) {
            this.cache.students[index] = { ...this.cache.students[index], ...updatedData };
            this.sync("Students", this.cache.students[index]);
            return { success: true, message: 'Student updated in Cloud.' };
        }
        return { success: false, message: 'Student not found.' };
    }

    deleteStudent(regNo) {
        this.cache.students = this.cache.students.filter(s => s.registerNumber !== regNo);
        this.deleteRecord("Students", regNo);
        return { success: true, message: 'Student removed from Cloud.' };
    }

    addStudentsBulk(newStudents) {
        const toAdd = [];
        let duplicateCount = 0;

        newStudents.forEach(student => {
            if (this.cache.students.find(s => s.registerNumber === student.registerNumber)) {
                duplicateCount++;
            } else {
                this.cache.students.push(student);
                toAdd.push(student);
            }
        });

        if (toAdd.length > 0) {
            this.sync("Students", toAdd); // Send entire array in one request
        }

        return {
            success: true,
            message: `Bulk upload complete. ${toAdd.length} students synced to Cloud.${duplicateCount > 0 ? ` ${duplicateCount} duplicates skipped.` : ''}`
        };
    }

    saveStudents(students) {
        this.cache.students = students;
        this.sync("Students", students);
        return { success: true };
    }

    // --- Teachers ---
    getTeachers() {
        return this.cache.teachers;
    }

    addTeacher(teacher) {
        this.cache.teachers.push(teacher);
        this.sync("Teacher", teacher);
        return { success: true, message: 'Teacher added to Cloud.' };
    }

    deleteTeacher(phoneNumber) {
        this.cache.teachers = this.cache.teachers.filter(t => t.phoneNumber !== phoneNumber);
        this.deleteRecord("Teacher", phoneNumber);
        return { success: true, message: 'Teacher removed.' };
    }

    saveTeachers(teachers) {
        this.cache.teachers = teachers;
        this.sync("Teacher", teachers);
        return { success: true };
    }

    resetPassword(role, id) {
        if (role === 'student') {
            const index = this.cache.students.findIndex(s => s.registerNumber === id);
            if (index !== -1) {
                this.cache.students[index].password = 'password';
                this.sync("Students", this.cache.students[index]);
                return { success: true, message: "Password reset to 'password' for " + id };
            }
        }
        return { success: false, message: "User not found." };
    }

    // --- Training Programs ---
    getTrainingPrograms() {
        return this.cache.trainingPrograms;
    }

    addTrainingProgram(program) {
        program.id = 'TRN' + Date.now();
        program.registrations = [];
        program.sessions = [];
        program.feedbacks = [];
        this.cache.trainingPrograms.push(program);
        this.sync("Training Program", program);
        return { success: true, message: 'Program created in Cloud.' };
    }

    updateTrainingProgram(id, updatedData) {
        const index = this.cache.trainingPrograms.findIndex(p => p.id === id);
        if (index !== -1) {
            this.cache.trainingPrograms[index] = { ...this.cache.trainingPrograms[index], ...updatedData };
            this.sync("Training Program", this.cache.trainingPrograms[index]);
            return { success: true };
        }
        return { success: false };
    }

    deleteTrainingProgram(id) {
        this.cache.trainingPrograms = this.cache.trainingPrograms.filter(p => p.id !== id);
        this.deleteRecord("Training Program", id);
        return { success: true };
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

    addPlacementActivity(activity) {
        activity.id = 'PLC' + Date.now();
        activity.phases = [];
        activity.registrations = [];
        this.cache.placementActivities.push(activity);
        this.sync("Activity", activity);
        return { success: true };
    }

    updatePlacementActivity(id, updatedData) {
        const index = this.cache.placementActivities.findIndex(a => a.id === id);
        if (index !== -1) {
            this.cache.placementActivities[index] = { ...this.cache.placementActivities[index], ...updatedData };
            this.sync("Activity", this.cache.placementActivities[index]);
            return { success: true };
        }
        return { success: false };
    }

    deletePlacementActivity(id) {
        this.cache.placementActivities = this.cache.placementActivities.filter(a => a.id !== id);
        this.deleteRecord("Activity", id);
        return { success: true };
    }

    // --- Auth & Generic ---
    getAdmin() { return this.cache.admin; }
    
    // --- Seeding ---
    loadSampleData() {
        const students = [
            { name: "Arjun Mehta", registerNumber: "CC_CS_01", phoneNumber: "9876500001", mailId: "arjun@christ.edu", course: "BCA", department: "Computer Science", gender: "Male", password: "password", isCoordinator: true },
            { name: "Diya Sharma", registerNumber: "CC_CS_02", phoneNumber: "9876500002", mailId: "diya@christ.edu", course: "B.Sc CS", department: "Computer Science", gender: "Female", password: "password", isCoordinator: false },
            { name: "Meera Nair", registerNumber: "CC_CS_04", phoneNumber: "9876500004", mailId: "meera@christ.edu", course: "B.Sc CS", department: "Computer Science", gender: "Female", password: "password", isCoordinator: false },
            { name: "Siddharth V", registerNumber: "CC_CM_01", phoneNumber: "9876500005", mailId: "sid@christ.edu", course: "B.Com", department: "Commerce", gender: "Male", password: "password", isCoordinator: false },
            { name: "Ananya S", registerNumber: "CC_CM_04", phoneNumber: "9876500008", mailId: "ananya@christ.edu", course: "B.Com", department: "Commerce", gender: "Female", password: "password", isCoordinator: false }
        ];

        const teachers = [
            { name: "Dr. Mahesh Kumar", phoneNumber: "9876599999", mailId: "mahesh@christ.edu", department: "Computer Science", password: "password", isCoordinator: true },
            { name: "Prof. Priya Sen", phoneNumber: "9876588888", mailId: "priya@christ.edu", department: "Commerce", password: "password", isCoordinator: false }
        ];

        const trainings = [
            {
                id: 'TRN_001', name: 'Soft Skills Mastery', venue: 'Auditorium', date: '2026-06-01', endDate: '2026-06-05',
                description: '<b>Corporate communication</b> training.', target: { type: 'all' },
                registrations: ['CC_CS_01', 'CC_CS_02', 'CC_CM_01'],
                sessions: [{ id: 'sess_1', date: '2026-06-01', time: '10 AM', attendance: ['CC_CS_01', 'CC_CS_02'] }]
            }
        ];

        const activities = [
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

        // Batch upload (Simulated by looping)
        students.forEach(s => this.addStudent(s));
        teachers.forEach(t => this.addTeacher(t));
        trainings.forEach(t => { this.cache.trainingPrograms.push(t); this.sync("Training Program", t); });
        activities.forEach(a => { this.cache.placementActivities.push(a); this.sync("Activity", a); });
    }

    addTrainingSession(programId, date, time, batchId = '', venue = '') {
        const index = this.cache.trainingPrograms.findIndex(p => p.id === programId);
        if (index !== -1) {
            const program = this.cache.trainingPrograms[index];
            program.sessions = typeof program.sessions === 'string' ? JSON.parse(program.sessions) : (program.sessions || []);

            // Format time to 12h for display consistency if it is in 24h format (like "21:24")
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
            this.sync("Training Program", this.cache.trainingPrograms[index]);
            return { success: true, message: 'Session added.' };
        }
        return { success: false, message: 'Program not found.' };
    }

    deleteSession(programId, sessionId) {
        const index = this.cache.trainingPrograms.findIndex(p => p.id === programId);
        if (index !== -1) {
            const program = this.cache.trainingPrograms[index];
            program.sessions = typeof program.sessions === 'string' ? JSON.parse(program.sessions) : (program.sessions || []);
            program.sessions = program.sessions.filter(s => s.id !== sessionId);
            this.sync("Training Program", this.cache.trainingPrograms[index]);
            return { success: true };
        }
        return { success: false };
    }

    updateSession(programId, sessionId, date, time, batchId = '') {
        const index = this.cache.trainingPrograms.findIndex(p => p.id === programId);
        if (index !== -1) {
            const program = this.cache.trainingPrograms[index];
            program.sessions = typeof program.sessions === 'string' ? JSON.parse(program.sessions) : (program.sessions || []);
            const sessionIndex = program.sessions.findIndex(s => s.id === sessionId);
            if (sessionIndex !== -1) {
                program.sessions[sessionIndex].date = date;
                program.sessions[sessionIndex].time = time;
                if (batchId) {
                    program.sessions[sessionIndex].batchId = batchId;
                } else {
                    delete program.sessions[sessionIndex].batchId;
                }
                this.sync("Training Program", this.cache.trainingPrograms[index]);
                return { success: true };
            }
        }
        return { success: false };
    }

    updateSessionAttendance(programId, sessionId, regNumbers) {
        const index = this.cache.trainingPrograms.findIndex(p => p.id === programId);
        if (index !== -1) {
            const program = this.cache.trainingPrograms[index];
            program.sessions = typeof program.sessions === 'string' ? JSON.parse(program.sessions) : (program.sessions || []);
            const sessionIndex = program.sessions.findIndex(s => s.id === sessionId);
            if (sessionIndex !== -1) {
                program.sessions[sessionIndex].attendance = regNumbers;
                this.sync("Training Program", this.cache.trainingPrograms[index]);
                return { success: true, message: `Attendance updated for ${regNumbers.length} students.` };
            }
        }
        return { success: false, message: 'Session not found.' };
    }

    addTrainingBatch(programId, name) {
        const index = this.cache.trainingPrograms.findIndex(p => p.id === programId);
        if (index !== -1) {
            const program = this.cache.trainingPrograms[index];
            program.batches = typeof program.batches === 'string' ? JSON.parse(program.batches) : (program.batches || []);
            const newBatch = {
                id: 'batch_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
                name: name,
                students: []
            };
            program.batches.push(newBatch);
            this.sync("Training Program", this.cache.trainingPrograms[index]);
            return { success: true, message: 'Batch created.' };
        }
        return { success: false, message: 'Program not found.' };
    }

    deleteTrainingBatch(programId, batchId) {
        const index = this.cache.trainingPrograms.findIndex(p => p.id === programId);
        if (index !== -1) {
            const program = this.cache.trainingPrograms[index];
            program.batches = typeof program.batches === 'string' ? JSON.parse(program.batches) : (program.batches || []);
            program.batches = program.batches.filter(b => b.id !== batchId);
            
            // Unassign sessions from this batch
            program.sessions = typeof program.sessions === 'string' ? JSON.parse(program.sessions) : (program.sessions || []);
            program.sessions.forEach(s => {
                if (s.batchId === batchId) {
                    delete s.batchId;
                }
            });

            this.sync("Training Program", this.cache.trainingPrograms[index]);
            return { success: true, message: 'Batch deleted.' };
        }
        return { success: false };
    }

    assignStudentsToBatch(programId, studentRegNos, batchId) {
        const index = this.cache.trainingPrograms.findIndex(p => p.id === programId);
        if (index !== -1) {
            const program = this.cache.trainingPrograms[index];
            program.batches = typeof program.batches === 'string' ? JSON.parse(program.batches) : (program.batches || []);
            
            // Remove students from all other batches
            program.batches.forEach(b => {
                b.students = (b.students || []).filter(regNo => !studentRegNos.includes(regNo));
            });

            // Add students to the target batch if batchId is valid
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

            this.sync("Training Program", this.cache.trainingPrograms[index]);
            return { success: true, message: 'Students assigned to batch successfully.' };
        }
        return { success: false, message: 'Program not found.' };
    }

    autoSplitTrainingBatches(programId, method, value) {
        const index = this.cache.trainingPrograms.findIndex(p => p.id === programId);
        if (index !== -1) {
            const program = this.cache.trainingPrograms[index];
            
            // Ensure registrations and batches are parsed
            const registrations = typeof program.registrations === 'string' ? JSON.parse(program.registrations) : (program.registrations || []);
            if (registrations.length === 0) {
                return { success: false, message: 'No registered students to split.' };
            }

            // Grouping methods: by class or by department (one batch per distinct value)
            if (method === 'by_class' || method === 'by_department') {
                const field = method === 'by_class' ? 'class' : 'department';
                const studentMap = {};
                this.cache.students.forEach(s => { studentMap[s.registerNumber] = s; });
                const groups = {};
                registrations.forEach(regNo => {
                    const s = studentMap[regNo];
                    const key = (s && (s[field] || s[field === 'class' ? 'className' : ''])) ? (s[field]) : 'Unspecified';
                    (groups[key] = groups[key] || []).push(regNo);
                });
                const groupBatches = Object.keys(groups).sort().map((key, i) => ({
                    id: 'batch_' + Date.now() + '_' + i + '_' + Math.random().toString(36).substr(2, 5),
                    name: String(key),
                    students: groups[key]
                }));
                program.batches = groupBatches;
                this.sync("Training Program", this.cache.trainingPrograms[index]);
                return { success: true, message: `Created ${groupBatches.length} batch(es) by ${field}.` };
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

            // Distribute students evenly
            registrations.forEach((regNo, idx) => {
                const batchIdx = idx % numBatches;
                newBatches[batchIdx].students.push(regNo);
            });

            program.batches = newBatches;
            this.sync("Training Program", this.cache.trainingPrograms[index]);
            return { success: true, message: `Successfully split students into ${numBatches} batches.` };
        }
        return { success: false, message: 'Program not found.' };
    }


    // --- MCQ Exams ---
    getExams() {
        return this.cache.exams;
    }

    addExam(exam) {
        exam.id = 'EXM' + Date.now();
        this.cache.exams.push(exam);
        this.sync('Exams', exam);
        return { success: true, id: exam.id };
    }

    updateExam(id, updated) {
        const i = this.cache.exams.findIndex(e => e.id === id);
        if (i !== -1) {
            this.cache.exams[i] = { ...this.cache.exams[i], ...updated };
            this.sync('Exams', this.cache.exams[i]);
            return { success: true };
        }
        return { success: false };
    }

    deleteExam(id) {
        this.cache.exams = this.cache.exams.filter(e => e.id !== id);
        this.deleteRecord('Exams', id);
        return { success: true };
    }

    getClassIncharges() {
        return this.cache.classIncharges || [];
    }

    getClassIncharge(className) {
        const row = (this.cache.classIncharges || []).find(c => c.className === className);
        return row ? row.incharge : '';
    }

    setClassIncharge(className, incharge) {
        this.cache.classIncharges = this.cache.classIncharges || [];
        const index = this.cache.classIncharges.findIndex(c => c.className === className);
        const row = { className, incharge };
        if (index !== -1) {
            this.cache.classIncharges[index] = row;
        } else {
            this.cache.classIncharges.push(row);
        }
        this.sync('ClassIncharge', row);
        return { success: true };
    }

    changePassword(role, id, newPassword) {
        if (role === 'student') {
            const index = this.cache.students.findIndex(s => s.registerNumber === id);
            if (index !== -1) {
                this.cache.students[index].password = newPassword;
                delete this.cache.students[index].forcePasswordReset;
                this.sync("Students", this.cache.students[index]);
                return { success: true, message: 'Password updated successfully.' };
            }
        } else if (role === 'teacher') {
            const index = this.cache.teachers.findIndex(t => t.phoneNumber === id);
            if (index !== -1) {
                this.cache.teachers[index].password = newPassword;
                this.sync("Teacher", this.cache.teachers[index]);
                return { success: true, message: 'Password updated successfully.' };
            }
        }
        return { success: false, message: 'User not found.' };
    }

    registerForPlacement(activityId, regNo) {
        const index = this.cache.placementActivities.findIndex(a => a.id === activityId);
        if (index === -1) return { success: false, message: 'Placement activity not found.' };
        const activity = this.cache.placementActivities[index];
        activity.registrations = activity.registrations || [];
        if (activity.registrations.includes(regNo)) {
            return { success: false, message: 'You are already registered.' };
        }
        activity.registrations.push(regNo);
        this.sync("Activity", activity);
        return { success: true, message: 'Successfully registered for recruitment drive.' };
    }

    togglePhaseCompletion(activityId, phaseId, regNo, isNowComplete) {
        const index = this.cache.placementActivities.findIndex(a => a.id === activityId);
        if (index === -1) return { success: false, message: 'Activity not found.' };
        const activity = this.cache.placementActivities[index];
        activity.phases = activity.phases || [];
        const phaseIndex = activity.phases.findIndex(p => p.id === phaseId);
        if (phaseIndex === -1) return { success: false, message: 'Phase not found.' };
        const phase = activity.phases[phaseIndex];
        phase.completions = phase.completions || [];
        
        if (isNowComplete) {
            // Enforce phase-by-phase qualification
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
            // Eliminate from subsequent phases automatically
            phase.completions = phase.completions.filter(x => x !== regNo);
            for (let i = phaseIndex + 1; i < activity.phases.length; i++) {
                activity.phases[i].completions = (activity.phases[i].completions || []).filter(x => x !== regNo);
            }
        }
        
        this.sync("Activity", activity);
        return { success: true, message: 'Phase qualification updated.' };
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

            const scores = student.scores || {};
            const score = scores[p.id];

            return {
                id: p.id,
                name: p.name,
                isRegistered,
                sessions: studentSessions,
                score: score
            };
        });
    }

    registerForProgram(programId, regNo) {
        const index = this.cache.trainingPrograms.findIndex(p => p.id === programId);
        if (index === -1) return { success: false, message: 'Program not found.' };
        const program = this.cache.trainingPrograms[index];
        program.registrations = program.registrations || [];
        if (program.registrations.includes(regNo)) {
            return { success: false, message: 'You are already registered.' };
        }
        program.registrations.push(regNo);
        this.sync("Training Program", program);
        return { success: true, message: 'Successfully registered for program.' };
    }

    submitTrainingFeedback(programId, regNo, feedback) {
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
        this.sync("Training Program", program);
        return { success: true, message: 'Feedback submitted successfully.' };
    }

    // Store a per-program score for a student (used by MCQ + external marks upload)
    setStudentScore(regNo, programId, score) {
        const idx = this.cache.students.findIndex(s => s.registerNumber === regNo);
        if (idx === -1) return { success: false, message: 'Student not found.' };
        const s = this.cache.students[idx];
        s.scores = (typeof s.scores === 'string') ? JSON.parse(s.scores || '{}') : (s.scores || {});
        s.scores[programId] = score;
        this.sync('Students', s);
        return { success: true };
    }

    validateLogin(username, password, type) {
        if (type === 'admin') {
            const admin = this.cache.admin;
            if (username === admin.username && password === admin.password) {
                return { success: true, user: { name: 'Admin', username } };
            }
            return { success: false, message: 'Invalid admin credentials.' };
        } else if (type === 'teacherCoordinator') {
            const teacher = this.cache.teachers.find(t => t.phoneNumber === username && t.password === password);
            if (teacher) {
                if (teacher.isCoordinator === true || teacher.isCoordinator === 'true') {
                    return { success: true, user: teacher };
                } else {
                    return { success: false, message: 'You do not have Teacher Coordinator privileges.' };
                }
            }
            return { success: false, message: 'Invalid teacher credentials.' };
        } else if (type === 'studentCoordinator') {
            const student = this.cache.students.find(s => s.registerNumber === username && s.password === password);
            if (student) {
                if (student.isCoordinator === true || student.isCoordinator === 'true') {
                    return { success: true, user: student };
                } else {
                    return { success: false, message: 'You do not have Student Coordinator privileges.' };
                }
            }
            return { success: false, message: 'Invalid register number or password.' };
        } else if (type === 'student') {
            const student = this.cache.students.find(s => s.registerNumber === username && s.password === password);
            if (student) return { success: true, user: student };
            return { success: false, message: 'Invalid register number or password.' };
        } else {
            // Keep normal teacher fallback login
            const teacher = this.cache.teachers.find(t => t.phoneNumber === username && t.password === password);
            if (teacher) return { success: true, user: teacher };
            return { success: false, message: 'Invalid credentials.' };
        }
    }
}

const db = new Database();
