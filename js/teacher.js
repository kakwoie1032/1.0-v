/**
 * Teacher Dashboard Controller
 */
import { dbService, authService, storageService } from './firebase.js';
import { showToast, formatDate, formatMinutes } from './utils.js';

export async function renderTeacherDashboard(container, currentUser) {
  const grade = currentUser.grade;
  const classNumber = currentUser.classNumber;
  const classId = `${grade}-${classNumber}`;

  if (!grade || !classNumber) {
    container.innerHTML = `
      <div class="bg-amber-50 border border-amber-200 p-6 rounded-2xl text-amber-800 text-sm max-w-xl mx-auto mt-10 text-center">
        <h3 class="text-base font-bold mb-2">⚠️ 담당 학급 미배정 상태</h3>
        <p>선생님은 관리자(마스터) 콘솔에 의해 특정 학 학급(예: 1학년 3반)에 먼저 배정되셔야 사용 가능합니다.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="space-y-6">
      <!-- Teacher Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">${grade}학년 ${classNumber}반 담임교사 채널</h1>
          <p class="text-sm text-gray-500 mt-1">우리 학급 학생 관리, 역할 배정, 급식표 및 시간표, 소통 데이터 관리를 진행합니다.</p>
        </div>
        <div class="flex items-center gap-2 self-start sm:self-center">
          <span class="bg-emerald-50 text-emerald-700 text-xs px-3 py-1.5 rounded-full font-semibold border border-emerald-100 flex items-center gap-1">
            <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            교사 모드
          </span>
          <span class="text-sm text-gray-700 font-medium">${currentUser.name} 선생님</span>
        </div>
      </div>

      <!-- Quick Stats -->
      <div id="teacher-stats" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 hover:border-emerald-200 transition-all">
          <div class="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
          </div>
          <div>
            <p class="text-xs font-semibold text-gray-400 tracking-wider">학급 총원</p>
            <h3 id="stat-students-count" class="text-xl font-bold text-gray-900 mt-1">로딩 중..</h3>
          </div>
        </div>
        <div class="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 hover:border-blue-200 transition-all">
          <div class="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
          </div>
          <div>
            <p class="text-xs font-semibold text-gray-400 tracking-wider">1인 1역 지정</p>
            <h3 id="stat-roles-count" class="text-xl font-bold text-gray-900 mt-1">로딩 중..</h3>
          </div>
        </div>
        <div class="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 hover:border-amber-200 transition-all">
          <div class="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.168.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
          </div>
          <div>
            <p class="text-xs font-semibold text-gray-400 tracking-wider">오늘 누적 공부 시간</p>
            <h3 id="stat-study-hours" class="text-xl font-bold text-gray-900 mt-1">로딩 중..</h3>
          </div>
        </div>
        <div class="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 hover:border-purple-200 transition-all">
          <div class="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
          </div>
          <div>
            <p class="text-xs font-semibold text-gray-400 tracking-wider font-mono">D-Day 디렉토리</p>
            <h3 id="stat-ddays-count" class="text-xl font-bold text-gray-900 mt-1">로딩 중..</h3>
          </div>
        </div>
      </div>

      <!-- Tab Navigation -->
      <div class="border-b border-gray-200">
        <nav class="flex gap-6 -mb-px flex-wrap" aria-label="Tabs">
          <button class="teacher-tab-btn border-b-2 border-emerald-600 text-emerald-600 py-3 px-1 text-sm font-semibold transition-colors duration-200" data-tab="students">
            👥 학급 명단 및 학생 등록
          </button>
          <button class="teacher-tab-btn border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 py-3 px-1 text-sm font-semibold transition-colors duration-200" data-tab="roles">
            🎭 1인 1역 마스터
          </button>
          <button class="teacher-tab-btn border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 py-3 px-1 text-sm font-semibold transition-colors duration-200" data-tab="meal">
            🍱 급식표 설계
          </button>
          <button class="teacher-tab-btn border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 py-3 px-1 text-sm font-semibold transition-colors duration-200" data-tab="timetable">
            📅 시간표 편성
          </button>
          <button class="teacher-tab-btn border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 py-3 px-1 text-sm font-semibold transition-colors duration-200" data-tab="board">
            🛡️ 학급 소통방 검열
          </button>
          <button class="teacher-tab-btn border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 py-3 px-1 text-sm font-semibold transition-colors duration-200" data-tab="study">
            ⏱️ 공부 기록 조정
          </button>
        </nav>
      </div>

      <!-- Panel Target -->
      <div id="teacher-panel" class="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm min-h-[400px]">
        <!-- Dashboard subview inside -->
      </div>
    </div>
  `;

  // Stats Updater
  async function updateStats() {
    const allUsers = await dbService.getCollection('users');
    const classStudents = allUsers.filter(u => u.role === 'student' && u.grade === grade && u.classNumber === classNumber);
    const classRoles = await dbService.getCollectionWithFilter('roles', 'classId', classId);
    const ddays = await dbService.getCollectionWithFilter('ddays', 'classId', classId);

    // Sum study time for today
    const studyLogs = await dbService.getCollectionWithFilter('studyLogs', 'classId', classId);
    const todayStr = new Date().toISOString().split('T')[0];
    const todayMinutes = studyLogs
      .filter(log => log.createdAt && log.createdAt.startsWith(todayStr))
      .reduce((sum, log) => sum + (log.durationMinutes || 0), 0);

    const sCount = document.getElementById('stat-students-count');
    const rCount = document.getElementById('stat-roles-count');
    const sHours = document.getElementById('stat-study-hours');
    const dCount = document.getElementById('stat-ddays-count');

    if (sCount) sCount.textContent = `${classStudents.length}명`;
    if (rCount) rCount.textContent = `${classRoles.filter(r => r.assignedStudentUid).length} / ${classRoles.length} 완료`;
    if (sHours) sHours.textContent = formatMinutes(todayMinutes);
    if (dCount) dCount.textContent = `${ddays.length}개`;
  }

  // Bind Switch Tab Event
  const tabs = container.querySelectorAll('.teacher-tab-btn');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => {
        t.classList.remove('border-emerald-600', 'text-emerald-600');
        t.classList.add('border-transparent', 'text-gray-500');
      });
      tab.classList.remove('border-transparent', 'text-gray-500');
      tab.classList.add('border-emerald-600', 'text-emerald-600');

      const targetTab = tab.getAttribute('data-tab');
      switchTab(targetTab);
    });
  });

  async function switchTab(tabName) {
    const panel = document.getElementById('teacher-panel');
    panel.innerHTML = `<div class="flex justify-center items-center py-20"><svg class="animate-spin h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg></div>`;

    if (tabName === 'students') {
      await renderStudentsPanel(panel, grade, classNumber);
    } else if (tabName === 'roles') {
      await renderRolesPanel(panel, classId);
    } else if (tabName === 'meal') {
      await renderMealPanel(panel, classId);
    } else if (tabName === 'timetable') {
      await renderTimetablePanel(panel, classId);
    } else if (tabName === 'board') {
      await renderBoardPanel(panel, classId);
    } else if (tabName === 'study') {
      await renderStudyPanel(panel, classId);
    }
  }

  // Init
  await updateStats();
  await switchTab('students');
}

