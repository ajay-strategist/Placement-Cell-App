// admin.js
// Handles UI logic for Admin Dashboard

document.addEventListener('DOMContentLoaded', async () => {
    // Wait for Google Sheets data to sync
    await db.ready;

    const userRole = sessionStorage.getItem('userRole') || 'admin';
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || '{}');

    // Update UI title and header info
    const sidebarBrand = document.querySelector('.sidebar-brand');
    const userNameEl = document.querySelector('.user-name');
    const userRoleEl = document.querySelector('.user-role');
    const userAvatarEl = document.querySelector('.user-avatar');

    if (userRole === 'studentCoordinator') {
        if (sidebarBrand) {
            sidebarBrand.textContent = 'Coordinator Portal';
            sidebarBrand.href = 'coordinator.html';
        }
        if (userNameEl) userNameEl.textContent = `Welcome, ${currentUser.name || 'Coordinator'}`;
        if (userRoleEl) userRoleEl.textContent = 'Student Coordinator';
        if (userAvatarEl) userAvatarEl.textContent = (currentUser.name || 'C')[0];

        // Hide User Management link from sidebar
        const userMgmtLink = document.querySelector('[data-tab="userManagement"]');
        if (userMgmtLink) {
            userMgmtLink.parentElement.style.display = 'none';
        }

        // Hide add/create buttons
        const addTrnBtn = document.getElementById('toggleAddTrainingBtn');
        if (addTrnBtn) addTrnBtn.style.display = 'none';
        const addPlcBtn = document.getElementById('toggleAddPlacementBtn');
        if (addPlcBtn) addPlcBtn.style.display = 'none';
        const addRecBtn = document.getElementById('toggleAddRecruitmentBtn');
        if (addRecBtn) addRecBtn.style.display = 'none';
        const addPhaseBtn = document.getElementById('addPhaseBtn');
        if (addPhaseBtn) addPhaseBtn.style.display = 'none';

        // Hide admin-only fields like Promote to Coordinator in modals
        document.querySelectorAll('.admin-only-field').forEach(el => el.style.setProperty('display', 'none', 'important'));
    } else if (userRole === 'teacherCoordinator') {
        if (sidebarBrand) {
            sidebarBrand.textContent = 'Teacher Coordinator Portal';
            sidebarBrand.href = 'admin.html';
        }
        if (userNameEl) userNameEl.textContent = `Welcome, ${currentUser.name || 'Coordinator'}`;
        if (userRoleEl) userRoleEl.textContent = 'Teacher Coordinator';
        if (userAvatarEl) userAvatarEl.textContent = (currentUser.name || 'T')[0];

        // Hide Manage Teachers subtab button
        const teacherTabBtn = document.querySelector('[data-subtab="teachersSubTab"]');
        if (teacherTabBtn) teacherTabBtn.style.display = 'none';
        const addTeacherBtn = document.getElementById('toggleAddTeacherBtn');
        if (addTeacherBtn) addTeacherBtn.style.display = 'none';

        // Hide admin-only fields like Promote to Coordinator in modals
        document.querySelectorAll('.admin-only-field').forEach(el => el.style.setProperty('display', 'none', 'important'));
    } else {
        if (sidebarBrand) {
            sidebarBrand.textContent = 'Admin Portal';
            sidebarBrand.href = 'admin.html';
        }
        if (userNameEl) userNameEl.textContent = 'Welcome, Admin';
        if (userRoleEl) userRoleEl.textContent = 'Admin';
        if (userAvatarEl) userAvatarEl.textContent = 'A';
    }

    // --- UI State & Navigation ---
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.dataset.tab;
            const tabContent = document.getElementById(`${tabId}Tab`);
            
            if (!tabContent) return;

            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            tab.classList.add('active');
            tabContent.classList.add('active');

            // Update breadcrumb and title
            const breadcrumb = document.querySelector('.breadcrumb');
            const pageTitle = document.querySelector('.page-title');
            
            const tabName = tab.textContent.trim();
            breadcrumb.textContent = `Portal / ${tabName}`;
            pageTitle.textContent = tabName;

            if(tabId === 'calendar') {
                initCalendarSelectors();
                renderCalendar();
            }
            if(tabId === 'placement') {
                renderPlacementActivities();
            }
            if(tabId === 'dashboard') {
                renderDashboard();
            }
            if(tabId === 'classView') {
                renderClassView();
            }
            if(tabId === 'mcq') {
                renderMCQ();
            }
        });
    });

    // --- Sub-Tab Logic (User Management) ---
    const subTabs = document.querySelectorAll('.sub-tab');
    const subTabContents = document.querySelectorAll('.sub-tab-content');
    
    subTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.dataset.subtab;
            const tabContent = document.getElementById(tabId);
            
            if (!tabContent) return;

            subTabs.forEach(t => t.classList.remove('active'));
            subTabContents.forEach(c => {
                c.classList.remove('active');
                c.classList.add('hidden'); // Add hidden to non-active sub-tabs
            });
            
            tab.classList.add('active');
            tabContent.classList.add('active');
            tabContent.classList.remove('hidden');
        });
    });

    function initCalendarSelectors() {
        const monthSel = document.getElementById('calMonth');
        const yearSel = document.getElementById('calYear');
        if(!monthSel.innerHTML) {
            const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
            monthSel.innerHTML = months.map((m, i) => `<option value="${i}" ${i === new Date().getMonth() ? 'selected' : ''}>${m}</option>`).join('');
            
            const currentYear = new Date().getFullYear();
            for(let y = currentYear - 2; y <= currentYear + 5; y++) {
                yearSel.innerHTML += `<option value="${y}" ${y === currentYear ? 'selected' : ''}>${y}</option>`;
            }
            
            monthSel.addEventListener('change', renderCalendar);
            yearSel.addEventListener('change', renderCalendar);
        }
    }

    // --- Students Management ---
    const toggleAddStudentBtn = document.getElementById('toggleAddStudentBtn');
    const cancelAddStudentBtn = document.getElementById('cancelAddStudentBtn');
    const closeStudentModalBtn = document.getElementById('closeStudentModalBtn');
    const studentModal = document.getElementById('studentModal');
    const addStudentForm = document.getElementById('addStudentForm');
    const adminAlert = document.getElementById('adminAlert');
    const studentModalTitle = document.getElementById('studentModalTitle');
    const saveStudentBtn = document.getElementById('saveStudentBtn');

    if (toggleAddStudentBtn) {
        toggleAddStudentBtn.addEventListener('click', () => {
            editingRegNo = null;
            addStudentForm.reset();
            studentModalTitle.textContent = 'Add New Student';
            saveStudentBtn.textContent = 'Save Student Profile';
            studentModal.classList.remove('hidden');
        });
    }

    if (cancelAddStudentBtn) {
        cancelAddStudentBtn.addEventListener('click', () => {
            studentModal.classList.add('hidden');
            addStudentForm.reset();
        });
    }

    if (closeStudentModalBtn) {
        closeStudentModalBtn.addEventListener('click', () => {
            studentModal.classList.add('hidden');
            addStudentForm.reset();
        });
    }

    addStudentForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        if (!Permissions.can(userRole, 'edit_people')) {
            alert("Permission denied.");
            return;
        }

        const student = {
            name: document.getElementById('sName').value.trim(),
            registerNumber: document.getElementById('sRegNo').value.trim(),
            phoneNumber: document.getElementById('sPhone').value.trim(),
            mailId: document.getElementById('sMail').value.trim(),
            course: document.getElementById('sCourse').value.trim(),
            department: document.getElementById('sDept').value.trim(),
            class: document.getElementById('sClass') ? document.getElementById('sClass').value.trim() : '',
            gender: document.getElementById('sGender').value,
            password: (document.getElementById('sPass').value || 'password').trim(),
            isCoordinator: document.getElementById('sIsCoordinator') ? document.getElementById('sIsCoordinator').checked : false
        };

        if (editingRegNo) {
            let students = db.getStudents();
            const index = students.findIndex(s => s.registerNumber === editingRegNo);
            if (index !== -1) {
                const originalStudent = students[index];
                if (!Permissions.can(userRole, 'manage_users')) {
                    student.isCoordinator = originalStudent.isCoordinator;
                }
                students[index] = { ...originalStudent, ...student };
                db.saveStudents(students);
                showAdminAlert('Student updated successfully', 'success');
            }
            editingRegNo = null;
        } else {
            const result = db.addStudent(student);
            showAdminAlert(result.message, result.success ? 'success' : 'danger');
        }
        
        addStudentForm.reset();
        studentModal.classList.add('hidden');
        renderStudents();
    });

    // Delete Student Global Function
    window.deleteStudent = (regNo) => {
        if (!Permissions.can(userRole, 'edit_people')) {
            alert("Permission denied.");
            return;
        }
        if(confirm('Are you sure you want to delete this student?')) {
            db.deleteStudent(regNo);
            renderStudents();
            showAdminAlert('Student deleted successfully', 'success');
        }
    };

    function renderStudents() {
        const students = db.getStudents();
        const tbody = document.querySelector('#studentsTable tbody');
        
        // Populate Filter Dropdowns
        populateFilters(students);

        const filterCourse = document.getElementById('filterCourse').value;
        const filterDept = document.getElementById('filterDept').value;

        let filteredStudents = students;
        if (filterCourse) {
            filteredStudents = filteredStudents.filter(s => s.course === filterCourse);
        }
        if (filterDept) {
            filteredStudents = filteredStudents.filter(s => s.department === filterDept);
        }

        const searchQuery = document.getElementById('searchStudent').value.toLowerCase();
        if (searchQuery) {
            filteredStudents = filteredStudents.filter(s => 
                s.name.toLowerCase().includes(searchQuery) || 
                s.registerNumber.toLowerCase().includes(searchQuery)
            );
        }

        tbody.innerHTML = '';
        
        if (filteredStudents.length === 0) {
            tbody.innerHTML = `<tr><td colspan="9">
                <div class="empty-state">
                    <svg viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z"/><path d="M7 12h2v5H7zm4-3h2v8h-2zm4-3h2v11h-2z"/></svg>
                    <h5>No Student Records Found</h5>
                    <p style="margin:0;">There are no records matching your query or the list is currently empty.</p>
                </div>
            </td></tr>`;
            return;
        }
        
        filteredStudents.forEach(s => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="font-weight: 400;">${s.registerNumber}</td>
                <td>${s.name} ${s.isCoordinator === true || s.isCoordinator === 'true' ? '<span class="coord-badge">Coord</span>' : ''}</td>
                <td>${s.phoneNumber}</td>
                <td>${s.mailId}</td>
                <td>${s.course}</td>
                <td>${s.department}</td>
                <td>${s.class || '—'}</td>
                <td>${s.gender}</td>
                <td>
                    <div class="d-flex gap-2">
                        <button class="btn btn-secondary btn-sm" onclick="viewStudent('${s.registerNumber}')" title="View">
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>
                        </button>
                        <button class="btn btn-secondary btn-sm" onclick="editStudent('${s.registerNumber}')" title="Edit">
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                        </button>
                        <button class="btn btn-secondary btn-sm" onclick="resetPassword('${s.registerNumber}')" title="Reset Password">
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12.65 10C11.83 7.67 9.61 6 7 6c-3.31 0-6 2.69-6 6s2.69 6 6 6c2.61 0 4.83-1.67 5.65-4H17v4h4v-4h2v-4H12.65zM7 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/></svg>
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="deleteStudent('${s.registerNumber}')" title="Delete">
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="white"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    // Edit Student Function
    let editingRegNo = null;
    window.editStudent = (regNo) => {
        if (!Permissions.can(userRole, 'edit_people')) {
            alert("Permission denied.");
            return;
        }
        const students = db.getStudents();
        const s = students.find(student => student.registerNumber === regNo);
        if (s) {
            editingRegNo = regNo;
            document.getElementById('sName').value = s.name;
            document.getElementById('sRegNo').value = s.registerNumber;
            document.getElementById('sPhone').value = s.phoneNumber;
            document.getElementById('sMail').value = s.mailId;
            document.getElementById('sCourse').value = s.course;
            document.getElementById('sDept').value = s.department;
            if (document.getElementById('sClass')) document.getElementById('sClass').value = s.class || '';
            document.getElementById('sGender').value = s.gender;
            document.getElementById('sPass').value = s.password;

            if (document.getElementById('sIsCoordinator')) {
                document.getElementById('sIsCoordinator').checked = s.isCoordinator === true || s.isCoordinator === 'true';
            }

            studentModal.classList.remove('hidden');
            studentModalTitle.textContent = 'Edit Student Profile';
            saveStudentBtn.textContent = 'Update Student Profile';
        }
    };

    // View Student Function
    window.viewStudent = (regNo) => {
        const students = db.getStudents();
        const s = students.find(std => std.registerNumber === regNo);
        if(s) {
            const container = document.getElementById('studentDetailContent');
            container.innerHTML = `
                <div><label class="small text-muted">Full Name</label><p><strong>${s.name}</strong></p></div>
                <div><label class="small text-muted">Register No</label><p><strong>${s.registerNumber}</strong></p></div>
                <div><label class="small text-muted">Course</label><p><strong>${s.course}</strong></p></div>
                <div><label class="small text-muted">Department</label><p><strong>${s.department}</strong></p></div>
                <div><label class="small text-muted">Phone</label><p><strong>${s.phoneNumber}</strong></p></div>
                <div><label class="small text-muted">Email</label><p><strong>${s.mailId}</strong></p></div>
                <div><label class="small text-muted">Gender</label><p><strong>${s.gender}</strong></p></div>
            `;
            document.getElementById('studentDetailModal').classList.remove('hidden');
        }
    };

    // Toggle password visibility (mask <-> reveal)
    window.togglePw = (el) => {
        const code = el.querySelector('code');
        if (!code) return;
        if (el.dataset.shown === '1') {
            code.textContent = '••••••••';
            el.dataset.shown = '0';
        } else {
            code.textContent = el.dataset.pw || '';
            el.dataset.shown = '1';
        }
    };

    // Compute program duration in days (fallback when p.days is missing/invalid)
    window.programDays = (p) => {
        if (p && p.days && !isNaN(p.days) && Number(p.days) > 0) return Number(p.days);
        if (p && p.date && p.endDate) {
            const diff = Math.ceil((new Date(p.endDate) - new Date(p.date)) / 86400000) + 1;
            if (diff > 0) return diff;
        }
        return 1;
    };

    // Compute attendance/completion stats for a training program
    window.programAttendanceStats = (p, threshold = 75) => {
        const sessions = p.sessions || [];
        const batches = p.batches || [];
        const reg = p.registrations || [];
        const batchOf = (regNo) => {
            const b = batches.find(b => (b.students || []).includes(regNo));
            return b ? b.id : '';
        };
        let attended = 0, completed = 0;
        reg.forEach(regNo => {
            const bid = batchOf(regNo);
            const applicable = sessions.filter(s => !s.batchId || s.batchId === bid);
            const att = applicable.filter(s => (s.attendance || []).includes(regNo)).length;
            const pct = applicable.length ? Math.round(att / applicable.length * 100) : 0;
            if (att > 0) attended++;
            if (att > 0 && pct >= threshold) completed++;
        });
        return { registered: reg.length, attended, notAttended: reg.length - attended, completed };
    };

    // Reset Password Function
    window.resetPassword = (regNo) => {
        if (!Permissions.can(userRole, 'edit_people')) {
            alert("Permission denied.");
            return;
        }
        if(confirm(`Are you sure you want to reset password for student ${regNo}? They will be forced to change it on next login.`)) {
            const result = db.resetPassword('student', regNo);
            if(result.success) {
                showAdminAlert(result.message, 'success');
            }
        }
    };

    const filterCourseEl = document.getElementById('filterCourse');
    const filterDeptEl = document.getElementById('filterDept');
    const searchStudentEl = document.getElementById('searchStudent');
    const searchTeacherEl = document.getElementById('searchTeacher');
    const resetFiltersBtn = document.getElementById('resetFiltersBtn');

    if(filterCourseEl) filterCourseEl.addEventListener('change', renderStudents);
    if(filterDeptEl) filterDeptEl.addEventListener('change', renderStudents);
    if(searchStudentEl) searchStudentEl.addEventListener('input', renderStudents);
    if(searchTeacherEl) searchTeacherEl.addEventListener('input', renderTeachers);
    
    if(resetFiltersBtn) {
        resetFiltersBtn.addEventListener('click', () => {
            filterCourseEl.value = '';
            filterDeptEl.value = '';
            searchStudentEl.value = '';
            renderStudents();
        });
    }

    function populateFilters(students) {
        const courses = [...new Set(students.map(s => s.course))].sort();
        const depts = [...new Set(students.map(s => s.department))].sort();

        const currentCourse = filterCourseEl.value;
        const currentDept = filterDeptEl.value;

        filterCourseEl.innerHTML = '<option value="">All Courses</option>' + 
            courses.map(c => `<option value="${c}" ${c === currentCourse ? 'selected' : ''}>${c}</option>`).join('');
        
        filterDeptEl.innerHTML = '<option value="">All Departments</option>' + 
            depts.map(d => `<option value="${d}" ${d === currentDept ? 'selected' : ''}>${d}</option>`).join('');
    }

    // --- Excel Upload & Template (SheetJS) ---
    const downloadTemplateBtn = document.getElementById('downloadTemplateBtn');
    const uploadExcelBtn = document.getElementById('uploadExcelBtn');
    const bulkUploadFile = document.getElementById('bulkUploadFile');
    const toggleBulkUploadBtn = document.getElementById('toggleBulkUploadBtn');
    const bulkUploadSection = document.getElementById('bulkUploadSection');

    if(toggleBulkUploadBtn) {
        toggleBulkUploadBtn.addEventListener('click', () => {
            bulkUploadSection.classList.toggle('hidden');
        });
    }

    downloadTemplateBtn.addEventListener('click', () => {
        // Create an empty worksheet with headers
        const wsData = [
            ["Name", "Phone Number", "Mail ID", "Register Number", "Course", "Department", "Class", "Gender", "Password"],
            ["John Doe", "9876543210", "john@example.com", "REG001", "BSc Computer Science", "Science", "1 BCA A", "Male", "pass123"]
        ];
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Students Template");
        
        // Generate Excel file and trigger download
        XLSX.writeFile(wb, "Student_Upload_Template.xlsx");
    });

    uploadExcelBtn.addEventListener('click', () => {
        const file = bulkUploadFile.files[0];
        if (!file) {
            showAdminAlert('Please select an Excel file first.', 'danger');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                
                // Convert to JSON
                const jsonData = XLSX.utils.sheet_to_json(worksheet);
                
                if (jsonData.length === 0) {
                    showAdminAlert('The uploaded Excel file is empty.', 'danger');
                    return;
                }

                // Map JSON headers to our object properties
                // Expected headers from Template: Name, Phone Number, Mail ID, Register Number, Course, Department, Gender, Password
                const newStudents = jsonData.map(row => ({
                    name: row['Name'] ? String(row['Name']).trim() : '',
                    phoneNumber: row['Phone Number'] ? String(row['Phone Number']).trim() : '',
                    mailId: row['Mail ID'] ? String(row['Mail ID']).trim() : '',
                    registerNumber: row['Register Number'] ? String(row['Register Number']).trim() : '',
                    course: row['Course'] ? String(row['Course']).trim() : '',
                    department: row['Department'] ? String(row['Department']).trim() : '',
                    class: row['Class'] ? String(row['Class']).trim() : '',
                    gender: row['Gender'] ? String(row['Gender']).trim() : '',
                    password: row['Password'] ? String(row['Password']).trim() : 'password'
                })).filter(s => s.registerNumber && s.name); // Removed password requirement from filter

                if (newStudents.length === 0) {
                    showAdminAlert('No valid records found. Ensure columns match the template.', 'danger');
                    return;
                }

                const result = db.addStudentsBulk(newStudents);
                showAdminAlert(result.message, result.success ? 'success' : 'danger');
                
                if (result.success) {
                    bulkUploadFile.value = ''; // Reset file input
                    bulkUploadSection.classList.add('hidden'); // Hide upload section after success
                    renderStudents();
                }

            } catch (error) {
                console.error(error);
                showAdminAlert('Error processing Excel file. Ensure it is a valid .xlsx format.', 'danger');
            }
        };
        reader.readAsArrayBuffer(file);
    });

    function showAdminAlert(message, type) {
        adminAlert.textContent = message;
        adminAlert.className = `alert alert-${type} mb-3`;
        adminAlert.classList.remove('hidden');
        setTimeout(() => adminAlert.classList.add('hidden'), 5000);
    }


    const toggleAddTeacherBtn = document.getElementById('toggleAddTeacherBtn');
    const cancelAddTeacherBtn = document.getElementById('cancelAddTeacherBtn');
    const closeTeacherModalBtn = document.getElementById('closeTeacherModalBtn');
    const teacherModal = document.getElementById('teacherModal');
    const addTeacherForm = document.getElementById('addTeacherForm');
    const teacherAlert = document.getElementById('teacherAlert');
    const teacherModalTitle = document.getElementById('teacherModalTitle');
    const saveTeacherBtn = document.getElementById('saveTeacherBtn');

    if (toggleAddTeacherBtn) {
        toggleAddTeacherBtn.addEventListener('click', () => {
            editingTeacherPhone = null;
            addTeacherForm.reset();
            teacherModalTitle.textContent = 'Add New Teacher';
            saveTeacherBtn.textContent = 'Save Teacher';
            teacherModal.classList.remove('hidden');
        });
    }

    if (cancelAddTeacherBtn) {
        cancelAddTeacherBtn.addEventListener('click', () => {
            teacherModal.classList.add('hidden');
            addTeacherForm.reset();
        });
    }

    if (closeTeacherModalBtn) {
        closeTeacherModalBtn.addEventListener('click', () => {
            teacherModal.classList.add('hidden');
            addTeacherForm.reset();
        });
    }

    addTeacherForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        if (!Permissions.can(userRole, 'edit_teachers')) {
            alert("Permission denied.");
            return;
        }

        const teacher = {
            name: document.getElementById('tName').value.trim(),
            phoneNumber: document.getElementById('tPhone').value.trim(),
            mailId: document.getElementById('tMail').value.trim(),
            department: document.getElementById('tDept').value.trim(),
            password: document.getElementById('tPass').value,
            isCoordinator: document.getElementById('tIsCoordinator') ? document.getElementById('tIsCoordinator').checked : false
        };

        if (editingTeacherPhone) {
            let teachers = db.getTeachers();
            const index = teachers.findIndex(t => t.phoneNumber === editingTeacherPhone);
            if (index !== -1) {
                const originalTeacher = teachers[index];
                if (!Permissions.can(userRole, 'manage_users')) {
                    teacher.isCoordinator = originalTeacher.isCoordinator;
                }
                teachers[index] = { ...originalTeacher, ...teacher };
                db.saveTeachers(teachers);
                showTeacherAlert('Teacher updated successfully', 'success');
            }
            editingTeacherPhone = null;
        } else {
            const result = db.addTeacher(teacher);
            showTeacherAlert(result.message, result.success ? 'success' : 'danger');
        }
        
        addTeacherForm.reset();
        teacherModal.classList.add('hidden');
        renderTeachers();
    });

    window.deleteTeacher = (phoneNo) => {
        if (!Permissions.can(userRole, 'edit_teachers')) {
            alert("Permission denied.");
            return;
        }
        if(confirm('Are you sure you want to delete this teacher?')) {
            db.deleteTeacher(phoneNo);
            renderTeachers();
            showTeacherAlert('Teacher deleted successfully', 'success');
        }
    };

    function renderTeachers() {
        const teachers = db.getTeachers();
        const tbody = document.querySelector('#teachersTable tbody');
        
        const searchQuery = document.getElementById('searchTeacher').value.toLowerCase();
        let filteredTeachers = teachers;
        if (searchQuery) {
            filteredTeachers = filteredTeachers.filter(t => 
                t.name.toLowerCase().includes(searchQuery) || 
                t.phoneNumber.toLowerCase().includes(searchQuery)
            );
        }

        tbody.innerHTML = '';
        
        if (filteredTeachers.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5">
                <div class="empty-state">
                    <svg viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z"/><path d="M7 12h2v5H7zm4-3h2v8h-2zm4-3h2v11h-2z"/></svg>
                    <h5>No Teacher Records Found</h5>
                    <p style="margin:0;">There are no records matching your query or the list is currently empty.</p>
                </div>
            </td></tr>`;
            return;
        }
        
        const canEdit = Permissions.can(userRole, 'edit_teachers');
        filteredTeachers.forEach(t => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${t.name}</strong> ${t.isCoordinator === true || t.isCoordinator === 'true' ? '<span class="coord-badge">Coord</span>' : ''}</td>
                <td>${t.phoneNumber}</td>
                <td>${t.mailId}</td>
                <td>${t.department}</td>
                <td>
                    ${canEdit ? `
                    <div class="d-flex gap-2">
                        <button class="btn btn-secondary btn-sm" onclick="editTeacher('${t.phoneNumber}')" title="Edit">
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                        </button>
                        <button class="btn btn-secondary btn-sm" onclick="resetTeacherPassword('${t.phoneNumber}')" title="Reset Password">
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12.65 10C11.83 7.67 9.61 6 7 6c-3.31 0-6 2.69-6 6s2.69 6 6 6c2.61 0 4.83-1.67 5.65-4H17v4h4v-4h2v-4H12.65zM7 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/></svg>
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="deleteTeacher('${t.phoneNumber}')" title="Delete">
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="white"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                        </button>
                    </div>
                    ` : '<span class="text-muted small">view only</span>'}
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    // Edit Teacher Function
    let editingTeacherPhone = null;
    window.editTeacher = (phoneNo) => {
        if (!Permissions.can(userRole, 'edit_teachers')) {
            alert("Permission denied.");
            return;
        }
        const teachers = db.getTeachers();
        const t = teachers.find(teacher => teacher.phoneNumber === phoneNo);
        if(t) {
            editingTeacherPhone = phoneNo;
            document.getElementById('tName').value = t.name;
            document.getElementById('tPhone').value = t.phoneNumber;
            document.getElementById('tMail').value = t.mailId;
            document.getElementById('tDept').value = t.department;
            document.getElementById('tPass').value = t.password;

            if (document.getElementById('tIsCoordinator')) {
                document.getElementById('tIsCoordinator').checked = t.isCoordinator === true || t.isCoordinator === 'true';
            }
            
            teacherModal.classList.remove('hidden');
            teacherModalTitle.textContent = 'Edit Teacher Record';
            saveTeacherBtn.textContent = 'Update Teacher';
        }
    };

    // Reset Teacher Password
    window.resetTeacherPassword = (phoneNo) => {
        if (!Permissions.can(userRole, 'edit_teachers')) {
            alert("Permission denied.");
            return;
        }
        if(confirm(`Reset password for teacher ${phoneNo}?`)) {
            let teachers = db.getTeachers();
            const index = teachers.findIndex(t => t.phoneNumber === phoneNo);
            if(index !== -1) {
                teachers[index].password = "Teacher@123";
                db.saveTeachers(teachers);
                showTeacherAlert(`Password reset to 'Teacher@123' for ${phoneNo}`, 'success');
            }
        }
    };

    function showTeacherAlert(message, type) {
        teacherAlert.textContent = message;
        teacherAlert.className = `alert alert-${type} mb-3`;
        teacherAlert.classList.remove('hidden');
        setTimeout(() => teacherAlert.classList.add('hidden'), 5000);
    }

    // --- Training Management ---
    const toggleAddTrainingBtn = document.getElementById('toggleAddTrainingBtn');
    const cancelAddTrainingBtn = document.getElementById('cancelAddTrainingBtn');
    const trainingModal = document.getElementById('trainingModal');
    const closeTrainingModalBtn = document.getElementById('closeTrainingModalBtn');
    const trainingModalTitle = document.getElementById('trainingModalTitle');
    const saveTrainingBtn = document.getElementById('saveTrainingBtn');
    const addTrainingForm = document.getElementById('addTrainingForm');
    const trainingAlert = document.getElementById('trainingAlert');
    const courseFilterSection = document.getElementById('courseFilterSection');
    const deptFilterSection = document.getElementById('deptFilterSection');
    const targetTypeRadios = document.querySelectorAll('input[name="targetType"]');

    if (toggleAddTrainingBtn) {
        toggleAddTrainingBtn.addEventListener('click', () => {
            editingProgramId = null;
            addTrainingForm.reset();
            document.getElementById('trnDesc').innerHTML = '';
            trainingModalTitle.textContent = 'Create New Training Program';
            saveTrainingBtn.textContent = 'Create Program';
            trainingModal.classList.remove('hidden');
            populateTrainingFilters();
        });
    }

    if (cancelAddTrainingBtn) {
        cancelAddTrainingBtn.addEventListener('click', () => {
            trainingModal.classList.add('hidden');
            addTrainingForm.reset();
            document.getElementById('trnDesc').innerHTML = '';
        });
    }

    if (closeTrainingModalBtn) {
        closeTrainingModalBtn.addEventListener('click', () => {
            trainingModal.classList.add('hidden');
            addTrainingForm.reset();
            document.getElementById('trnDesc').innerHTML = '';
        });
    }

    targetTypeRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            courseFilterSection.classList.add('hidden');
            deptFilterSection.classList.add('hidden');
            
            if (radio.value === 'course') {
                courseFilterSection.classList.remove('hidden');
            } else if (radio.value === 'dept') {
                deptFilterSection.classList.remove('hidden');
            }
        });
    });

    const trnDate = document.getElementById('trnDate');
    const trnEndDate = document.getElementById('trnEndDate');
    const trnDays = document.getElementById('trnDays');

    function calculateDays() {
        if (trnDate.value && trnEndDate.value) {
            const start = new Date(trnDate.value);
            const end = new Date(trnEndDate.value);
            const diffTime = end - start;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
            trnDays.value = diffDays > 0 ? diffDays : 0;
        }
    }

    if(trnDate) trnDate.addEventListener('change', calculateDays);
    if(trnEndDate) trnEndDate.addEventListener('change', calculateDays);

    function populateTrainingFilters() {
        const students = db.getStudents();
        const courses = [...new Set(students.map(s => s.course))].sort();
        const depts = [...new Set(students.map(s => s.department))].sort();

        const courseList = document.getElementById('trnCourseList');
        const deptList = document.getElementById('trnDeptList');

        courseList.innerHTML = courses.map(c => `
            <div class="d-flex align-items-center gap-2 mb-1">
                <input type="checkbox" name="targetCourses" value="${c}" id="c_${c.replace(/\s+/g, '_')}">
                <label for="c_${c.replace(/\s+/g, '_')}" class="small mb-0" style="cursor: pointer;">${c}</label>
            </div>
        `).join('') || '<p class="text-muted small">No courses found</p>';

        deptList.innerHTML = depts.map(d => `
            <div class="d-flex align-items-center gap-2 mb-1">
                <input type="checkbox" name="targetDepts" value="${d}" id="d_${d.replace(/\s+/g, '_')}">
                <label for="d_${d.replace(/\s+/g, '_')}" class="small mb-0" style="cursor: pointer;">${d}</label>
            </div>
        `).join('') || '<p class="text-muted small">No departments found</p>';
    }

    if (addTrainingForm) {
        addTrainingForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const targetType = document.querySelector('input[name="targetType"]:checked').value;
            const selectedCourses = Array.from(document.querySelectorAll('input[name="targetCourses"]:checked')).map(cb => cb.value);
            const selectedDepts = Array.from(document.querySelectorAll('input[name="targetDepts"]:checked')).map(cb => cb.value);

            const program = {
                name: document.getElementById('trnName').value.trim(),
                venue: document.getElementById('trnVenue').value.trim(),
                date: document.getElementById('trnDate').value,
                days: parseInt(document.getElementById('trnDays').value),
                description: document.getElementById('trnDesc').innerHTML.trim(),
                target: {
                    type: targetType,
                    courses: targetType === 'course' ? selectedCourses : [],
                    depts: targetType === 'dept' ? selectedDepts : []
                },
                endDate: document.getElementById('trnEndDate').value
            };

            if (editingProgramId) {
                const result = db.updateTrainingProgram(editingProgramId, program);
                showTrainingAlert(result.message, result.success ? 'success' : 'danger');
                editingProgramId = null;
            } else {
                const result = db.addTrainingProgram(program);
                showTrainingAlert(result.message, result.success ? 'success' : 'danger');
            }
            
            addTrainingForm.reset();
            document.getElementById('trnDesc').innerHTML = '';
            trainingModal.classList.add('hidden');
            renderTrainingPrograms();
        });
    }

    function renderTrainingPrograms() {
        const programs = db.getTrainingPrograms();
        const tbody = document.querySelector('#trainingTable tbody');
        if(!tbody) return;
        tbody.innerHTML = '';

        if (programs.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center">No programs found.</td></tr>';
            return;
        }

        programs.forEach(p => {
            const tr = document.createElement('tr');
            const st = programAttendanceStats(p);
            tr.innerHTML = `
                <td style="min-width:180px;"><strong>${p.name}</strong><br><div class="small text-muted" style="display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;max-width:240px;">${(p.description || '').replace(/<[^>]*>/g, '')}</div></td>
                <td style="white-space:nowrap;">${p.date}${p.endDate && p.endDate !== p.date ? '<br>to ' + p.endDate : ''}<br><small>${programDays(p)} Days</small></td>
                <td>
                    <small class="${p.isRegistrationOpen ? 'text-success' : 'text-danger'}">${p.isRegistrationOpen ? 'Registration Open' : 'Registration Closed'}</small><br>
                    <small class="${p.isFeedbackOpen ? 'text-success' : 'text-danger'}">${p.isFeedbackOpen ? '💬 Feedback Enabled' : '💬 Feedback Disabled'}</small>
                </td>
                <td class="text-center"><strong style="font-size:1rem;">${st.registered}</strong></td>
                <td class="text-center"><span style="color:#16a34a;font-weight:700;">${st.attended}</span></td>
                <td class="text-center"><span style="color:#dc2626;font-weight:700;">${st.notAttended}</span></td>
                <td class="text-center"><span style="color:#0891b2;font-weight:700;">${st.completed}</span></td>
                <td style="white-space:nowrap; width:1%;">
                    <div class="d-flex gap-1">
                        <button class="btn btn-secondary btn-sm" onclick="location.href='manage-training.html?id=${p.id}'" title="Manage Sessions">Manage</button>
                        ${Permissions.can(userRole, 'edit_training_drives') ? `
                        <button class="btn btn-secondary btn-sm" onclick="editTrainingProgram('${p.id}')" title="Edit Info">
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                        </button>
                        <button class="btn btn-secondary btn-sm" onclick="toggleTrnReg('${p.id}')" title="${p.isRegistrationOpen ? 'Close Registration' : 'Open Registration'}">
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="${p.isRegistrationOpen ? 'M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z' : 'M12 17c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm6-9h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6z'}"/></svg>
                        </button>
                        <button class="btn ${p.isFeedbackOpen ? 'btn-success' : 'btn-secondary'} btn-sm" onclick="toggleFeedback('${p.id}')" title="${p.isFeedbackOpen ? 'Disable Feedback' : 'Enable Feedback'}">
                            💬
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="deleteTrainingProgram('${p.id}')" title="Delete Program">
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="white"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                        </button>
                        ` : ''}
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    let editingProgramId = null;
    window.editTrainingProgram = (id) => {
        const programs = db.getTrainingPrograms();
        const p = programs.find(program => program.id === id);
        if(p) {
            editingProgramId = id;
            document.getElementById('trnName').value = p.name;
            document.getElementById('trnVenue').value = p.venue;
            document.getElementById('trnDate').value = p.date;
            document.getElementById('trnEndDate').value = p.endDate || p.date;
            document.getElementById('trnDays').value = programDays(p);
            document.getElementById('trnDesc').innerHTML = p.description || '';
            
            // Set Target Audience
            const radios = document.querySelectorAll('input[name="targetType"]');
            radios.forEach(r => {
                if(r.value === p.target.type) r.checked = true;
            });
            if(p.target.type === 'course') {
                courseFilterSection.classList.remove('hidden');
                deptFilterSection.classList.add('hidden');
                populateTrainingFilters();
                setTimeout(() => {
                    (p.target.courses || []).forEach(c => {
                        const cb = document.querySelector(`input[name="targetCourses"][value="${c}"]`);
                        if(cb) cb.checked = true;
                    });
                }, 100);
            } else if(p.target.type === 'dept') {
                deptFilterSection.classList.remove('hidden');
                courseFilterSection.classList.add('hidden');
                populateTrainingFilters();
                setTimeout(() => {
                    (p.target.depts || []).forEach(d => {
                        const cb = document.querySelector(`input[name="targetDepts"][value="${d}"]`);
                        if(cb) cb.checked = true;
                    });
                }, 100);
            } else {
                courseFilterSection.classList.add('hidden');
                deptFilterSection.classList.add('hidden');
            }

            trainingModal.classList.remove('hidden');
            trainingModalTitle.textContent = 'Edit Training Program';
            saveTrainingBtn.textContent = 'Update Program';
        }
    };



    window.toggleTrnReg = (id) => {
        const result = db.toggleRegistration(id);
        showTrainingAlert(result.message, 'success');
        renderTrainingPrograms();
    };

    window.toggleFeedback = (id) => {
        const result = db.toggleFeedback(id);
        showTrainingAlert(result.message, 'success');
        renderTrainingPrograms();
    };

    window.deleteTrainingProgram = (id) => {
        if (confirm('Are you sure you want to delete this training program? This will also remove all its sessions and attendance records.')) {
            const result = db.deleteTrainingProgram(id);
            showTrainingAlert(result.message, 'success');
            renderTrainingPrograms();
        }
    };

    window.clearAllTrainingPrograms = () => {
        if (confirm('WARNING: Are you sure you want to delete ALL training programs? This action cannot be undone.')) {
            const result = db.clearAllTrainingPrograms();
            showTrainingAlert(result.message, 'success');
            renderTrainingPrograms();
        }
    };

    window.manageAttendance = (id) => {
        const programs = db.getTrainingPrograms();
        const p = programs.find(program => program.id === id);
        if(!p) return;

        const section = document.getElementById('attendanceSection');
        section.classList.remove('hidden');
        document.getElementById('attendanceTitle').textContent = `Manage: ${p.name}`;
        
        // Populate Day Select
        const daySelect = document.getElementById('attnDay');
        daySelect.innerHTML = '';
        for(let i=1; i<=p.days; i++) {
            daySelect.innerHTML += `<option value="day${i}">Day ${i}</option>`;
        }

        // Show registrations
        const regContainer = document.getElementById('registrationsContainer');
        if (p.registrations.length === 0) {
            regContainer.innerHTML = '<p class="text-muted">No students registered yet.</p>';
        } else {
            const students = db.getStudents();
            const regStudents = students.filter(s => p.registrations.includes(s.registerNumber));
            
            let tableHtml = '<table class="table table-sm"><thead><tr><th>Reg No</th><th>Name</th><th>Dept</th></tr></thead><tbody>';
            regStudents.forEach(s => {
                tableHtml += `<tr><td>${s.registerNumber}</td><td>${s.name}</td><td>${s.department}</td></tr>`;
            });
            tableHtml += '</tbody></table>';
            regContainer.innerHTML = tableHtml;
        }

        // Store active program ID for upload
        section.dataset.activeProgramId = id;
    };

    const uploadAttnBtn = document.getElementById('uploadAttnBtn');
    if (uploadAttnBtn) {
        uploadAttnBtn.addEventListener('click', () => {
            const programId = document.getElementById('attendanceSection').dataset.activeProgramId;
            const day = document.getElementById('attnDay').value;
            const session = document.getElementById('attnSession').value;
            const file = document.getElementById('attnExcelFile').files[0];

            if (!file) {
                alert('Please select an attendance Excel file.');
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                    const jsonData = XLSX.utils.sheet_to_json(firstSheet);
                    
                    // Expecting a column 'Register Number'
                    const regNumbers = jsonData.map(row => String(row['Register Number'] || row['Reg No'] || '').trim()).filter(r => r);
                    
                    if (regNumbers.length === 0) {
                        alert('No register numbers found in Excel. Column header should be "Register Number" or "Reg No".');
                        return;
                    }

                    const result = db.updateAttendance(programId, day, session, regNumbers);
                    if (result.success) {
                        alert(`Attendance for ${day} ${session} uploaded: ${regNumbers.length} students.`);
                        document.getElementById('attnExcelFile').value = '';
                    }
                } catch (err) {
                    console.error(err);
                    alert('Error processing file.');
                }
            };
            reader.readAsArrayBuffer(file);
        });
    }

    function showTrainingAlert(message, type) {
        trainingAlert.textContent = message;
        trainingAlert.className = `alert alert-${type} mb-3`;
        trainingAlert.classList.remove('hidden');
        setTimeout(() => trainingAlert.classList.add('hidden'), 5000);
    }

    function renderCalendar() {
        const container = document.getElementById('calendarContainer');
        const programs = db.getTrainingPrograms();
        
        const monthSel = document.getElementById('calMonth');
        const yearSel = document.getElementById('calYear');
        
        const currentMonth = monthSel.value ? parseInt(monthSel.value) : new Date().getMonth();
        const currentYear = yearSel.value ? parseInt(yearSel.value) : new Date().getFullYear();

        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        
        let html = `
            <div class="calendar-grid" style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 1px; background: #e5e7eb; border: 1px solid #e5e7eb;">
                <div class="cal-day-head" style="background: #f9fafb; padding: 10px; text-align: center; font-weight: 600; font-size: 0.8rem;">Sun</div>
                <div class="cal-day-head" style="background: #f9fafb; padding: 10px; text-align: center; font-weight: 600; font-size: 0.8rem;">Mon</div>
                <div class="cal-day-head" style="background: #f9fafb; padding: 10px; text-align: center; font-weight: 600; font-size: 0.8rem;">Tue</div>
                <div class="cal-day-head" style="background: #f9fafb; padding: 10px; text-align: center; font-weight: 600; font-size: 0.8rem;">Wed</div>
                <div class="cal-day-head" style="background: #f9fafb; padding: 10px; text-align: center; font-weight: 600; font-size: 0.8rem;">Thu</div>
                <div class="cal-day-head" style="background: #f9fafb; padding: 10px; text-align: center; font-weight: 600; font-size: 0.8rem;">Fri</div>
                <div class="cal-day-head" style="background: #f9fafb; padding: 10px; text-align: center; font-weight: 600; font-size: 0.8rem;">Sat</div>
        `;

        const firstDay = new Date(currentYear, currentMonth, 1).getDay();
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

        // Empty slots
        for (let i = 0; i < firstDay; i++) {
            html += `<div style="background: #fff; min-height: 100px;"></div>`;
        }

        // Days
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            
            // Get Training Programs for this day
            const dayPrograms = programs.filter(p => {
                const start = p.date;
                const end = p.endDate || p.date;
                return dateStr >= start && dateStr <= end;
            });

            // Get Placement Activities for this day
            const placements = db.getPlacementActivities();
            const dayPlacements = placements.filter(a => {
                // Show if it's the start date OR the deadline
                return a.date === dateStr || a.lastDate === dateStr;
            });

            html += `
                <div style="background: #fff; min-height: 100px; padding: 5px; border: 0.5px solid #f3f4f6;">
                    <div style="font-size: 0.75rem; font-weight: 600; color: #6b7280; margin-bottom: 5px;">${day}</div>
                    <div class="d-flex flex-column gap-1">
                        <!-- Training Programs (Blue) -->
                        ${dayPrograms.map(p => `
                            <div style="background: #0D6EFC; color: white; font-size: 9px; padding: 2px 4px; border-radius: 4px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; cursor: pointer;" title="Training: ${p.name}" onclick="location.href='manage-training.html?id=${p.id}'">
                                📚 ${p.name}
                            </div>
                        `).join('')}
                        
                        <!-- Placement/Recruitment Activities -->
                        ${dayPlacements.map(a => `
                            <div style="background: ${a.type === 'recruitment' ? '#6366f1' : '#10b981'}; color: white; font-size: 9px; padding: 2px 4px; border-radius: 4px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; cursor: pointer;" title="${a.type === 'recruitment' ? 'Recruitment' : 'Placement'}: ${a.name}" onclick="location.href='manage-placement.html?id=${a.id}'">
                                ${a.type === 'recruitment' ? '🎯' : '💼'} ${a.name} ${a.lastDate === dateStr ? '(Deadline)' : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        html += `</div>`;
        container.innerHTML = html;
    }

    // --- Placement Management ---
    const toggleAddPlacementBtn = document.getElementById('toggleAddPlacementBtn');
    const toggleAddRecruitmentBtn = document.getElementById('toggleAddRecruitmentBtn');
    const cancelAddPlacementBtn = document.getElementById('cancelAddPlacementBtn');
    const placementModal = document.getElementById('placementModal');
    const closePlacementModalBtn = document.getElementById('closePlacementModalBtn');
    const placementModalTitle = document.getElementById('placementModalTitle');
    const savePlacementBtn = document.getElementById('savePlacementBtn');
    const addPlacementForm = document.getElementById('addPlacementForm');
    const placementAlert = document.getElementById('placementAlert');
    const pTargetRadios = document.querySelectorAll('input[name="pTargetType"]');
    const placementTypeFilter = document.getElementById('placementTypeFilter');

    let currentPlacementType = 'placement';

    if(toggleAddPlacementBtn) {
        toggleAddPlacementBtn.addEventListener('click', () => {
            currentPlacementType = 'placement';
            editingPlacementId = null;
            addPlacementForm.reset();
            document.getElementById('pDesc').innerHTML = '';
            placementModalTitle.textContent = 'Create Placement Activity';
            savePlacementBtn.textContent = 'Create Activity';
            placementModal.classList.remove('hidden');
            populatePlacementFilters();
        });
    }

    if(toggleAddRecruitmentBtn) {
        toggleAddRecruitmentBtn.addEventListener('click', () => {
            currentPlacementType = 'recruitment';
            editingPlacementId = null;
            addPlacementForm.reset();
            document.getElementById('pDesc').innerHTML = '';
            placementModalTitle.textContent = 'Create Recruitment Drive';
            savePlacementBtn.textContent = 'Create Recruitment';
            placementModal.classList.remove('hidden');
            populatePlacementFilters();
        });
    }

    if(placementTypeFilter) {
        placementTypeFilter.addEventListener('change', renderPlacementActivities);
    }

    // Sub-tab logic for Placement Activities
    const pSubTabs = document.querySelectorAll('.p-sub-tab');
    pSubTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            pSubTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            document.getElementById('activitySubTab').classList.add('hidden');
            document.getElementById('recruitmentSubTab').classList.add('hidden');
            
            const targetId = tab.getAttribute('data-subtab');
            document.getElementById(targetId).classList.remove('hidden');
        });
    });

    if(cancelAddPlacementBtn) {
        cancelAddPlacementBtn.addEventListener('click', () => {
            placementModal.classList.add('hidden');
            addPlacementForm.reset();
            document.getElementById('pDesc').innerHTML = '';
        });
    }

    if(closePlacementModalBtn) {
        closePlacementModalBtn.addEventListener('click', () => {
            placementModal.classList.add('hidden');
            addPlacementForm.reset();
            document.getElementById('pDesc').innerHTML = '';
        });
    }

    pTargetRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            document.getElementById('pCourseListSection').classList.add('hidden');
            document.getElementById('pDeptListSection').classList.add('hidden');
            document.getElementById('pStudentListSection').classList.add('hidden');
            if(radio.value === 'course') document.getElementById('pCourseListSection').classList.remove('hidden');
            if(radio.value === 'dept') document.getElementById('pDeptListSection').classList.remove('hidden');
            if(radio.value === 'student') document.getElementById('pStudentListSection').classList.remove('hidden');
            populatePlacementFilters();
        });
    });

    function populatePlacementFilters() {
        const students = db.getStudents();
        const courses = [...new Set(students.map(s => s.course))].sort();
        const depts = [...new Set(students.map(s => s.department))].sort();

        document.getElementById('pCourseList').innerHTML = courses.map(c => `
            <div class="d-flex align-items-center gap-2 mb-1 px-2">
                <input type="checkbox" name="pCourses" value="${c}"> <label class="small mb-0">${c}</label>
            </div>
        `).join('');

        document.getElementById('pDeptList').innerHTML = depts.map(d => `
            <div class="d-flex align-items-center gap-2 mb-1 px-2">
                <input type="checkbox" name="pDepts" value="${d}"> <label class="small mb-0">${d}</label>
            </div>
        `).join('');

        document.getElementById('pStudentList').innerHTML = students.map(s => `
            <div class="d-flex align-items-center gap-2 mb-1 px-2">
                <input type="checkbox" name="pStudentSelect" value="${s.registerNumber}"> 
                <label class="small mb-0"><strong>${s.name}</strong> (${s.registerNumber})</label>
            </div>
        `).join('');
    }

    if(addPlacementForm) {
        addPlacementForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const targetType = document.querySelector('input[name="pTargetType"]:checked').value;
            const courses = Array.from(document.querySelectorAll('input[name="pCourses"]:checked')).map(c => c.value);
            const depts = Array.from(document.querySelectorAll('input[name="pDepts"]:checked')).map(d => d.value);
            const selectedStudents = Array.from(document.querySelectorAll('input[name="pStudentSelect"]:checked')).map(s => s.value);

            const activity = {
                name: document.getElementById('pName').value.trim(),
                venue: document.getElementById('pVenue').value.trim(),
                date: document.getElementById('pDate').value,
                lastDate: document.getElementById('pLastDate').value,
                description: document.getElementById('pDesc').innerHTML.trim(),
                type: currentPlacementType,
                target: { type: targetType, courses, depts, students: selectedStudents }
            };

            if (editingPlacementId) {
                const result = db.updatePlacementActivity(editingPlacementId, activity);
                showPlacementAlert(result.message, result.success ? 'success' : 'danger');
                editingPlacementId = null;
            } else {
                const result = db.addPlacementActivity(activity);
                showPlacementAlert(result.message, result.success ? 'success' : 'danger');
            }
            
            addPlacementForm.reset();
            document.getElementById('pDesc').innerHTML = '';
            placementModal.classList.add('hidden');
            renderPlacementActivities();
        });
    }

    function renderPlacementActivities() {
        const activities = db.getPlacementActivities() || [];
        
        const placementList = activities.filter(a => a.type === 'placement' || !a.type);
        const recruitmentList = activities.filter(a => a.type === 'recruitment');

        const actTbody = document.querySelector('#activityTable tbody');
        const recTbody = document.querySelector('#recruitmentTable tbody');
        
        if(actTbody) actTbody.innerHTML = '';
        if(recTbody) recTbody.innerHTML = '';

        const today = new Date().toISOString().split('T')[0];

        const createRow = (a) => {
            let statusLabel = 'Upcoming';
            let statusBadge = 'bg-warning text-dark';
            
            if (a.lastDate && today > a.lastDate) {
                statusLabel = 'Completed';
                statusBadge = 'bg-success';
            } else if (a.date && a.lastDate && today >= a.date && today <= a.lastDate) {
                statusLabel = 'In-Progress';
                statusBadge = 'bg-primary';
            } else if (!a.date || !a.lastDate) {
                statusLabel = 'Unknown';
                statusBadge = 'bg-secondary';
            }

            return `
            <tr>
                <td>
                    <div class="d-flex align-items-center gap-2 mb-1">
                        <span class="badge ${a.type === 'recruitment' ? 'bg-secondary' : 'bg-primary'}" style="font-size: 9px; text-transform: capitalize;">${a.type === 'recruitment' ? 'Recruitment' : 'Activity'}</span>
                        <strong style="color: #111827;">${a.name}</strong>
                    </div>
                    <div class="small text-muted" style="max-height: 40px; overflow: hidden;">${a.description}</div>
                </td>
                <td>Start: ${a.date}<br>Apply by: <span class="text-danger">${a.lastDate}</span></td>
                <td>${a.venue}</td>
                <td>${a.target.type === 'all' ? 'All Students' : (a.target.type === 'course' ? (a.target.courses || []).length + ' Courses' : (a.target.type === 'dept' ? (a.target.depts || []).length + ' Depts' : (a.target.students || []).length + ' Students'))}</td>
                <td><strong class="text-primary">${(a.registrations || []).length}</strong></td>
                <td><span class="badge ${statusBadge}" style="font-size: 11px; padding: 5px 10px;">${statusLabel}</span></td>
                <td>
                    <div class="d-flex gap-1">
                        <button class="btn btn-secondary btn-sm" onclick="openManagePlacementView('${a.id}')" title="Manage Activity">Manage</button>
                        ${Permissions.can(userRole, 'edit_training_drives') ? `
                        <button class="btn btn-secondary btn-sm" onclick="editPlacementActivity('${a.id}')" title="Edit Info">
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="deletePlacementActivity('${a.id}')" title="Delete">
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="white"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                        </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `};

        if (actTbody) {
            if (placementList.length === 0) {
                actTbody.innerHTML = `<tr><td colspan="6" class="text-center">No placement activities found.</td></tr>`;
            } else {
                actTbody.innerHTML = placementList.map(a => createRow(a)).join('');
            }
        }

        if (recTbody) {
            if (recruitmentList.length === 0) {
                recTbody.innerHTML = `<tr><td colspan="6" class="text-center">No recruitments found.</td></tr>`;
            } else {
                recTbody.innerHTML = recruitmentList.map(a => createRow(a)).join('');
            }
        }
    }

    let editingPlacementId = null;
    window.editPlacementActivity = (id) => {
        const activities = db.getPlacementActivities();
        const a = activities.find(item => item.id === id);
        if(a) {
            editingPlacementId = id;
            document.getElementById('pName').value = a.name;
            document.getElementById('pVenue').value = a.venue;
            document.getElementById('pDate').value = a.date;
            document.getElementById('pLastDate').value = a.lastDate;
            document.getElementById('pDesc').innerHTML = a.description;
            
            // Set Target
            const radios = document.querySelectorAll('input[name="pTargetType"]');
            radios.forEach(r => {
                if(r.value === a.target.type) r.checked = true;
            });
            
            document.getElementById('pCourseListSection').classList.add('hidden');
            document.getElementById('pDeptListSection').classList.add('hidden');
            document.getElementById('pStudentListSection').classList.add('hidden');
            if(a.target.type === 'course') {
                document.getElementById('pCourseListSection').classList.remove('hidden');
                populatePlacementFilters();
                setTimeout(() => {
                    (a.target.courses || []).forEach(c => {
                        const cb = document.querySelector(`input[name="pCourses"][value="${c}"]`);
                        if(cb) cb.checked = true;
                    });
                }, 100);
            } else if(a.target.type === 'dept') {
                document.getElementById('pDeptListSection').classList.remove('hidden');
                populatePlacementFilters();
                setTimeout(() => {
                    (a.target.depts || []).forEach(d => {
                        const cb = document.querySelector(`input[name="pDepts"][value="${d}"]`);
                        if(cb) cb.checked = true;
                    });
                }, 100);
            } else if(a.target.type === 'student') {
                document.getElementById('pStudentListSection').classList.remove('hidden');
                populatePlacementFilters();
                setTimeout(() => {
                    (a.target.students || []).forEach(s => {
                        const cb = document.querySelector(`input[name="pStudentSelect"][value="${s}"]`);
                        if(cb) cb.checked = true;
                    });
                }, 100);
            }

            placementModal.classList.remove('hidden');
            placementModalTitle.textContent = 'Edit Placement Activity';
            savePlacementBtn.textContent = 'Update Activity';
        }
    };

    window.deletePlacementActivity = (id) => {
        if(confirm('Are you sure you want to delete this placement activity and all associated data?')) {
            db.deletePlacementActivity(id);
            renderPlacementActivities();
            showPlacementAlert('Activity deleted successfully.', 'success');
        }
    };

    // --- Minimalist Dashboard Implementation ---
    function renderDashboard() {
        if (!document.getElementById('dashTotalStudents')) return;

        const students = db.getStudents() || [];
        const programs = db.getTrainingPrograms() || [];
        const activities = db.getPlacementActivities() || [];
        
        const placementActivities = activities.filter(a => a.type === 'placement' || !a.type);
        const recruitmentActivities = activities.filter(a => a.type === 'recruitment');

        // Top 4 Metrics
        document.getElementById('dashTotalStudents').textContent = students.length;
        document.getElementById('dashTotalTrainings').textContent = programs.length;
        document.getElementById('dashTotalActivities').textContent = placementActivities.length;
        document.getElementById('dashTotalRecruitments').textContent = recruitmentActivities.length;

        // Placement Status Logic
        let placedSet = new Set();
        let inProcessSet = new Set();

        recruitmentActivities.forEach(a => {
            const hasPhases = a.phases && a.phases.length > 0;
            if (hasPhases) {
                const finalPhase = a.phases[a.phases.length - 1];
                (finalPhase.completions || []).forEach(reg => placedSet.add(reg));
                
                a.phases.forEach(ph => {
                    if (ph !== finalPhase) {
                        (ph.completions || []).forEach(reg => {
                            if (!placedSet.has(reg)) inProcessSet.add(reg);
                        });
                    }
                });
            }
            (a.registeredStudents || []).forEach(reg => {
                if (!placedSet.has(reg) && !inProcessSet.has(reg)) {
                    inProcessSet.add(reg);
                }
            });
        });

        // Setup Placed Students Table
        function renderDashboardPlacedTable() {
            const tableBody = document.querySelector('#dashboardPlacedTable tbody');
            if (!tableBody) return;

            const courseFilter = document.getElementById('dashFilterCourse').value;
            const deptFilter = document.getElementById('dashFilterDept').value;

            let filteredStudents = students;
            if (courseFilter) filteredStudents = filteredStudents.filter(s => s.course === courseFilter);
            if (deptFilter) filteredStudents = filteredStudents.filter(s => s.department === deptFilter);

            const studentPlacementMap = {};
            const studentActivitiesCount = {};
            const studentRecruitmentsCount = {};

            activities.forEach(a => {
                (a.registrations || []).forEach(reg => {
                    if (a.type === 'recruitment') {
                        studentRecruitmentsCount[reg] = (studentRecruitmentsCount[reg] || 0) + 1;
                    } else {
                        studentActivitiesCount[reg] = (studentActivitiesCount[reg] || 0) + 1;
                    }
                });
                
                if (a.phases && a.phases.length > 0) {
                    const finalPhase = a.phases[a.phases.length - 1];
                    (finalPhase.completions || []).forEach(reg => {
                        if (!studentPlacementMap[reg]) studentPlacementMap[reg] = [];
                        if (!studentPlacementMap[reg].includes(a.name)) studentPlacementMap[reg].push(a.name);
                    });
                }
            });

            const placedStudentsData = filteredStudents.filter(s => studentPlacementMap[s.registerNumber]).map(s => {
                return {
                    name: s.name,
                    department: s.department,
                    course: s.course,
                    activities: studentActivitiesCount[s.registerNumber] || 0,
                    recruitments: studentRecruitmentsCount[s.registerNumber] || 0,
                    placedRecruitment: studentPlacementMap[s.registerNumber].join(', ')
                };
            });

            tableBody.innerHTML = '';
            if (placedStudentsData.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4">No placed students found matching filters.</td></tr>';
                return;
            }

            placedStudentsData.forEach(s => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><strong>${s.name}</strong></td>
                    <td>${s.department}</td>
                    <td>${s.course}</td>
                    <td><span class="badge bg-primary" style="font-size: 11px;">${s.activities}</span></td>
                    <td><span class="badge bg-secondary" style="font-size: 11px;">${s.recruitments}</span></td>
                    <td><span class="badge bg-success" style="font-size: 11px;">${s.placedRecruitment}</span></td>
                `;
                tableBody.appendChild(tr);
            });

            // --- Render Course & Gender Chart ---
            const courseGenderStats = {};
            const placedStudentsRaw = students.filter(s => studentPlacementMap[s.registerNumber]);
            
            placedStudentsRaw.forEach(s => {
                const course = s.course || 'Unknown';
                const gender = (s.gender || 'Other').toLowerCase();
                if (!courseGenderStats[course]) courseGenderStats[course] = { male: 0, female: 0, other: 0 };
                
                if (gender === 'male') courseGenderStats[course].male++;
                else if (gender === 'female') courseGenderStats[course].female++;
                else courseGenderStats[course].other++;
            });

            const labels = Object.keys(courseGenderStats);
            const maleData = labels.map(c => courseGenderStats[c].male);
            const femaleData = labels.map(c => courseGenderStats[c].female);
            const otherData = labels.map(c => courseGenderStats[c].other);

            const cgCtx = document.getElementById('courseGenderChart');
            if (cgCtx) {
                if (window.courseGenderChartInst) window.courseGenderChartInst.destroy();
                window.courseGenderChartInst = new Chart(cgCtx, {
                    type: 'bar',
                    data: {
                        labels: labels,
                        datasets: [
                            {
                                label: 'Male',
                                data: maleData,
                                backgroundColor: '#3b82f6',
                                borderRadius: 4
                            },
                            {
                                label: 'Female',
                                data: femaleData,
                                backgroundColor: '#ec4899',
                                borderRadius: 4
                            },
                            {
                                label: 'Other',
                                data: otherData,
                                backgroundColor: '#f59e0b',
                                borderRadius: 4
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: 'top',
                            },
                            tooltip: {
                                mode: 'index',
                                intersect: false
                            }
                        },
                        scales: {
                            x: {
                                stacked: false,
                                grid: { display: false }
                            },
                            y: {
                                stacked: false,
                                beginAtZero: true,
                                ticks: { stepSize: 1 }
                            }
                        }
                    }
                });
            }
        }

        // Populate Dashboard Filters once
        const dashCourseSelect = document.getElementById('dashFilterCourse');
        const dashDeptSelect = document.getElementById('dashFilterDept');
        const dashActivitySelect = document.getElementById('dashFilterActivity');

        if (dashCourseSelect && dashDeptSelect && dashCourseSelect.options.length <= 1) {
            const courses = [...new Set(students.map(s => s.course).filter(c => c))];
            const depts = [...new Set(students.map(s => s.department).filter(d => d))];
            
            courses.forEach(c => {
                const opt = document.createElement('option');
                opt.value = c; opt.textContent = c;
                dashCourseSelect.appendChild(opt);
            });
            depts.forEach(d => {
                const opt = document.createElement('option');
                opt.value = d; opt.textContent = d;
                dashDeptSelect.appendChild(opt);
            });

            dashCourseSelect.addEventListener('change', renderDashboardPlacedTable);
            dashDeptSelect.addEventListener('change', renderDashboardPlacedTable);
        }

        if (dashActivitySelect && dashActivitySelect.options.length <= 1) {
            activities.forEach(a => {
                const opt = document.createElement('option');
                opt.value = a.id;
                opt.textContent = a.name;
                dashActivitySelect.appendChild(opt);
            });
            
            if(activities.length > 0) {
                dashActivitySelect.value = activities[0].id;
            }

            dashActivitySelect.addEventListener('change', renderActivityAttendanceChart);
        }

        // --- Render Activity Course-wise Attendance Chart ---
        function renderActivityAttendanceChart() {
            const actId = dashActivitySelect ? dashActivitySelect.value : null;
            if (!actId) return;

            const selectedAct = activities.find(a => a.id === actId);
            if (!selectedAct) return;

            const courseCounts = {};
            (selectedAct.registrations || []).forEach(reg => {
                const student = students.find(s => s.registerNumber === reg);
                const course = student && student.course ? student.course : 'Unknown';
                courseCounts[course] = (courseCounts[course] || 0) + 1;
            });

            const labels = Object.keys(courseCounts);
            const data = labels.map(c => courseCounts[c]);

            const ctx = document.getElementById('activityAttendanceChart');
            if (ctx) {
                if (window.activityAttendanceChartInst) window.activityAttendanceChartInst.destroy();
                window.activityAttendanceChartInst = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: labels,
                        datasets: [{
                            label: 'Registered Students',
                            data: data,
                            backgroundColor: '#10b981',
                            borderRadius: 4
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { display: false },
                            tooltip: { mode: 'index', intersect: false }
                        },
                        scales: {
                            y: { beginAtZero: true, ticks: { stepSize: 1 } },
                            x: { grid: { display: false } }
                        }
                    }
                });
            }
        }

        renderDashboardPlacedTable();
        renderActivityAttendanceChart();

        const totalStudents = students.length;
        const placedCount = placedSet.size;
        const inProcessCount = inProcessSet.size;
        const unplacedCount = Math.max(0, totalStudents - placedCount - inProcessCount);

        document.getElementById('dashPlacementTotalText').textContent = `Total: ${totalStudents}`;
        const placementPercent = totalStudents > 0 ? Math.round((placedCount / totalStudents) * 100) : 0;
        document.getElementById('placementPercentText').textContent = `${placementPercent}%`;

        const pCtx = document.getElementById('placementStatusChart');
        if (window.placementChartInst) window.placementChartInst.destroy();
        window.placementChartInst = new Chart(pCtx, {
            type: 'doughnut',
            data: {
                labels: ['Placed Students', 'In Process', 'Unplaced'],
                datasets: [{
                    data: [placedCount, inProcessCount, unplacedCount],
                    backgroundColor: ['#3b82f6', '#10b981', '#f59e0b'],
                    borderWidth: 6,
                    borderColor: '#ffffff',
                    cutout: '80%',
                    borderRadius: 20
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: { enabled: true },
                    datalabels: { display: false }
                }
            }
        });

        // Training Status Logic
        let completedTrainingSet = new Set();
        let attendingTrainingSet = new Set();

        programs.forEach(p => {
            const sessionCount = (p.sessions || []).length;
            if (sessionCount === 0) return;

            const studentAttendance = {};
            p.sessions.forEach(s => {
                (s.attendance || []).forEach(reg => {
                    studentAttendance[reg] = (studentAttendance[reg] || 0) + 1;
                    attendingTrainingSet.add(reg);
                });
            });

            Object.entries(studentAttendance).forEach(([reg, count]) => {
                if (count === sessionCount) {
                    completedTrainingSet.add(reg);
                }
            });
        });

        completedTrainingSet.forEach(reg => attendingTrainingSet.delete(reg));
        const completedTrainCount = completedTrainingSet.size;
        const attendingTrainCount = attendingTrainingSet.size;
        const notAttendingCount = Math.max(0, totalStudents - completedTrainCount - attendingTrainCount);

        document.getElementById('dashTrainingTotalText').textContent = `Total: ${totalStudents}`;
        const trainingPercent = totalStudents > 0 ? Math.round((completedTrainCount / totalStudents) * 100) : 0;
        document.getElementById('trainingPercentText').textContent = `${trainingPercent}%`;

        const tCtx = document.getElementById('trainingStatusChart');
        if (window.trainingChartInst) window.trainingChartInst.destroy();
        window.trainingChartInst = new Chart(tCtx, {
            type: 'doughnut',
            data: {
                labels: ['Attending Trainings', 'Completed Trainings', 'Not Attending'],
                datasets: [{
                    data: [attendingTrainCount, completedTrainCount, notAttendingCount],
                    backgroundColor: ['#3b82f6', '#10b981', '#f59e0b'],
                    borderWidth: 6,
                    borderColor: '#ffffff',
                    cutout: '80%',
                    borderRadius: 20
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: { enabled: true },
                    datalabels: { display: false }
                }
            }
        });
    }

    // ==========================================
    // --- Manage Placement Sub-View Logic ---
    // ==========================================
    let currentActivityId = null;
    let currentActivity = null;
    let editingPhaseId = null;

    window.openManagePlacementView = (id) => {
        currentActivityId = id;
        const activities = db.getPlacementActivities();
        currentActivity = activities.find(a => a.id === id);
        
        if (!currentActivity) return;

        document.getElementById('placementListTabs').classList.add('hidden');
        document.getElementById('placementListView').classList.add('hidden');
        document.getElementById('placementManageView').classList.remove('hidden');

        document.getElementById('manageActivityTitle').textContent = currentActivity.name;

        // Reset to first tab
        const mTabs = document.querySelectorAll('.m-sub-tab');
        const mPages = document.querySelectorAll('.manage-sub-page');
        mTabs.forEach(t => t.classList.remove('active'));
        mPages.forEach(p => p.classList.add('hidden'));
        
        if(mTabs[0]) mTabs[0].classList.add('active');
        const funnelTab = document.getElementById('funnelTab');
        if(funnelTab) funnelTab.classList.remove('hidden');

        renderPhases();
        renderFunnel();
        renderStudentTracking();
    };

    window.closeManagePlacementView = () => {
        currentActivityId = null;
        currentActivity = null;
        document.getElementById('placementListTabs').classList.remove('hidden');
        document.getElementById('placementListView').classList.remove('hidden');
        document.getElementById('placementManageView').classList.add('hidden');
        renderPlacementActivities(); // Refresh list to reflect any changes
    };

    // Tab Logic for Manage View
    const mTabs = document.querySelectorAll('.m-sub-tab');
    const mPages = document.querySelectorAll('.manage-sub-page');
    mTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            mTabs.forEach(t => t.classList.remove('active'));
            mPages.forEach(p => p.classList.add('hidden'));
            
            tab.classList.add('active');
            const tabId = tab.dataset.tab;
            document.getElementById(`${tabId}Tab`).classList.remove('hidden');
        });
    });

    const addPhaseBtn = document.getElementById('addPhaseBtn');
    if(addPhaseBtn) {
        addPhaseBtn.onclick = () => {
            editingPhaseId = null;
            document.getElementById('phaseForm').reset();
            document.getElementById('phaseDesc').innerHTML = '';
            document.getElementById('modalTitle').textContent = 'Add Selection Phase';
            document.getElementById('phaseModal').classList.remove('hidden');
        };
    }

    const phaseForm = document.getElementById('phaseForm');
    if(phaseForm) {
        phaseForm.onsubmit = (e) => {
            e.preventDefault();
            const phase = {
                name: document.getElementById('phaseName').value,
                description: document.getElementById('phaseDesc').innerHTML,
                lastDate: document.getElementById('phaseLastDate').value,
                mode: document.querySelector('input[name="phaseMode"]:checked').value
            };

            if (editingPhaseId) {
                db.updatePlacementPhase(currentActivityId, editingPhaseId, phase);
            } else {
                db.addPlacementPhase(currentActivityId, phase);
            }

            document.getElementById('phaseModal').classList.add('hidden');
            openManagePlacementView(currentActivityId); // Refresh
        };
    }

    window.editPhase = (id) => {
        editingPhaseId = id;
        const p = currentActivity.phases.find(phase => phase.id === id);
        document.getElementById('phaseName').value = p.name;
        document.getElementById('phaseDesc').innerHTML = p.description || '';
        document.getElementById('phaseLastDate').value = p.lastDate;
        const radios = document.querySelectorAll('input[name="phaseMode"]');
        radios.forEach(r => { if(r.value === p.mode) r.checked = true; });

        document.getElementById('modalTitle').textContent = 'Edit Selection Phase';
        document.getElementById('phaseModal').classList.remove('hidden');
    };

    window.deletePhase = (id) => {
        if (confirm('Are you sure you want to delete this phase and all student completion data?')) {
            db.deletePlacementPhase(currentActivityId, id);
            openManagePlacementView(currentActivityId);
        }
    };

    window.openDeclaration = (phaseId) => {
        const phase = currentActivity.phases.find(p => p.id === phaseId);
        document.getElementById('declPhaseName').textContent = `Declare: ${phase.name}`;
        
        const students = db.getStudents();
        const container = document.getElementById('declStudentList');
        container.innerHTML = '';

        const phaseIdx = currentActivity.phases.findIndex(p => p.id === phaseId);
        let pool = [];
        if (phaseIdx === 0) {
            pool = students.filter(s => currentActivity.registrations.includes(s.registerNumber));
        } else {
            const prevPhase = currentActivity.phases[phaseIdx - 1];
            pool = students.filter(s => prevPhase.completions.includes(s.registerNumber));
        }

        pool.forEach(s => {
            const isChecked = phase.completions.includes(s.registerNumber);
            container.innerHTML += `
                <div class="d-flex align-items-center gap-3 p-2 border-bottom hover-bg-light">
                    <input type="checkbox" name="declCheck" value="${s.registerNumber}" ${isChecked ? 'checked' : ''} style="width: 18px; height: 18px;">
                    <div>
                        <div style="font-size: 13px; font-weight: 600;">${s.name}</div>
                        <div class="text-muted" style="font-size: 11px;">${s.registerNumber} | ${s.course}</div>
                    </div>
                </div>
            `;
        });

        document.getElementById('saveDeclarationBtn').onclick = () => {
            const selected = Array.from(document.querySelectorAll('input[name="declCheck"]:checked')).map(cb => cb.value);
            
            pool.forEach(s => {
                const isNowComplete = selected.includes(s.registerNumber);
                db.togglePhaseCompletion(currentActivityId, phaseId, s.registerNumber, isNowComplete);
            });

            document.getElementById('declarationModal').classList.add('hidden');
            openManagePlacementView(currentActivityId);
        };

        document.getElementById('declarationModal').classList.remove('hidden');
    };

    const exportReportBtn = document.getElementById('exportReportBtn');
    if(exportReportBtn) {
        exportReportBtn.onclick = () => {
            if(!window.XLSX) {
                alert("XLSX library not loaded!");
                return;
            }
            const students = db.getStudents();
            const reportData = [];

            const headers = ["Register No", "Name", "Course", "Department", "Registration Status"];
            currentActivity.phases.forEach(p => headers.push(p.name));
            reportData.push(headers);

            const registered = students.filter(s => currentActivity.registrations.includes(s.registerNumber));
            registered.forEach(s => {
                const row = [s.registerNumber, s.name, s.course, s.department, "Registered"];
                currentActivity.phases.forEach(p => {
                    row.push(p.completions.includes(s.registerNumber) ? "QUALIFIED" : "PENDING/DROPPED");
                });
                reportData.push(row);
            });

            reportData.push([]);
            reportData.push(["PHASE DROPOUT SUMMARY"]);
            currentActivity.phases.forEach((p, i) => {
                reportData.push([`Students who DROPPED OUT at: ${p.name}`]);
                let pool = [];
                if (i === 0) {
                    pool = registered;
                } else {
                    const prevPhase = currentActivity.phases[i - 1];
                    pool = registered.filter(s => prevPhase.completions.includes(s.registerNumber));
                }
                
                const dropped = pool.filter(s => !p.completions.includes(s.registerNumber));
                dropped.forEach(s => reportData.push([s.registerNumber, s.name, s.course]));
                reportData.push([]);
            });

            const ws = XLSX.utils.aoa_to_sheet(reportData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Placement Report");
            XLSX.writeFile(wb, `${currentActivity.name.replace(/\s+/g, '_')}_Report.xlsx`);
        };
    }

    function renderPhases() {
        const list = document.getElementById('phasesList');
        if(!list) return;
        list.innerHTML = '';

        if (currentActivity.phases.length === 0) {
            list.innerHTML = '<p class="text-center text-muted py-4">No selection phases defined yet.</p>';
            return;
        }

        currentActivity.phases.forEach((p, idx) => {
            const card = document.createElement('div');
            card.className = 'mb-2 d-flex align-items-center justify-content-between';
            card.style.background = '#fff';
            card.style.borderRadius = '8px';
            card.style.border = '1px solid #e5e7eb';
            card.style.borderLeft = `6px solid ${idx % 2 === 0 ? '#0D6EFC' : '#6c757d'}`;
            card.style.width = '100%';
            card.style.padding = '12px 20px';
            card.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.05)';
            
            card.innerHTML = `
                <div class="d-flex align-items-center w-100">
                    <!-- Column 1: Details -->
                    <div style="flex: 2; padding-right: 15px;">
                        <div class="d-flex align-items-center gap-2 mb-1">
                            <span class="badge bg-primary" style="font-size: 11px; padding: 4px 8px; border-radius: 12px;">Phase ${idx + 1}</span>
                            <strong style="color: #111827; font-size: 14px;">${p.name}</strong>
                        </div>
                        <div class="text-muted" style="font-size: 12px; max-width: 300px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-left: 2px;">${p.description || 'No description'}</div>
                    </div>
                    
                    <!-- Column 2: Mode -->
                    <div style="flex: 1;">
                        <div style="font-size: 10px; font-weight: 700; color: #4b5563; text-transform: uppercase; margin-bottom: 2px;">MODE</div>
                        <div>
                            <span class="badge ${p.mode === 'admin' ? 'bg-secondary' : 'bg-success'}" style="font-weight: 500; font-size: 10px; padding: 4px 8px;">${p.mode === 'admin' ? 'Admin Declaration' : 'Self Declaration'}</span>
                        </div>
                    </div>
                    
                    <!-- Column 3: Deadline -->
                    <div style="flex: 1;">
                        <div style="font-size: 10px; font-weight: 700; color: #4b5563; text-transform: uppercase; margin-bottom: 2px;">DEADLINE</div>
                        <div style="font-size: 13px; font-weight: 500; color: #111827;">${p.lastDate || '—'}</div>
                    </div>
                    
                    <!-- Column 4: Qualified -->
                    <div style="flex: 1;">
                        <div style="font-size: 10px; font-weight: 700; color: #4b5563; text-transform: uppercase; margin-bottom: 2px;">QUALIFIED</div>
                        <div style="font-size: 14px; font-weight: 700; color: #0D6EFC;">${p.completions.length}</div>
                    </div>

                    <!-- Column 5: Actions -->
                    <div class="d-flex gap-2 justify-content-end align-items-center" style="flex: 1.5;">
                        ${p.mode === 'admin' ? `<button class="btn" style="background-color: #000080; color: white; font-weight: 600; font-size: 12px; padding: 6px 12px;" onclick="openDeclaration('${p.id}')">Admin Declaration</button>` : ''}
                        ${Permissions.can(userRole, 'edit_training_drives') ? `
                        <button class="btn btn-light" style="font-weight: 600; border: 1px solid #e5e7eb; font-size: 12px; padding: 6px 12px;" onclick="editPhase('${p.id}')">Edit</button>
                        <button class="btn btn-danger" onclick="deletePhase('${p.id}')" style="font-weight: 600; font-size: 12px; padding: 6px 12px; border: none;">✕</button>
                        ` : ''}
                    </div>
                </div>
            `;
            list.appendChild(card);
        });
    }

    function renderFunnel() {
        const funnel = document.getElementById('funnelChart');
        if(!funnel) return;
        funnel.innerHTML = '';

        const students = db.getStudents();
        const targetedStudents = students.filter(s => {
            const t = currentActivity.target;
            if(t.type === 'all') return true;
            if(t.type === 'course') return (t.courses || []).includes(s.course);
            if(t.type === 'dept') return (t.depts || []).includes(s.department);
            if(t.type === 'student') return (t.students || []).includes(s.registerNumber);
            return false;
        });

        const registrationCount = currentActivity.registrations.length;
        const stages = [
            { name: 'Registrations', count: registrationCount, color: '#1e293b' }
        ];

        currentActivity.phases.forEach((p, idx) => {
            stages.push({
                name: p.name,
                count: p.completions.length,
                color: `hsl(${215}, ${70}%, ${40 + (idx * 10)}%)`
            });
        });

        const maxWidth = 300;
        stages.forEach((stage) => {
            const width = maxWidth * (registrationCount === 0 ? 1 : (stage.count / registrationCount || 0.1));
            const div = document.createElement('div');
            div.className = 'funnel-stage';
            div.style.width = Math.max(width, 100) + 'px';
            div.style.backgroundColor = stage.color;
            div.innerHTML = `
                <span class="funnel-label">${stage.name}</span>
                ${stage.count}
                <span class="funnel-value">${registrationCount === 0 ? '0' : Math.round((stage.count / registrationCount) * 100)}%</span>
            `;
            funnel.appendChild(div);
        });
    }

    function renderStudentTracking() {
        const list = document.getElementById('studentTrackList');
        if(!list) return;
        list.innerHTML = '';
        
        const students = db.getStudents();
        const registered = students.filter(s => currentActivity.registrations.includes(s.registerNumber));

        if (registered.length === 0) {
            list.innerHTML = '<tr><td colspan="4" class="text-center text-muted py-5">No registrations yet for this recruitment drive.</td></tr>';
            return;
        }

        registered.forEach(s => {
            let currentPhaseIdx = -1;
            currentActivity.phases.forEach((p, i) => {
                if (p.completions.includes(s.registerNumber)) currentPhaseIdx = i;
            });

            const isQualified = currentPhaseIdx === currentActivity.phases.length - 1 && currentPhaseIdx !== -1;
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>
                    <div style="font-weight: 600; color: #111827;">${s.name}</div>
                    <div class="text-muted small">${s.registerNumber}</div>
                </td>
                <td>
                    <div class="small">${s.course}</div>
                    <div class="text-muted" style="font-size: 10px;">${s.department}</div>
                </td>
                <td>
                    <span class="badge ${currentPhaseIdx === -1 ? 'bg-light text-dark' : 'bg-primary-light text-primary'}">
                        ${currentPhaseIdx === -1 ? 'Registered' : currentActivity.phases[currentPhaseIdx].name}
                    </span>
                </td>
                <td>
                    <span class="status-pill ${isQualified ? 'status-qualified' : (currentPhaseIdx === -1 ? 'status-dropped' : 'status-pending')}">
                        ${isQualified ? 'Final Qualified' : (currentPhaseIdx === -1 ? 'Pending Start' : 'In Progress')}
                    </span>
                </td>
            `;
            list.appendChild(tr);
        });
    }

    // ==========================================
    // --- Class View (class-wise tracking) ---
    // ==========================================
    function yearFromClass(className) {
        const m = String(className || '').match(/(\d+)/);
        return m ? m[1] : '';
    }

    // Per-student stats across ALL training programs
    function studentTrainingStats(regNo) {
        const programs = db.getTrainingPrograms();
        const details = [];
        let registered = 0, attended = 0, completed = 0;
        programs.forEach(p => {
            if (!(p.registrations || []).includes(regNo)) return;
            registered++;
            const batch = (p.batches || []).find(b => (b.students || []).includes(regNo));
            const bid = batch ? batch.id : '';
            const applicable = (p.sessions || []).filter(s => !s.batchId || s.batchId === bid);
            const att = applicable.filter(s => (s.attendance || []).includes(regNo)).length;
            const pct = applicable.length ? Math.round(att / applicable.length * 100) : 0;
            const isAttended = att > 0;
            const isCompleted = isAttended && pct >= 75;
            if (isAttended) attended++;
            if (isCompleted) completed++;
            details.push({ name: p.name, total: applicable.length, att, pct, attended: isAttended, completed: isCompleted });
        });
        return { registered, attended, notAttended: registered - attended, completed, details };
    }

    function getClassGroups() {
        const students = db.getStudents();
        const courseF = (document.getElementById('classCourseFilter') || {}).value || '';
        const deptF = (document.getElementById('classDeptFilter') || {}).value || '';
        const yearF = (document.getElementById('classYearFilter') || {}).value || '';
        
        const filtered = students.filter(s => {
            if (courseF && s.course !== courseF) return false;
            if (deptF && s.department !== deptF) return false;
            if (yearF && yearFromClass(s.class) !== yearF) return false;
            return s.class && String(s.class).trim();
        });
        
        const groups = {};
        
        // Seed groups with all known classes in db.getClassIncharges()
        const incharges = db.getClassIncharges();
        incharges.forEach(c => {
            if (c.className && String(c.className).trim()) {
                const hasMatch = students.some(s => s.class === c.className && 
                    (!courseF || s.course === courseF) && 
                    (!deptF || s.department === deptF) && 
                    (!yearF || yearFromClass(s.class) === yearF)
                );
                
                if (!courseF && !deptF && !yearF) {
                    groups[c.className] = [];
                } else if (hasMatch) {
                    groups[c.className] = [];
                }
            }
        });

        // Now populate groups with filtered students
        filtered.forEach(s => { 
            groups[s.class] = groups[s.class] || [];
            groups[s.class].push(s); 
        });
        
        return groups;
    }

    window.renderClassView = function () {
        const students = db.getStudents();
        // Populate filters once
        const courseSel = document.getElementById('classCourseFilter');
        const deptSel = document.getElementById('classDeptFilter');
        const yearSel = document.getElementById('classYearFilter');
        if (courseSel && courseSel.options.length <= 1) {
            [...new Set(students.map(s => s.course).filter(Boolean))].sort().forEach(c => courseSel.add(new Option(c, c)));
        }
        if (deptSel && deptSel.options.length <= 1) {
            [...new Set(students.map(s => s.department).filter(Boolean))].sort().forEach(d => deptSel.add(new Option(d, d)));
        }
        if (yearSel && yearSel.options.length <= 1) {
            [...new Set(students.map(s => yearFromClass(s.class)).filter(Boolean))].sort().forEach(y => yearSel.add(new Option('Year ' + y, y)));
        }
        if (courseSel && !courseSel.dataset.bound) { courseSel.dataset.bound = '1'; courseSel.addEventListener('change', renderClassView); deptSel.addEventListener('change', renderClassView); yearSel.addEventListener('change', renderClassView); }

        const groups = getClassGroups();
        const container = document.getElementById('classCards');
        const classNames = Object.keys(groups).sort();
        if (classNames.length === 0) {
            container.innerHTML = '<p class="text-muted">No classes found. Click "+ Create Class" above or add a Class/Section to students to populate this view.</p>';
            return;
        }
        container.innerHTML = classNames.map(cn => {
            const list = groups[cn];
            let reg = 0, att = 0, notAtt = 0;
            list.forEach(s => { const st = studentTrainingStats(s.registerNumber); reg += st.registered; att += st.attended; notAtt += st.notAttended; });
            const incharge = db.getClassIncharge(cn) || '—';
            const safe = cn.replace(/'/g, "\\'");
            return `
                <div class="class-card-premium">
                    <div class="d-flex justify-content-between align-items-start mb-3">
                        <div>
                            <h4 style="margin:0; color:#0f172a; font-weight: 800; font-size:1.15rem; letter-spacing:-0.02em;">${cn}</h4>
                            <small class="text-muted" style="font-size:0.82rem; margin-top:0.25rem; display:block;">Incharge: <strong id="inch_${btoa(cn).replace(/=/g,'')}" style="color:#475569;">${incharge}</strong>
                                <a href="#" onclick="editClassIncharge('${safe}');return false;" style="margin-left:6px; font-size:0.75rem; color:#2563eb; font-weight:600; text-decoration:none;">✏️ edit</a>
                            </small>
                        </div>
                        <span class="badge" style="background:#eff6ff; color:#2563eb; font-weight:700; font-size:0.8rem; padding:6px 12px; border-radius:8px;">${list.length} students</span>
                    </div>
                    <div class="d-flex gap-2 mb-4" style="flex-wrap:wrap;">
                        <span class="status-pill status-qualified" style="background:#ecfdf5; color:#065f46; font-weight:600; border-radius:6px; font-size:0.75rem;">Registered: ${reg}</span>
                        <span class="status-pill status-pending" style="background:#fffbeb; color:#92400e; font-weight:600; border-radius:6px; font-size:0.75rem;">Attended: ${att}</span>
                        <span class="status-pill status-dropped" style="background:#fef2f2; color:#991b1b; font-weight:600; border-radius:6px; font-size:0.75rem;">Not Attended: ${notAtt}</span>
                    </div>
                    <div class="d-flex gap-2">
                        <button class="btn btn-primary btn-sm" onclick="classReport1('${safe}')" style="font-weight:600; border-radius:8px; padding:6px 12px; font-size:0.78rem;">Report 1 · Students</button>
                        <button class="btn btn-secondary btn-sm" onclick="classReport2('${safe}')" style="font-weight:600; border-radius:8px; padding:6px 12px; font-size:0.78rem;">Report 2 · Programs</button>
                    </div>
                </div>`;
        }).join('');
    };

    window.editClassIncharge = function (className) {
        const current = db.getClassIncharge(className) || '';
        const name = prompt(`Class Incharge for "${className}":`, current);
        if (name !== null) {
            db.setClassIncharge(className, name.trim());
            renderClassView();
        }
    };

    window.openCreateClassModal = function() {
        const className = prompt("Enter new Class Name (e.g. 1 BCA A):");
        if (!className || !className.trim()) return;
        
        const incharge = prompt(`Enter Class Incharge Name for "${className.trim()}":`);
        db.setClassIncharge(className.trim(), (incharge || '').trim());
        renderClassView();
    };

    function openClassModal(title, html) {
        document.getElementById('classModalTitle').textContent = title;
        document.getElementById('classModalBody').innerHTML = html;
        document.getElementById('classModal').classList.remove('hidden');
    }

    window.classReport1 = function (className) {
        const groups = getClassGroups();
        const list = groups[className] || [];
        const rows = list.map(s => {
            const st = studentTrainingStats(s.registerNumber);
            const det = st.details.map(d => `${d.name} (${d.pct}%${d.completed ? ', ✓' : ''})`).join('; ') || '—';
            return `<tr>
                <td>${s.registerNumber}</td><td>${s.name}</td>
                <td>${st.registered}</td><td>${st.attended}</td><td>${st.notAttended}</td><td>${st.completed}</td>
                <td style="font-size:0.8rem;color:#475569;">${det}</td>
            </tr>`;
        }).join('');
        openClassModal(`Report 1 — ${className} (Student-wise)`, `
            <div class="table-responsive"><table class="table">
                <thead><tr><th>Reg No</th><th>Name</th><th>Registered</th><th>Attended</th><th>Not Attended</th><th>Completed</th><th>Program Details</th></tr></thead>
                <tbody>${rows || '<tr><td colspan="7" class="text-center text-muted">No students.</td></tr>'}</tbody>
            </table></div>`);
    };

    window.classReport2 = function (className) {
        const groups = getClassGroups();
        const list = groups[className] || [];
        const programs = db.getTrainingPrograms();
        const progOpts = programs.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
        openClassModal(`Report 2 — ${className} (Program-wise)`, `
            <div class="d-flex gap-2 mb-3" style="flex-wrap:wrap;">
                <select id="cr2Program" class="form-control" style="max-width:280px;" onchange="renderClassReport2('${className.replace(/'/g, "\\'")}')">
                    <option value="">Select Program…</option>${progOpts}
                </select>
                <select id="cr2Status" class="form-control" style="max-width:200px;" onchange="renderClassReport2('${className.replace(/'/g, "\\'")}')">
                    <option value="all">All</option>
                    <option value="registered">Registered only</option>
                    <option value="notregistered">Not Registered only</option>
                </select>
            </div>
            <div id="cr2Body"><p class="text-muted">Choose a program to see registration status.</p></div>`);
    };

    window.renderClassReport2 = function (className) {
        const groups = getClassGroups();
        const list = groups[className] || [];
        const pid = document.getElementById('cr2Program').value;
        const status = document.getElementById('cr2Status').value;
        const body = document.getElementById('cr2Body');
        if (!pid) { body.innerHTML = '<p class="text-muted">Choose a program to see registration status.</p>'; return; }
        const p = db.getTrainingPrograms().find(x => x.id === pid);
        const reg = list.filter(s => (p.registrations || []).includes(s.registerNumber));
        const notReg = list.filter(s => !(p.registrations || []).includes(s.registerNumber));
        let ordered = [];
        if (status === 'registered') ordered = reg.map(s => ({ s, r: true }));
        else if (status === 'notregistered') ordered = notReg.map(s => ({ s, r: false }));
        else ordered = [...reg.map(s => ({ s, r: true })), ...notReg.map(s => ({ s, r: false }))]; // registered first
        const rows = ordered.map(({ s, r }) => `<tr>
            <td>${s.registerNumber}</td><td>${s.name}</td>
            <td>${r ? '<span class="status-pill status-qualified">Registered</span>' : '<span class="status-pill status-dropped">Not Registered</span>'}</td>
        </tr>`).join('');
        body.innerHTML = `<div class="table-responsive"><table class="table">
            <thead><tr><th>Reg No</th><th>Name</th><th>Registration Status</th></tr></thead>
            <tbody>${rows || '<tr><td colspan="3" class="text-center text-muted">No students.</td></tr>'}</tbody>
        </table></div>`;
    };

    // ==========================================
    // --- MCQ Exam Engine (admin authoring) ---
    // ==========================================
    const canAuthorExams = (userRole === 'admin' || userRole === 'teacherCoordinator');

    window.renderMCQ = function () {
        // studentCoordinator can view but not create/upload
        const btns = document.getElementById('mcqActionBtns');
        if (btns) btns.style.display = canAuthorExams ? '' : 'none';

        const exams = db.getExams();
        const programs = db.getTrainingPrograms();
        const tbody = document.querySelector('#examTable tbody');
        if (!tbody) return;
        if (exams.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">No exams yet. Click “Create Exam”.</td></tr>';
            return;
        }
        tbody.innerHTML = exams.map(e => {
            const prog = programs.find(p => p.id === e.programId);
            const total = (e.questions || []).reduce((a, q) => a + (Number(q.marks) || 0), 0);
            return `<tr>
                <td><strong>${e.title}</strong></td>
                <td>${prog ? prog.name : '<span class="text-muted">—</span>'}</td>
                <td>${(e.questions || []).length}</td>
                <td>${total}</td>
                <td>${e.passMark}</td>
                <td>${e.duration} min</td>
                <td>${canAuthorExams ? `<button class="btn btn-danger btn-sm" onclick="deleteExam('${e.id}')">Delete</button>` : '<span class="text-muted small">view only</span>'}</td>
            </tr>`;
        }).join('');
    };

    window.openExamBuilder = function () {
        if (!canAuthorExams) { alert('Permission denied.'); return; }
        document.getElementById('exTitle').value = '';
        document.getElementById('exDuration').value = 20;
        document.getElementById('exPass').value = 40;
        document.getElementById('exNeg').value = 0;
        const sel = document.getElementById('exProgram');
        sel.innerHTML = db.getTrainingPrograms().map(p => `<option value="${p.id}">${p.name}</option>`).join('');
        document.getElementById('examQuestions').innerHTML = '';
        addExamQuestion();
        document.getElementById('examModal').classList.remove('hidden');
    };

    window.addExamQuestion = function () {
        const wrap = document.getElementById('examQuestions');
        const idx = wrap.children.length;
        const div = document.createElement('div');
        div.className = 'glass-card mb-3';
        div.dataset.q = idx;
        div.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-2">
                <strong>Q${idx + 1}</strong>
                <button class="btn btn-danger btn-sm" onclick="this.closest('[data-q]').remove()">Remove</button>
            </div>
            <div style="display:grid; grid-template-columns:2fr 1fr 1fr; gap:0.75rem;" class="mb-2">
                <input class="form-control q-text" placeholder="Question text">
                <select class="form-control q-type" onchange="onQTypeChange(this)">
                    <option value="single">Single correct</option>
                    <option value="multiple">Multiple correct</option>
                    <option value="truefalse">True / False</option>
                </select>
                <input class="form-control q-marks" type="number" value="1" min="0" step="0.5" title="Marks">
            </div>
            <div class="q-options"></div>
        `;
        wrap.appendChild(div);
        renderQOptions(div, 'single');
    };

    function renderQOptions(div, type) {
        const box = div.querySelector('.q-options');
        if (type === 'truefalse') {
            box.innerHTML = `
                <label class="d-flex align-items-center gap-2 mb-1"><input type="radio" name="tf_${div.dataset.q}" class="q-correct" value="True" checked> True</label>
                <label class="d-flex align-items-center gap-2"><input type="radio" name="tf_${div.dataset.q}" class="q-correct" value="False"> False</label>`;
        } else {
            const inputType = type === 'multiple' ? 'checkbox' : 'radio';
            let html = '';
            for (let i = 0; i < 4; i++) {
                html += `<div class="d-flex align-items-center gap-2 mb-1">
                    <input type="${inputType}" name="opt_${div.dataset.q}" class="q-correct" value="${i}">
                    <input class="form-control q-opt" placeholder="Option ${i + 1}">
                </div>`;
            }
            box.innerHTML = html + '<small class="text-muted">Tick the correct option(s).</small>';
        }
    }

    window.onQTypeChange = function (sel) {
        renderQOptions(sel.closest('[data-q]'), sel.value);
    };

    window.saveExam = function () {
        const title = document.getElementById('exTitle').value.trim();
        const programId = document.getElementById('exProgram').value;
        if (!title) { alert('Enter an exam title.'); return; }
        const questions = [];
        document.querySelectorAll('#examQuestions [data-q]').forEach(div => {
            const text = div.querySelector('.q-text').value.trim();
            const type = div.querySelector('.q-type').value;
            const marks = Number(div.querySelector('.q-marks').value) || 1;
            if (!text) return;
            let options = [], correct = [];
            if (type === 'truefalse') {
                options = ['True', 'False'];
                const c = div.querySelector('.q-correct:checked');
                correct = [c ? c.value : 'True'];
            } else {
                const optInputs = div.querySelectorAll('.q-opt');
                options = Array.from(optInputs).map(i => i.value.trim()).filter(v => v);
                div.querySelectorAll('.q-correct:checked').forEach(c => {
                    const i = Number(c.value);
                    if (options[i] !== undefined) correct.push(options[i]);
                });
            }
            if (options.length && correct.length) questions.push({ text, type, marks, options, correct });
        });
        if (questions.length === 0) { alert('Add at least one complete question with a correct answer.'); return; }
        db.addExam({
            title, programId,
            duration: Number(document.getElementById('exDuration').value) || 20,
            passMark: Number(document.getElementById('exPass').value) || 0,
            negative: Number(document.getElementById('exNeg').value) || 0,
            questions
        });
        document.getElementById('examModal').classList.add('hidden');
        renderMCQ();
        showMcqAlert('Exam created and assigned to the program’s registered students.', 'success');
    };

    window.deleteExam = function (id) {
        if (!canAuthorExams) return;
        if (confirm('Delete this exam?')) { db.deleteExam(id); renderMCQ(); }
    };

    function showMcqAlert(msg, type) {
        const el = document.getElementById('mcqAlert');
        if (!el) return;
        el.textContent = msg; el.className = `alert alert-${type === 'success' ? 'success' : 'danger'} mb-3`;
        setTimeout(() => el.classList.add('hidden'), 4000);
    }

    // External marks upload (Excel: RegNo + Score, for a chosen program)
    window.openExternalMarks = function () {
        if (!canAuthorExams) { alert('Permission denied.'); return; }
        const progs = db.getTrainingPrograms();
        const opts = progs.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
        const html = `
            <p class="text-muted small">Upload an Excel with columns <strong>Register Number</strong> and <strong>Score</strong>. Scores feed marks-based completion.</p>
            <div class="form-group"><label class="form-label">Training Program</label><select id="emProgram" class="form-control">${opts}</select></div>
            <div class="form-group"><label class="form-label">Excel File</label><input id="emFile" type="file" accept=".xlsx,.xls" class="form-control"></div>
            <button class="btn btn-primary" onclick="processExternalMarks()">Upload Marks</button>`;
        // Reuse class modal as a generic dialog
        document.getElementById('classModalTitle').textContent = 'Upload External Marks';
        document.getElementById('classModalBody').innerHTML = html;
        document.getElementById('classModal').classList.remove('hidden');
    };

    window.processExternalMarks = function () {
        const programId = document.getElementById('emProgram').value;
        const file = document.getElementById('emFile').files[0];
        if (!file) { alert('Choose a file.'); return; }
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const wb = XLSX.read(new Uint8Array(e.target.result), { type: 'array' });
                const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
                let n = 0;
                rows.forEach(r => {
                    const reg = String(r['Register Number'] || r['Reg No'] || r['RegNo'] || '').trim();
                    const score = r['Score'] != null ? Number(r['Score']) : null;
                    if (reg && score != null && !isNaN(score)) { db.setStudentScore(reg, programId, score); n++; }
                });
                document.getElementById('classModal').classList.add('hidden');
                alert(`Uploaded ${n} score(s).`);
            } catch (err) { alert('Could not read file: ' + err.message); }
        };
        reader.readAsArrayBuffer(file);
    };

    // --- Initialization ---
    try {
        if (typeof renderStudents === 'function') renderStudents();
        if (typeof renderTeachers === 'function') renderTeachers();
        if (typeof renderTrainingPrograms === 'function') renderTrainingPrograms();
        if (typeof renderPlacementActivities === 'function') renderPlacementActivities();
        if (typeof renderCalendar === 'function') renderCalendar();
        
        renderDashboard(); // Render dashboard initially
    } catch (error) {
        console.error("Dashboard initialization failed:", error);
    }
});
