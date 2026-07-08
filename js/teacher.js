    // Global profile handlers
    window.openProfile = () => {
        const modal = document.getElementById('teacherProfileModal');
        if (modal) modal.classList.remove('hidden');
    };
    
    window.closeProfile = () => {
        const modal = document.getElementById('teacherProfileModal');
        if (modal) modal.classList.add('hidden');
    };

document.addEventListener('DOMContentLoaded', async () => {
    await db.ready;

    checkAuth('teacher');
    const user = JSON.parse(sessionStorage.getItem('currentUser'));
    const userRole = sessionStorage.getItem('userRole');

    if (!user || userRole !== 'teacher') return;

    // Check for forced password reset
    const teachers = db.getTeachers();
    const currentTeacher = teachers.find(t => t.phoneNumber === user.phoneNumber);
    if (currentTeacher && (currentTeacher.forcePasswordReset || currentTeacher.password === 'password')) {
        const modal = document.getElementById('resetPassModal');
        if (modal) {
            modal.classList.remove('hidden');
            document.getElementById('saveNewPassBtn').onclick = async () => {
                const newPass = document.getElementById('newPass').value;
                const confirmPass = document.getElementById('confirmPass').value;
                if (newPass.length < 6) {
                    alert('Password must be at least 6 characters long.');
                    return;
                }
                if (newPass !== confirmPass) {
                    alert('Passwords do not match.');
                    return;
                }
                const result = await db.changePassword('teacher', user.phoneNumber, newPass);
                if (result.success) {
                    alert('Password updated successfully! Please login again.');
                    logout();
                } else {
                    alert(result.message || 'Error updating password.');
                }
            };
        }
    }

    // Header logic
    const teacherNameEl = document.getElementById('teacherName');
    if (teacherNameEl) teacherNameEl.textContent = `Welcome, ${user.name}`;
    const userRoleEl = document.querySelector('.user-role');
    if (userRoleEl) userRoleEl.textContent = 'Teacher';

    // Fill Profile Modal
    const pDeptEl = document.getElementById('pDept');
    const pPhoneEl = document.getElementById('pPhone');
    const pEmailEl = document.getElementById('pEmail');
    const pNameEl = document.getElementById('pName');
    
    if (pDeptEl) pDeptEl.textContent = user.department || 'N/A';
    if (pPhoneEl) pPhoneEl.textContent = user.phoneNumber || 'N/A';
    if (pEmailEl) pEmailEl.textContent = user.mailId || 'N/A';
    if (pNameEl) pNameEl.textContent = user.name || 'N/A';


    // Tab Switching
    const tabs = document.querySelectorAll('.sidebar-link.tab');
    const tabContents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            tab.classList.add('active');
            const targetId = tab.getAttribute('data-tab') + 'Tab';
            document.getElementById(targetId).classList.add('active');
        });
    });

    // --- Data Calculation for Dashboard (Scoped to Department) ---
    const students = db.getStudents().filter(s => s.department === user.department);
    const totalStudents = students.length;
    document.getElementById('dashTotalStudents').textContent = totalStudents;

    const allTrainings = db.getTrainingPrograms();
    const allActivities = db.getPlacementActivities();
    
    let deptTrainings = 0;
    let deptPlacementActs = 0;
    let deptRecruitments = 0;

    // Check if training targets the department or "all"
    allTrainings.forEach(t => {
        const target = t.target || {};
        if (target.type === 'all' || (target.type === 'dept' && target.depts && target.depts.includes(user.department))) {
            deptTrainings++;
        }
    });
    document.getElementById('dashTotalTrainings').textContent = deptTrainings;

    // Check placement activities
    allActivities.forEach(a => {
        const target = a.target || {};
        if (target.type === 'all' || (target.type === 'dept' && target.depts && target.depts.includes(user.department))) {
            if (a.type === 'recruitment') deptRecruitments++;
            else deptPlacementActs++;
        }
    });
    document.getElementById('dashTotalActivities').textContent = deptPlacementActs;
    document.getElementById('dashTotalRecruitments').textContent = deptRecruitments;

    // Placement Status
    let placedSet = new Set();
    let inProcessSet = new Set();

    allActivities.forEach(a => {
        if (a.phases && a.phases.length > 0) {
            const finalPhase = a.phases[a.phases.length - 1];
            (finalPhase.completions || []).forEach(reg => {
                if(students.find(s => s.registerNumber === reg)) {
                    placedSet.add(reg);
                }
            });
        }
        (a.registeredStudents || []).forEach(reg => {
            if(students.find(s => s.registerNumber === reg)) {
                if (!placedSet.has(reg) && !inProcessSet.has(reg)) {
                    inProcessSet.add(reg);
                }
            }
        });
    });

    const placedCount = placedSet.size;
    const inProcessCount = inProcessSet.size;
    const unplacedCount = Math.max(0, totalStudents - placedCount - inProcessCount);

    document.getElementById('dashPlacementTotalText').textContent = `Total: ${totalStudents}`;
    const placementPercent = totalStudents > 0 ? Math.round((placedCount / totalStudents) * 100) : 0;
    document.getElementById('placementPercentText').textContent = `${placementPercent}%`;

    const pCtx = document.getElementById('placementStatusChart');
    if (pCtx) {
        new Chart(pCtx, {
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
                plugins: { legend: { display: false }, tooltip: { enabled: true } }
            }
        });
    }

    // Training Status
    let completedTrainingSet = new Set();
    let attendingTrainingSet = new Set();

    allTrainings.forEach(p => {
        const sessionCount = (p.sessions || []).length;
        if (sessionCount === 0) return;
        const studentAttendance = {};
        p.sessions.forEach(s => {
            (s.attendance || []).forEach(reg => {
                if(students.find(st => st.registerNumber === reg)) {
                    studentAttendance[reg] = (studentAttendance[reg] || 0) + 1;
                    attendingTrainingSet.add(reg);
                }
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
    if (tCtx) {
        new Chart(tCtx, {
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
                plugins: { legend: { display: false }, tooltip: { enabled: true } }
            }
        });
    }

    // --- Placed Students Table ---
    function renderDashboardPlacedTable() {
        const tableBody = document.querySelector('#dashboardPlacedTable tbody');
        if (!tableBody) return;

        const courseFilter = document.getElementById('dashFilterCourse').value;
        let filteredStudents = students;
        if (courseFilter) filteredStudents = filteredStudents.filter(s => s.course === courseFilter);

        const studentPlacementMap = {};
        const studentActivitiesCount = {};
        const studentRecruitmentsCount = {};

        allActivities.forEach(a => {
            (a.registrations || []).forEach(reg => {
                if (a.type === 'recruitment') studentRecruitmentsCount[reg] = (studentRecruitmentsCount[reg] || 0) + 1;
                else studentActivitiesCount[reg] = (studentActivitiesCount[reg] || 0) + 1;
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
                course: s.course,
                activities: studentActivitiesCount[s.registerNumber] || 0,
                recruitments: studentRecruitmentsCount[s.registerNumber] || 0,
                placedRecruitment: studentPlacementMap[s.registerNumber].join(', ')
            };
        });

        tableBody.innerHTML = '';
        if (placedStudentsData.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-4">No placed students found.</td></tr>';
            return;
        }

        placedStudentsData.forEach(s => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${s.name}</strong></td>
                <td>${s.course}</td>
                <td><span class="badge bg-primary" style="font-size: 11px;">${s.activities}</span></td>
                <td><span class="badge bg-secondary" style="font-size: 11px;">${s.recruitments}</span></td>
                <td><span class="badge bg-success" style="font-size: 11px;">${s.placedRecruitment}</span></td>
            `;
            tableBody.appendChild(tr);
        });
    }

    const dashCourseSelect = document.getElementById('dashFilterCourse');
    if (dashCourseSelect && dashCourseSelect.options.length <= 1) {
        const courses = [...new Set(students.map(s => s.course).filter(c => c))];
        courses.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c; opt.textContent = c;
            dashCourseSelect.appendChild(opt);
        });
        dashCourseSelect.addEventListener('change', renderDashboardPlacedTable);
    }
    renderDashboardPlacedTable();

    // --- Activity Attendance Chart ---
    const dashActivitySelect = document.getElementById('dashFilterActivity');
    if (dashActivitySelect && dashActivitySelect.options.length <= 1) {
        const relevantActs = allActivities.filter(a => {
            const target = a.target || {};
            return target.type === 'all' || (target.type === 'dept' && target.depts && target.depts.includes(user.department));
        });
        relevantActs.forEach(a => {
            const opt = document.createElement('option');
            opt.value = a.id;
            opt.textContent = a.name;
            dashActivitySelect.appendChild(opt);
        });
        if(relevantActs.length > 0) dashActivitySelect.value = relevantActs[0].id;
        dashActivitySelect.addEventListener('change', renderActivityAttendanceChart);
    }

    function renderActivityAttendanceChart() {
        const actId = dashActivitySelect ? dashActivitySelect.value : null;
        if (!actId) return;

        const selectedAct = allActivities.find(a => a.id === actId);
        if (!selectedAct) return;

        const courseCounts = {};
        (selectedAct.registrations || []).forEach(reg => {
            const student = students.find(s => s.registerNumber === reg);
            if(student) {
                const course = student.course || 'Unknown';
                courseCounts[course] = (courseCounts[course] || 0) + 1;
            }
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
                    plugins: { legend: { display: false } },
                    scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } }, x: { grid: { display: false } } }
                }
            });
        }
    }
    renderActivityAttendanceChart();

    // --- Program Calendar Logic ---
    function renderProgramCalendar() {
        const monthSelect = document.getElementById('calMonth');
        const yearSelect = document.getElementById('calYear');
        const container = document.getElementById('calendarContainer');

        if (!monthSelect || !yearSelect || !container) return;

        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        if (monthSelect.options.length === 0) {
            months.forEach((m, idx) => {
                const opt = document.createElement('option');
                opt.value = idx;
                opt.textContent = m;
                monthSelect.appendChild(opt);
            });
            const currentYear = new Date().getFullYear();
            for (let y = currentYear - 1; y <= currentYear + 2; y++) {
                const opt = document.createElement('option');
                opt.value = y;
                opt.textContent = y;
                yearSelect.appendChild(opt);
            }
            const today = new Date();
            monthSelect.value = today.getMonth();
            yearSelect.value = today.getFullYear();

            monthSelect.addEventListener('change', drawCalendar);
            yearSelect.addEventListener('change', drawCalendar);
        }

        function drawCalendar() {
            const month = parseInt(monthSelect.value);
            const year = parseInt(yearSelect.value);
            
            const firstDay = new Date(year, month, 1).getDay();
            const daysInMonth = new Date(year, month + 1, 0).getDate();

            let html = '<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:1px;background:#e5e7eb;border:1px solid #e5e7eb;">';
            
            const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            dayNames.forEach(d => {
                html += `<div style="background:#f9fafb;padding:10px;text-align:center;font-weight:600;font-size:12px;color:#6b7280;">${d}</div>`;
            });

            for (let i = 0; i < firstDay; i++) {
                html += `<div style="background:#fff;min-height:100px;"></div>`;
            }

            for (let day = 1; day <= daysInMonth; day++) {
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                
                let eventsHtml = '';
                allTrainings.forEach(p => {
                    const target = p.target || {};
                    if (target.type === 'all' || (target.type === 'dept' && target.depts && target.depts.includes(user.department))) {
                        const sDate = new Date(p.startDate);
                        const eDate = new Date(p.endDate);
                        const current = new Date(dateStr);
                        sDate.setHours(0,0,0,0); eDate.setHours(0,0,0,0); current.setHours(0,0,0,0);
                        if (current >= sDate && (p.endDate ? current <= eDate : current <= sDate)) {
                            eventsHtml += `<div style="background:#eef2ff;color:#4f46e5;font-size:10px;padding:2px 4px;border-radius:4px;margin-bottom:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${p.name}">📚 ${p.name}</div>`;
                        }
                    }
                });

                allActivities.forEach(p => {
                    const target = p.target || {};
                    if (target.type === 'all' || (target.type === 'dept' && target.depts && target.depts.includes(user.department))) {
                        if (p.startDate === dateStr) {
                            eventsHtml += `<div style="background:#ecfdf5;color:#059669;font-size:10px;padding:2px 4px;border-radius:4px;margin-bottom:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${p.name} Start">💼 ${p.name} Start</div>`;
                        }
                    }
                });

                const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();
                const bg = isToday ? '#eff6ff' : '#fff';
                
                html += `<div style="background:${bg};min-height:100px;padding:8px;display:flex;flex-direction:column;">
                    <div style="text-align:right;font-size:12px;color:${isToday ? '#2563eb' : '#374151'};font-weight:${isToday ? '700' : '500'};margin-bottom:4px;">${day}</div>
                    <div style="flex:1;">${eventsHtml}</div>
                </div>`;
            }

            const totalCells = firstDay + daysInMonth;
            const remaining = (7 - (totalCells % 7)) % 7;
            for (let i = 0; i < remaining; i++) {
                html += `<div style="background:#fff;min-height:100px;"></div>`;
            }

            html += '</div>';
            container.innerHTML = html;
        }

        drawCalendar();
    }
    renderProgramCalendar();

});