// PANEL 1: Student Roster
export async function renderStudentsPanel(panel, grade, classNumber) {
  const classId = `${grade}-${classNumber}`;
  const allUsers = await dbService.getCollection('users');
  const roles = await dbService.getCollectionWithFilter('roles', 'classId', classId);
  const classStudents = allUsers
    .filter(u => u.role === 'student' && u.grade === grade && u.classNumber === classNumber)
    .sort((a, b) => (a.studentNumber || 0) - (b.studentNumber || 0));

  panel.innerHTML = `
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Register Student -->
      <div class="lg:col-span-1 bg-gray-50 p-6 rounded-2xl border border-gray-100">
        <h3 class="text-base font-bold text-gray-900 mb-4">👦 우리 반 학생 계정 등록</h3>
        <form id="add-student-form" class="space-y-4">
          <div>
            <label class="block text-xs font-semibold text-gray-600 mb-1.5">출석 번호</label>
            <input name="studentNumber" type="number" min="1" max="50" placeholder="출석부 번호 입력 (예: 15)" required class="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-emerald-500">
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-600 mb-1.5">학생 성함</label>
            <input name="name" type="text" placeholder="예: 홍길동" required class="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-emerald-500">
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-600 mb-1.5">학생 이메일</label>
            <input name="email" type="email" placeholder="예: gildong@school.com" required class="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-emerald-500">
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-600 mb-1.5">초기 비밀번호</label>
            <input name="password" type="password" minlength="6" placeholder="최소 6자리 이상 입력" required class="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-emerald-500">
          </div>
          <button type="submit" class="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm py-2.5 rounded-xl transition-colors cursor-pointer mt-2">
            학생 신규 등록
          </button>
        </form>
      </div>

      <!-- Roster View -->
      <div class="lg:col-span-2 space-y-4">
        <h3 class="text-base font-bold text-gray-900">우리 반 학생 출석 명단</h3>
        <div class="overflow-x-auto border border-gray-100 rounded-2xl bg-white shadow-xs">
          <table class="w-full text-left text-sm text-gray-500">
            <thead class="bg-gray-50 text-xs text-gray-700 uppercase font-semibold">
              <tr>
                <th class="px-6 py-4">출석번호</th>
                <th class="px-6 py-4">학생 성명</th>
                <th class="px-6 py-4">아이디 (이메일)</th>
                <th class="px-6 py-4">학급 1인 1역 지정</th>
                <th class="px-6 py-4 text-center">동작</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              ${classStudents.length === 0 ? `
                <tr>
                  <td colspan="5" class="px-6 py-10 text-center text-gray-400">등록된 반 학생이 없습니다. 학생을 가입시켜 주세요.</td>
                </tr>
              ` : classStudents.map(student => {
                return `
                  <tr class="hover:bg-gray-50/50 transition-colors">
                    <td class="px-6 py-4 font-bold text-gray-800">${student.studentNumber}번</td>
                    <td class="px-6 py-4">
                      <div class="flex items-center gap-1.5">
                        <span class="font-semibold text-gray-900">${student.name}</span>
                        ${student.assignedRole === '서기' ? '<span class="bg-teal-50 border border-teal-100 text-teal-600 text-[9px] font-bold px-1.5 py-0.5 rounded-md">학급서기</span>' : ''}
                      </div>
                    </td>
                    <td class="px-6 py-4 text-xs font-mono">${student.email}</td>
                    <td class="px-6 py-4">
                      <select class="change-student-role-select bg-gray-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-emerald-500 cursor-pointer" data-student-uid="${student.uid}">
                        <option value="">-- 배정 안됨 --</option>
                        ${roles.map(r => `<option value="${r.id}" ${student.assignedRole === r.roleName ? 'selected' : ''}>${r.roleName}</option>`).join('')}
                      </select>
                    </td>
                    <td class="px-6 py-4 text-center">
                      <button class="remove-student-btn bg-red-50 hover:bg-red-100 text-red-600 font-medium text-xs px-2 py-1.5 rounded-lg transition-colors cursor-pointer" data-uid="${student.uid}">
                        제외
                      </button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  // Change student role dropdown handler
  panel.querySelectorAll('.change-student-role-select').forEach(select => {
    select.addEventListener('change', async () => {
      const studentUid = select.getAttribute('data-student-uid');
      const roleId = select.value;
      const student = classStudents.find(s => s.uid === studentUid);
      if (!student) return;

      try {
        // 1. If student already had a role, clear it in old role doc first
        if (student.assignedRole) {
          const oldRoleDoc = roles.find(r => r.roleName === student.assignedRole);
          if (oldRoleDoc && oldRoleDoc.assignedStudentUid === studentUid) {
            await dbService.updateDocument('roles', oldRoleDoc.id, {
              assignedStudentUid: '',
              assignedStudentName: ''
            });
          }
        }

        // 2. Assign new role if selected
        if (roleId) {
          const newRoleDoc = roles.find(r => r.id === roleId);
          if (newRoleDoc) {
            // If someone else occupied this role, remove it from that student
            if (newRoleDoc.assignedStudentUid && newRoleDoc.assignedStudentUid !== studentUid) {
              await dbService.updateDocument('users', newRoleDoc.assignedStudentUid, {
                assignedRole: ''
              });
            }

            // Update role document
            await dbService.updateDocument('roles', roleId, {
              assignedStudentUid: studentUid,
              assignedStudentName: student.name
            });

            // Update student user document
            await dbService.updateDocument('users', studentUid, {
              assignedRole: newRoleDoc.roleName
            });

            showToast(`'${newRoleDoc.roleName}' 역할로 배정이 성공적으로 완료되었습니다!`, 'success');
          }
        } else {
          // Clear role
          await dbService.updateDocument('users', studentUid, {
            assignedRole: ''
          });
          showToast('역할 배정이 해제되었습니다.', 'success');
        }

        renderStudentsPanel(panel, grade, classNumber);
      } catch (err) {
        console.error("Failed to assign role:", err);
        showToast("역할 변경 실패", "error");
      }
    });
  });

  // Submit roster handler
  document.getElementById('add-student-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const num = parseInt(formData.get('studentNumber'));
    const name = formData.get('name');
    const email = formData.get('email');
    const password = formData.get('password');

    // Number duplication check
    if (classStudents.some(s => s.studentNumber === num)) {
      showToast("이미 등록된 출석 번호입니다.", "error");
      return;
    }

    try {
      await authService.registerUser(email, password, {
        name: name,
        role: 'student',
        grade,
        classNumber,
        studentNumber: num,
        assignedRole: ''
      });
      showToast(`${num}번 ${name} 학생 계정이 추가되었습니다.`, 'success');
      renderStudentsPanel(panel, grade, classNumber);
    } catch (err) {
      console.error(err);
    }
  });

  // Remove handler
  panel.querySelectorAll('.remove-student-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const uid = btn.getAttribute('data-uid');
      if (confirm('정말 이 학생을 우리 반 목록에서 제외하시겠습니까? 계정이 삭제됩니다.')) {
        await dbService.deleteDocument('users', uid);
        showToast("학생 데이터가 정상적으로 소거되었습니다.", "success");
        renderStudentsPanel(panel, grade, classNumber);
      }
    });
  });
}

// PANEL 2: 1인 1역 마스터
export async function renderRolesPanel(panel, classId) {
  const roles = await dbService.getCollectionWithFilter('roles', 'classId', classId);
  const students = (await dbService.getCollection('users'))
    .filter(u => u.role === 'student' && `${u.grade}-${u.classNumber}` === classId)
    .sort((a, b) => (a.studentNumber || 0) - (b.studentNumber || 0));

  panel.innerHTML = `
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Add Role Definition -->
      <div class="lg:col-span-1 bg-gray-50 p-6 rounded-2xl border border-gray-100">
        <h3 class="text-base font-bold text-gray-900 mb-4">🎭 신규 1인 1역 생성</h3>
        <form id="add-role-form" class="space-y-4">
          <div>
            <label class="block text-xs font-semibold text-gray-600 mb-1.5">역할 이름</label>
            <input name="roleName" type="text" placeholder="예: 칠판 담당, 분리수거" required class="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-emerald-500">
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-600 mb-1.5">역할 주요 임무 설명</label>
            <textarea name="description" rows="3" placeholder="예: 매 교시 종료 후 칠판을 깨끗하게 소거합니다." required class="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-emerald-500"></textarea>
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-600 mb-1.5">담당 학생 배정</label>
            <select name="assignedStudentUid" class="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-emerald-500">
              <option value="">-- 학생 공석으로 생성 --</option>
              ${students.map(s => `<option value="${s.uid}">${s.studentNumber}번 ${s.name}</option>`).join('')}
            </select>
          </div>
          <button type="submit" class="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm py-2.5 rounded-xl transition-colors cursor-pointer mt-2">
            1인 1역 개설하기
          </button>
        </form>
      </div>

      <!-- Role List & Assigners -->
      <div class="lg:col-span-2 space-y-4">
        <h3 class="text-base font-bold text-gray-900">학급 1인 1역 배정 현황</h3>
        <div class="space-y-3">
          ${roles.length === 0 ? `
            <div class="text-center py-20 text-gray-400 border border-dashed border-gray-200 rounded-2xl bg-white">
              등록된 1인 1역이 하나도 없습니다. 첫 역할을 만들어 보세요!
            </div>
          ` : roles.map(r => {
            return `
              <div class="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-emerald-100 transition-all relative">
                <div class="space-y-1 shrink-1">
                  <div class="flex items-center gap-2">
                    <span class="font-bold text-gray-900">${r.roleName}</span>
                    ${r.roleName === '서기' ? '<span class="bg-teal-50 border border-teal-100 text-teal-600 text-[9px] font-bold px-1.5 py-0.5 rounded-md">관리 특임 권한자</span>' : ''}
                  </div>
                  <p class="text-xs text-gray-500">${r.description}</p>
                </div>
                
                <div class="flex items-center gap-2 shrink-0 self-end md:self-center">
                  <select class="change-assignee-select bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-emerald-500 font-semibold text-gray-700" data-role-id="${r.id}">
                    <option value="">-- 공석 --</option>
                    ${students.map(s => `<option value="${s.uid}" ${r.assignedStudentUid === s.uid ? 'selected' : ''}>${s.studentNumber}번 ${s.name}</option>`).join('')}
                  </select>
                  <button class="delete-role-btn text-xs bg-red-50 hover:bg-red-100 text-red-600 px-2.5 py-1.5 rounded-xl transition-colors cursor-pointer" data-role-id="${r.id}">
                    역할 소거
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    </div>
  `;

  // Submit Handler
  document.getElementById('add-role-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const roleName = formData.get('roleName');
    const description = formData.get('description');
    const assignedStudentUid = formData.get('assignedStudentUid');

    const matchedS = students.find(s => s.uid === assignedStudentUid);
    const assignedStudentName = matchedS ? matchedS.name : '';

    try {
      // Create role entry
      const roleId = 'role_' + generateId();
      await dbService.setDocument('roles', roleId, {
        id: roleId,
        classId,
        roleName,
        description,
        assignedStudentUid,
        assignedStudentName
      });

      // Update student document role string as well
      if (assignedStudentUid) {
        await dbService.updateDocument('users', assignedStudentUid, {
          assignedRole: roleName
        });
      }

      showToast(`'${roleName}' 역할이 신규 개설되었습니다.`, 'success');
      renderRolesPanel(panel, classId);
    } catch (err) {
      console.error(err);
    }
  });

  // Assign Change Dropdown Handler
  panel.querySelectorAll('.change-assignee-select').forEach(sel => {
    sel.addEventListener('change', async () => {
      const roleId = sel.getAttribute('data-role-id');
      const studentUid = sel.value;
      const role = roles.find(r => r.id === roleId);

      try {
        // If old user occupied, remove their role first
        if (role && role.assignedStudentUid) {
          await dbService.updateDocument('users', role.assignedStudentUid, {
            assignedRole: ''
          });
        }

        const matchedStudent = students.find(s => s.uid === studentUid);
        const studentName = matchedStudent ? matchedStudent.name : '';

        // Save new assignee
        await dbService.updateDocument('roles', roleId, {
          assignedStudentUid: studentUid,
          assignedStudentName: studentName
        });

        // Save profile linkage
        if (studentUid) {
          await dbService.updateDocument('users', studentUid, {
            assignedRole: role.roleName
          });
        }

        showToast("담당 학생 배정이 동기화되었습니다.", "success");
        renderRolesPanel(panel, classId);
      } catch (err) {
        showToast("임명 저장 실패", "error");
      }
    });
  });

  // Delete Role Definition
  panel.querySelectorAll('.delete-role-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const roleId = btn.getAttribute('data-role-id');
      const role = roles.find(r => r.id === roleId);

      if (confirm(`'${role.roleName}' 역할을 영구 소거하시겠습니까?`)) {
        if (role.assignedStudentUid) {
          await dbService.updateDocument('users', role.assignedStudentUid, {
            assignedRole: ''
          });
        }
        await dbService.deleteDocument('roles', roleId);
        showToast("역할 구성이 삭제되었습니다.", "success");
        renderRolesPanel(panel, classId);
      }
    });
  });
}

// PANEL 3: Meal Table Editor
async function renderMealPanel(panel, classId) {
  const todayStr = formatDate();
  const mealDocs = await dbService.getCollectionWithFilter('meals', 'classId', classId);
  const todaysMeal = mealDocs.find(m => m.date === todayStr);

  panel.innerHTML = `
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Register Meal Form -->
      <div class="lg:col-span-1 bg-gray-50 p-6 rounded-2xl border border-gray-100">
        <h3 class="text-base font-bold text-gray-900 mb-4">🍱 급식표 등록 및 업데이트</h3>
        <form id="meal-form" class="space-y-4">
          <div>
            <label class="block text-xs font-semibold text-gray-600 mb-1.5">날짜 지정</label>
            <input name="date" type="date" value="${todayStr}" required class="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-emerald-500">
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-600 mb-1.5">급식 메뉴 구성 (줄바꿈 가능)</label>
            <textarea name="menu" rows="5" placeholder="예: 잡곡밥, 미역국, 제육볶음, 포기김치" required class="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-emerald-500">${todaysMeal ? todaysMeal.menu : ''}</textarea>
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-600 mb-1.5">급식 식단 이미지 첨부 (Storage 활용)</label>
            <input id="meal-image-input" name="image" type="file" accept="image/*" class="block w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 transition-all cursor-pointer">
          </div>
          <button type="submit" class="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm py-2.5 rounded-xl transition-colors cursor-pointer mt-2">
            식단표 등록/수정 완료
          </button>
        </form>
      </div>

      <!-- Meal Schedule Viewer -->
      <div class="lg:col-span-2 space-y-4">
        <h3 class="text-base font-bold text-gray-900">우리 반 등록 급식 기록</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          ${mealDocs.length === 0 ? `
            <div class="md:col-span-2 text-center py-20 text-gray-400 border border-dashed border-gray-200 rounded-2xl bg-white">
              등록된 식단 정보가 없습니다. 오늘 식단을 배포해 보세요!
            </div>
          ` : mealDocs.sort((a,b) => b.date.localeCompare(a.date)).map(m => {
            return `
              <div class="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between gap-4 hover:border-gray-200 transition-all">
                <div>
                  <div class="flex items-center justify-between">
                    <span class="text-xs font-bold text-emerald-600 font-mono bg-emerald-50 px-2 py-0.5 rounded-lg">${m.date}</span>
                    <button class="delete-meal-btn text-xs text-red-500 hover:text-red-600" data-id="${m.id}">삭제</button>
                  </div>
                  <p class="text-xs text-gray-700 font-medium whitespace-pre-wrap leading-relaxed mt-3 border-t border-gray-50 pt-3">${m.menu}</p>
                </div>
                ${m.imageUrl ? `<img src="${m.imageUrl}" referrerPolicy="no-referrer" class="w-full h-32 object-cover rounded-xl mt-1 border border-gray-100" />` : ''}
              </div>
            `;
          }).join('')}
        </div>
      </div>
    </div>
  `;

  // Dynamic Date Load
  const dateInput = panel.querySelector('input[name="date"]');
  const menuArea = panel.querySelector('textarea[name="menu"]');
  dateInput.addEventListener('change', () => {
    const activeDate = dateInput.value;
    const selectedMeal = mealDocs.find(m => m.date === activeDate);
    menuArea.value = selectedMeal ? selectedMeal.menu : '';
  });

  // Submit Handler
  document.getElementById('meal-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const date = formData.get('date');
    const menu = formData.get('menu');
    const imageFile = document.getElementById('meal-image-input').files[0];

    try {
      let imageUrl = '';
      if (imageFile) {
        showToast("이미지 업로드 중...", "info");
        imageUrl = await storageService.uploadFile(`meals/${classId}`, imageFile);
      } else {
        const existingMeal = mealDocs.find(m => m.date === date);
        if (existingMeal) imageUrl = existingMeal.imageUrl || '';
      }

      const foundIndex = mealDocs.findIndex(m => m.date === date);
      if (foundIndex >= 0) {
        // Update existing record
        await dbService.updateDocument('meals', mealDocs[foundIndex].id, {
          menu,
          imageUrl
        });
      } else {
        // Add new record
        const mealId = 'meal_' + generateId();
        await dbService.setDocument('meals', mealId, {
          id: mealId,
          classId,
          date,
          menu,
          imageUrl,
          createdBy: 'teacher-1'
        });
      }

      showToast(`${date} 식단표 저장이 완료되었습니다.`, 'success');
      renderMealPanel(panel, classId);
    } catch (err) {
      showToast("급식 저장 실패", "error");
    }
  });

  // Delete Handler
  panel.querySelectorAll('.delete-meal-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const mealId = btn.getAttribute('data-id');
      if (confirm('이 급식 식단을 삭제하시겠습니까?')) {
        await dbService.deleteDocument('meals', mealId);
        showToast("식단이 삭제되었습니다.", "success");
        renderMealPanel(panel, classId);
      }
    });
  });
}

// PANEL 4: Timetable Customizer
async function renderTimetablePanel(panel, classId) {
  const timetables = await dbService.getCollectionWithFilter('timetables', 'classId', classId);
  const hasTimetable = timetables.length > 0;
  const tData = hasTimetable ? timetables[0] : {
    monday: Array(7).fill(''),
    tuesday: Array(7).fill(''),
    wednesday: Array(7).fill(''),
    thursday: Array(7).fill(''),
    friday: Array(7).fill('')
  };

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
  const dayNames = { monday: '월요일', tuesday: '화요일', wednesday: '수요일', thursday: '목요일', friday: '금요일' };

  panel.innerHTML = `
    <div class="space-y-6">
      <div>
        <h3 class="text-base font-bold text-gray-900">📅 학급 주간 시간표 편성 (1~7교시)</h3>
        <p class="text-xs text-gray-500 mt-1">월요일부터 금요일까지 1교시부터 7교시의 과목을 기입하고 저장하세요. 빈칸인 교시는 공석으로 처리됩니다.</p>
      </div>

      <form id="timetable-form" class="space-y-6 bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
        <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
          ${days.map(dayKey => {
            const list = tData[dayKey] || Array(7).fill('');
            return `
              <div class="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-3">
                <div class="text-xs font-bold text-gray-800 text-center pb-2 border-b border-gray-50">${dayNames[dayKey]}</div>
                ${Array.from({ length: 7 }).map((_, idx) => {
                  return `
                    <div class="space-y-1">
                      <label class="block text-[10px] text-gray-400 font-bold">${idx + 1}교시</label>
                      <input name="${dayKey}_${idx}" type="text" value="${list[idx] || ''}" placeholder="예: 국어" class="w-full bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-xs text-center font-semibold text-gray-700 focus:outline-none focus:border-emerald-500">
                    </div>
                  `;
                }).join('')}
              </div>
            `;
          }).join('')}
        </div>

        <button type="submit" class="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm px-6 py-2.5 rounded-xl transition-colors cursor-pointer block mx-auto">
          학급 시간표 전체 저장 및 반영
        </button>
      </form>
    </div>
  `;

  document.getElementById('timetable-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);

    // Build payload arrays
    const payload = {};
    days.forEach(dayKey => {
      payload[dayKey] = [];
      for (let i = 0; i < 7; i++) {
        payload[dayKey].push(fd.get(`${dayKey}_${i}`) || '');
      }
    });

    try {
      if (hasTimetable) {
        await dbService.updateDocument('timetables', tData.id, {
          ...payload,
          updatedAt: new Date().toISOString()
        });
      } else {
        const tId = 'timetable_' + generateId();
        await dbService.setDocument('timetables', tId, {
          id: tId,
          classId,
          ...payload,
          updatedAt: new Date().toISOString()
        });
      }
      showToast("학급 주간 시간표 편성이 저장되었습니다.", "success");
      renderTimetablePanel(panel, classId);
    } catch (err) {
      showToast("시간표 저장 실패", "error");
    }
  });
}

// PANEL 5: Board Moderation
export async function renderBoardPanel(panel, classId) {
  const posts = await dbService.getCollectionWithFilter('posts', 'classId', classId);
  const comments = await dbService.getCollectionWithFilter('comments', 'classId', classId);

  panel.innerHTML = `
    <div class="space-y-6">
      <div>
        <h3 class="text-base font-bold text-gray-900">🛡️ 학급 소통 게시물 & 댓글 검열</h3>
        <p class="text-xs text-gray-500 mt-1">부적절한 은어 사용이나 폭력성을 띄는 학급 게시물 및 댓글을 즉시 영구 삭제하거나 숨김 처리할 수 있습니다.</p>
      </div>

      <div class="space-y-4">
        ${posts.length === 0 ? `
          <div class="text-center py-20 text-gray-400 border border-dashed border-gray-200 rounded-2xl bg-white">
            검열할 수 있는 게시물이 존재하지 않습니다.
          </div>
        ` : posts.map(p => {
          const postComments = comments.filter(c => c.postId === p.id);
          return `
            <div class="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-3 hover:border-gray-200 transition-all">
              <div class="flex items-start justify-between gap-4">
                <div class="space-y-1">
                  <div class="flex items-center gap-2">
                    <span class="text-xs bg-gray-50 font-bold text-gray-500 px-2 py-0.5 rounded-lg border border-gray-100">${p.category}</span>
                    <span class="text-xs text-gray-400 font-mono">${p.authorName} 학생</span>
                    ${p.hidden ? '<span class="bg-rose-50 text-rose-600 text-[10px] font-bold px-2 py-0.5 rounded-md border border-rose-100">숨김 처리됨</span>' : ''}
                  </div>
                  <h4 class="text-sm font-bold text-gray-900 mt-1">${p.title}</h4>
                </div>
                
                <div class="flex items-center gap-1">
                  <button class="toggle-hide-btn text-xs px-2.5 py-1.5 rounded-lg border cursor-pointer transition-all ${p.hidden ? 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-gray-200' : 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100'}" data-id="${p.id}" data-hidden="${p.hidden}">
                    ${p.hidden ? '숨김 해제' : '글 숨기기'}
                  </button>
                  <button class="delete-post-btn text-xs bg-red-50 hover:bg-red-100 text-red-600 px-2.5 py-1.5 border border-red-100 rounded-lg cursor-pointer transition-all" data-id="${p.id}">
                    삭제
                  </button>
                </div>
              </div>
              <p class="text-xs text-gray-600 whitespace-pre-wrap py-2 leading-relaxed border-t border-gray-50 pt-2">${p.content}</p>
              
              <!-- Child Comments -->
              ${postComments.length > 0 ? `
                <div class="bg-gray-50 p-3 rounded-xl space-y-2 mt-2 border border-gray-100">
                  <div class="text-[10px] font-bold text-gray-400 mb-1">작성된 하위 댓글 (${postComments.length}개)</div>
                  ${postComments.map(c => `
                    <div class="flex items-center justify-between text-xs py-1 border-b border-gray-200/50 last:border-0 last:pb-0">
                      <div class="text-gray-700 leading-normal">
                        <strong class="text-gray-800 mr-1">${c.authorName}:</strong> ${c.content}
                      </div>
                      <button class="delete-comment-btn text-[10px] text-red-500 hover:text-red-700 ml-2" data-comment-id="${c.id}">
                        삭제
                      </button>
                    </div>
                  `).join('')}
                </div>
              ` : ''}
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;

  // Bind Post Hide/Show
  panel.querySelectorAll('.toggle-hide-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const pId = btn.getAttribute('data-id');
      const isHidden = btn.getAttribute('data-hidden') === 'true';

      await dbService.updateDocument('posts', pId, {
        hidden: !isHidden
      });
      showToast(isHidden ? "게시글이 다시 노출됩니다." : "게시글이 숨김 처리되었습니다.", "success");
      renderBoardPanel(panel, classId);
    });
  });

  // Bind Post Delete
  panel.querySelectorAll('.delete-post-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const pId = btn.getAttribute('data-id');
      if (confirm('이 게시글을 정말 지우시겠습니까? 삭제 복구가 불가능합니다.')) {
        await dbService.deleteDocument('posts', pId);
        showToast("게시물이 강제 철회되었습니다.", "success");
        renderBoardPanel(panel, classId);
      }
    });
  });

  // Bind Comment Delete
  panel.querySelectorAll('.delete-comment-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const cId = btn.getAttribute('data-comment-id');
      if (confirm('댓글을 삭제하시겠습니까?')) {
        await dbService.deleteDocument('comments', cId);
        showToast("댓글이 소거되었습니다.", "success");
        renderBoardPanel(panel, classId);
      }
    });
  });
}

// PANEL 6: Study Logs Adjuster
async function renderStudyPanel(panel, classId) {
  const studyLogs = await dbService.getCollectionWithFilter('studyLogs', 'classId', classId);

  panel.innerHTML = `
    <div class="space-y-6">
      <div>
        <h3 class="text-base font-bold text-gray-900">⏱️ 공부 기록 조정 (잘못된 공부 기록 오차 보정)</h3>
        <p class="text-xs text-gray-500 mt-1">학생이 타이머를 실수로 종료하지 않아 기록이 과도하게 길게 책정되었거나 오류가 있을 경우 수정할 수 있습니다.</p>
      </div>

      <div class="overflow-x-auto border border-gray-100 rounded-2xl bg-white">
        <table class="w-full text-left text-sm text-gray-500">
          <thead class="bg-gray-50 text-xs text-gray-700 uppercase font-semibold">
            <tr>
              <th class="px-6 py-4">학생 성명</th>
              <th class="px-6 py-4">학습 과목</th>
              <th class="px-6 py-4">공부 메모</th>
              <th class="px-6 py-4">시작 일자</th>
              <th class="px-6 py-4">합계 공부 시간</th>
              <th class="px-6 py-4 text-center">조정 제어</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            ${studyLogs.length === 0 ? `
              <tr>
                <td colspan="6" class="px-6 py-10 text-center text-gray-400">등록된 반 학생 공부 로그가 없습니다.</td>
              </tr>
            ` : studyLogs.sort((a,b) => b.createdAt.localeCompare(a.createdAt)).map(log => {
              return `
                <tr class="hover:bg-gray-50/50 transition-colors">
                  <td class="px-6 py-4 font-bold text-gray-900">${log.studentName}</td>
                  <td class="px-6 py-4">
                    <span class="bg-blue-50 text-blue-700 font-bold text-xs px-2.5 py-1 rounded-full border border-blue-100">${log.subject}</span>
                  </td>
                  <td class="px-6 py-4 text-xs max-w-xs truncate">${log.memo || '-'}</td>
                  <td class="px-6 py-4 text-xs font-mono">${log.startTime ? log.startTime.slice(0, 16).replace('T', ' ') : '-'}</td>
                  <td class="px-6 py-4 text-sm font-bold text-gray-800">${formatMinutes(log.durationMinutes)}</td>
                  <td class="px-6 py-4 text-center">
                    <div class="flex items-center justify-center gap-1.5">
                      <button class="edit-study-btn text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-600 px-2.5 py-1.5 border border-emerald-100 rounded-lg cursor-pointer" data-id="${log.id}" data-current="${log.durationMinutes}">
                        분단위 정정
                      </button>
                      <button class="delete-study-btn text-xs bg-red-50 hover:bg-red-100 text-red-600 px-2 py-1.5 border border-red-100 rounded-lg cursor-pointer" data-id="${log.id}">
                        삭제
                      </button>
                    </div>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

  // Bind Adjuster Modal Trigger
  panel.querySelectorAll('.edit-study-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const logId = btn.getAttribute('data-id');
      const curVal = btn.getAttribute('data-current');
      const newVal = prompt(`공부 시간을 몇 분으로 정정하시겠습니까? (현재 설정: ${curVal}분)`, curVal);
      
      if (newVal !== null) {
        const parsed = parseInt(newVal);
        if (isNaN(parsed) || parsed < 0) {
          showToast("올바른 양수 시간(분)을 기입해 주세요.", "error");
          return;
        }

        await dbService.updateDocument('studyLogs', logId, {
          durationMinutes: parsed
        });
        showToast("공부 기록이 오차 보정되었습니다.", "success");
        renderStudyPanel(panel, classId);
      }
    });
  });

  // Bind study log delete
  panel.querySelectorAll('.delete-study-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const logId = btn.getAttribute('data-id');
      if (confirm('이 공부 기록을 정말 영구 삭제 처리하시겠습니까?')) {
        await dbService.deleteDocument('studyLogs', logId);
        showToast("공부 기록이 정상 삭제되었습니다.", "success");
        renderStudyPanel(panel, classId);
      }
    });
  });
}
