/**
 * Admin Dashboard Controller
 */
import { dbService, authService } from './firebase.js';
import { showToast, formatDate, showConfirm } from './utils.js';

export async function renderAdminDashboard(container, currentUser) {
  container.innerHTML = `
    <div class="space-y-6">
      <!-- Admin Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">학교 종합 관리자 콘솔</h1>
          <p class="text-sm text-gray-500 mt-1">학년/반 구성, 선생님 임명 및 전체 학교 공지를 전담 관리합니다.</p>
        </div>
        <div class="flex items-center gap-2 self-start sm:self-center">
          <span class="bg-blue-50 text-blue-700 text-xs px-3 py-1.5 rounded-full font-semibold border border-blue-100 flex items-center gap-1">
            <span class="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
            마스터 계정
          </span>
          <span class="text-sm text-gray-700 font-medium">${currentUser.name}</span>
        </div>
      </div>

      <!-- Stats Grid -->
      <div id="admin-stats" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Stats will load dynamically -->
        <div class="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm animate-pulse h-24"></div>
        <div class="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm animate-pulse h-24"></div>
        <div class="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm animate-pulse h-24"></div>
        <div class="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm animate-pulse h-24"></div>
      </div>

      <!-- Admin Tabs -->
      <div class="border-b border-gray-200">
        <nav class="flex gap-6 -mb-px" aria-label="Tabs">
          <button id="tab-classes" class="admin-tab-btn border-b-2 border-blue-600 text-blue-600 py-3 px-1 text-sm font-semibold transition-colors duration-200" data-tab="classes">
            🏫 학급 및 담임 관리
          </button>
          <button id="tab-teachers" class="admin-tab-btn border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 py-3 px-1 text-sm font-semibold transition-colors duration-200" data-tab="teachers">
            🧑‍🏫 교사 계정 생성
          </button>
          <button id="tab-users" class="admin-tab-btn border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 py-3 px-1 text-sm font-semibold transition-colors duration-200" data-tab="users">
            👥 전체 사용자 목록
          </button>
          <button id="tab-notices" class="admin-tab-btn border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 py-3 px-1 text-sm font-semibold transition-colors duration-200" data-tab="notices">
            📢 학교 전체 공지
          </button>
        </nav>
      </div>

      <!-- Active Tab Panel -->
      <div id="admin-tab-panel" class="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm min-h-[400px]">
        <!-- Content will be injected by sub-modules -->
      </div>
    </div>
  `;

  // Dynamic Statistics loader
  async function loadStats() {
    const users = await dbService.getCollection('users');
    const classes = await dbService.getCollection('classes');
    const posts = await dbService.getCollection('posts');
    const notices = await dbService.getCollection('notices');

    const totalStudents = users.filter(u => u.role === 'student').length;
    const totalTeachers = users.filter(u => u.role === 'teacher').length;

    const statsContainer = document.getElementById('admin-stats');
    if (statsContainer) {
      statsContainer.innerHTML = `
        <div class="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 hover:border-blue-200 transition-all">
          <div class="p-3.5 bg-blue-50 text-blue-600 rounded-xl">
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
          </div>
          <div>
            <p class="text-xs font-semibold text-gray-400 tracking-wider">총 개설 학급 수</p>
            <h3 class="text-2xl font-bold text-gray-900 mt-1">${classes.length}개 반</h3>
          </div>
        </div>
        <div class="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 hover:border-emerald-200 transition-all">
          <div class="p-3.5 bg-emerald-50 text-emerald-600 rounded-xl">
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
          </div>
          <div>
            <p class="text-xs font-semibold text-gray-400 tracking-wider">등록 학생 수</p>
            <h3 class="text-2xl font-bold text-gray-900 mt-1">${totalStudents}명</h3>
          </div>
        </div>
        <div class="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 hover:border-amber-200 transition-all">
          <div class="p-3.5 bg-amber-50 text-amber-600 rounded-xl">
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
          </div>
          <div>
            <p class="text-xs font-semibold text-gray-400 tracking-wider">담당 교사 수</p>
            <h3 class="text-2xl font-bold text-gray-900 mt-1">${totalTeachers}명</h3>
          </div>
        </div>
        <div class="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 hover:border-violet-200 transition-all">
          <div class="p-3.5 bg-violet-50 text-violet-600 rounded-xl">
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>
          </div>
          <div>
            <p class="text-xs font-semibold text-gray-400 tracking-wider">총 소통 게시물 수</p>
            <h3 class="text-2xl font-bold text-gray-900 mt-1">${posts.length + notices.length}개</h3>
          </div>
        </div>
      `;
    }
  }

  // Bind navigation tabs
  const tabs = container.querySelectorAll('.admin-tab-btn');
  tabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      tabs.forEach(t => {
        t.classList.remove('border-blue-600', 'text-blue-600');
        t.classList.add('border-transparent', 'text-gray-500');
      });
      tab.classList.remove('border-transparent', 'text-gray-500');
      tab.classList.add('border-blue-600', 'text-blue-600');

      const targetTab = tab.getAttribute('data-tab');
      switchTab(targetTab);
    });
  });

  // Switch Sub-Panel
  async function switchTab(tabName) {
    const panel = document.getElementById('admin-tab-panel');
    panel.innerHTML = `<div class="flex justify-center items-center py-20"><svg class="animate-spin h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg></div>`;

    if (tabName === 'classes') {
      await renderClassesPanel(panel);
    } else if (tabName === 'teachers') {
      await renderTeachersPanel(panel);
    } else if (tabName === 'users') {
      await renderUsersPanel(panel);
    } else if (tabName === 'notices') {
      await renderNoticesPanel(panel);
    }
  }

  // Load Initial Tab & Stats
  await loadStats();
  await switchTab('classes');
}

// Sub-Panel 1: Class & Teacher Assignments
async function renderClassesPanel(panel) {
  const classes = await dbService.getCollection('classes');
  const teachers = (await dbService.getCollection('users')).filter(u => u.role === 'teacher');

  panel.innerHTML = `
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Add Class Form -->
      <div class="lg:col-span-1 bg-gray-50 p-6 rounded-2xl border border-gray-100">
        <h3 class="text-base font-bold text-gray-900 mb-4">🏫 신규 학급 및 담임 매칭</h3>
        <form id="add-class-form" class="space-y-4">
          <div>
            <label class="block text-xs font-semibold text-gray-600 mb-1.5">학년 선택</label>
            <select name="grade" required class="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-blue-500">
              <option value="1">1학년</option>
              <option value="2">2학년</option>
              <option value="3">3학년</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-600 mb-1.5">학급 번호 (반)</label>
            <input name="classNumber" type="number" min="1" max="15" placeholder="예: 3" required class="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-blue-500">
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-600 mb-1.5">담임 선생님 매칭</label>
            <select name="teacherUid" required class="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-blue-500">
              <option value="">-- 선생님 선택 --</option>
              ${teachers.map(t => `<option value="${t.uid}">${t.name} (${t.email})</option>`).join('')}
            </select>
          </div>
          <button type="submit" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm py-2.5 rounded-xl transition-colors cursor-pointer mt-2">
            학급 개설 및 배정
          </button>
        </form>
      </div>

      <!-- Class List Table -->
      <div class="lg:col-span-2 space-y-4">
        <h3 class="text-base font-bold text-gray-900">학교 개설 학급 현황</h3>
        <div class="overflow-x-auto border border-gray-100 rounded-2xl">
          <table class="w-full text-left text-sm text-gray-500">
            <thead class="bg-gray-50 text-xs text-gray-700 uppercase font-semibold">
              <tr>
                <th class="px-6 py-4">학급명</th>
                <th class="px-6 py-4">담임 선생님</th>
                <th class="px-6 py-4">개설 일자</th>
                <th class="px-6 py-4 text-center">동작</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 bg-white">
              ${classes.length === 0 ? `
                <tr>
                  <td colspan="4" class="px-6 py-10 text-center text-gray-400">개설된 학급 정보가 존재하지 않습니다.</td>
                </tr>
              ` : classes.map(cls => {
                return `
                  <tr class="hover:bg-gray-50/50 transition-colors">
                    <td class="px-6 py-4 font-bold text-gray-900">${cls.grade}학년 ${cls.classNumber}반</td>
                    <td class="px-6 py-4">
                      <div class="font-medium text-gray-800">${cls.teacherName || '배정 안됨'}</div>
                    </td>
                    <td class="px-6 py-4 text-xs">${cls.createdAt ? formatDate(cls.createdAt) : '-'}</td>
                    <td class="px-6 py-4 text-center">
                      <button class="delete-class-btn bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 font-medium text-xs px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer" data-id="${cls.id}">
                        삭제
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

  // Submit Handler
  document.getElementById('add-class-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const grade = parseInt(formData.get('grade'));
    const classNumber = parseInt(formData.get('classNumber'));
    const teacherUid = formData.get('teacherUid');

    const matchedTeacher = teachers.find(t => t.uid === teacherUid);
    const teacherName = matchedTeacher ? matchedTeacher.name : '김선생';
    const classId = `${grade}-${classNumber}`;

    // Avoid duplicate class creation
    if (classes.some(c => c.id === classId)) {
      showToast("이미 개설된 학년/반 정보입니다.", "error");
      return;
    }

    try {
      // 1. Save Class record
      await dbService.setDocument('classes', classId, {
        id: classId,
        grade,
        classNumber,
        teacherUid,
        teacherName
      });

      // 2. Update Teacher user profile (grade and class info)
      await dbService.updateDocument('users', teacherUid, {
        grade,
        classNumber
      });

      showToast(`${grade}학년 ${classNumber}반 학급이 성공적으로 개설되었습니다!`, 'success');
      renderClassesPanel(panel);
    } catch (err) {
      showToast("학급 개설에 실패했습니다.", "error");
    }
  });

  // Delete Handler
  panel.querySelectorAll('.delete-class-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const classId = btn.getAttribute('data-id');
      if (await showConfirm(`정말 ${classId}반을 삭제하시겠습니까? 학급 정보가 삭제됩니다.`)) {
        await dbService.deleteDocument('classes', classId);
        showToast("학급이 정상적으로 삭제되었습니다.", "success");
        renderClassesPanel(panel);
      }
    });
  });
}

// Sub-Panel 2: Register Teacher Account
async function renderTeachersPanel(panel) {
  panel.innerHTML = `
    <div class="max-w-xl mx-auto space-y-6 py-4">
      <div>
        <h3 class="text-base font-bold text-gray-900">🧑‍🏫 신규 교사 권한 계정 생성</h3>
        <p class="text-xs text-gray-500 mt-1">시스템에서 담당 선생님의 전용 계정을 발급하여 선생님 페이지 접근 권한을 제공합니다.</p>
      </div>

      <form id="add-teacher-form" class="space-y-4 bg-gray-50 p-6 rounded-2xl border border-gray-100">
        <div>
          <label class="block text-xs font-semibold text-gray-600 mb-1.5">선생님 성함</label>
          <input name="name" type="text" placeholder="예: 김선생" required class="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-blue-500">
        </div>
        <div>
          <label class="block text-xs font-semibold text-gray-600 mb-1.5">이메일 주소 (아이디)</label>
          <input name="email" type="email" placeholder="예: teacher_seoul@school.com" required class="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-blue-500">
        </div>
        <div>
          <label class="block text-xs font-semibold text-gray-600 mb-1.5">초기 비밀번호</label>
          <input name="password" type="password" minlength="6" placeholder="최소 6자리 이상 입력" required class="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-blue-500">
        </div>
        <button type="submit" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm py-2.5 rounded-xl transition-colors cursor-pointer mt-2">
          교사 전용 계정 발급
        </button>
      </form>
    </div>
  `;

  document.getElementById('add-teacher-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const name = formData.get('name');
    const email = formData.get('email');
    const password = formData.get('password');

    try {
      await authService.registerUser(email, password, {
        name: name,
        role: 'teacher',
        grade: null,
        classNumber: null,
        studentNumber: null,
        assignedRole: ''
      });
      showToast(`${name} 선생님의 교사 계정이 생성되었습니다.`, "success");
      e.target.reset();
    } catch (err) {
      console.error(err);
    }
  });
}

// Sub-Panel 3: User Directory Overview
async function renderUsersPanel(panel) {
  const users = await dbService.getCollection('users');

  panel.innerHTML = `
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <h3 class="text-base font-bold text-gray-900">가입된 전체 교사 및 학생 명단</h3>
        <span class="text-xs text-gray-500">총 ${users.length}명의 이용자가 가입됨</span>
      </div>

      <div class="overflow-x-auto border border-gray-100 rounded-2xl">
        <table class="w-full text-left text-sm text-gray-500">
          <thead class="bg-gray-50 text-xs text-gray-700 uppercase font-semibold">
            <tr>
              <th class="px-6 py-4">이름</th>
              <th class="px-6 py-4">이메일</th>
              <th class="px-6 py-4">가입 역할</th>
              <th class="px-6 py-4">배정 학급 정보</th>
              <th class="px-6 py-4">담당/역할</th>
              <th class="px-6 py-4 text-center">계정 작업</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 bg-white">
            ${users.map(u => {
              let roleBadge = '';
              if (u.role === 'admin') {
                roleBadge = '<span class="bg-purple-50 text-purple-700 border border-purple-100 text-xs px-2 py-1 rounded-lg">관리자</span>';
              } else if (u.role === 'teacher') {
                roleBadge = '<span class="bg-amber-50 text-amber-700 border border-amber-100 text-xs px-2 py-1 rounded-lg">교사</span>';
              } else {
                roleBadge = '<span class="bg-blue-50 text-blue-700 border border-blue-100 text-xs px-2 py-1 rounded-lg">학생</span>';
              }

              const classInfo = u.grade && u.classNumber ? `${u.grade}학년 ${u.classNumber}반` : '학급 미배정';
              const assignedRoleText = u.assignedRole ? u.assignedRole : '-';

              return `
                <tr class="hover:bg-gray-50/50 transition-colors">
                  <td class="px-6 py-4 font-bold text-gray-900">${u.name}</td>
                  <td class="px-6 py-4 text-xs font-mono">${u.email}</td>
                  <td class="px-6 py-4">${roleBadge}</td>
                  <td class="px-6 py-4 text-sm font-semibold">${classInfo}</td>
                  <td class="px-6 py-4 text-sm text-gray-700">${assignedRoleText}</td>
                  <td class="px-6 py-4 text-center">
                    ${u.role !== 'admin' ? `
                      <button class="delete-user-btn text-xs bg-red-50 hover:bg-red-100 text-red-600 px-2 py-1 rounded-lg transition-colors cursor-pointer" data-uid="${u.uid}">
                        강제탈퇴
                      </button>
                    ` : '<span class="text-xs text-gray-400">보호됨</span>'}
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

  // Bind delete user handler
  panel.querySelectorAll('.delete-user-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const uid = btn.getAttribute('data-uid');
      if (await showConfirm('이 사용자를 정말 탈퇴 처리하시겠습니까? 관련 프로필 데이터가 유실될 수 있습니다.')) {
        await dbService.deleteDocument('users', uid);
        showToast("사용자 계정이 무력화(삭제)되었습니다.", "success");
        renderUsersPanel(panel);
      }
    });
  });
}

// Sub-Panel 4: School-Wide Notices
async function renderNoticesPanel(panel) {
  const notices = (await dbService.getCollection('notices')).filter(n => n.type === 'all');

  panel.innerHTML = `
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Create School Notice -->
      <div class="lg:col-span-1 bg-gray-50 p-6 rounded-2xl border border-gray-100">
        <h3 class="text-base font-bold text-gray-900 mb-4">📢 학교 전체 공지사항 배포</h3>
        <form id="add-notice-form" class="space-y-4">
          <div>
            <label class="block text-xs font-semibold text-gray-600 mb-1.5">공지 제목</label>
            <input name="title" type="text" placeholder="예: [안내] 학교 폭력 실태조사 공지" required class="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-blue-500">
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-600 mb-1.5">공지 내용</label>
            <textarea name="content" rows="4" placeholder="교사 및 학생에게 즉시 전파될 공지 내용을 작성해 주세요." required class="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-blue-500"></textarea>
          </div>
          <div class="flex items-center gap-2">
            <input id="notice-pinned" name="pinned" type="checkbox" value="true" class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500">
            <label for="notice-pinned" class="text-xs font-semibold text-gray-700 select-none">중요 공지로 지정하여 최상단에 고정</label>
          </div>
          <button type="submit" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm py-2.5 rounded-xl transition-colors cursor-pointer mt-2">
            전체 공지사항 발행
          </button>
        </form>
      </div>

      <!-- Notice Lists -->
      <div class="lg:col-span-2 space-y-4">
        <h3 class="text-base font-bold text-gray-900">발행된 학교 전체 공지</h3>
        <div class="space-y-3">
          ${notices.length === 0 ? `
            <div class="text-center py-20 text-gray-400 border border-dashed border-gray-200 rounded-2xl bg-white">
              배포된 전체 공지사항이 아직 존재하지 않습니다.
            </div>
          ` : notices.map(n => {
            return `
              <div class="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between gap-4 hover:border-gray-200 transition-all relative">
                <div class="flex items-start justify-between gap-2">
                  <div class="space-y-1">
                    <div class="flex items-center gap-2 flex-wrap">
                      ${n.pinned ? '<span class="bg-rose-50 border border-rose-100 text-rose-600 text-[10px] font-bold px-2 py-0.5 rounded-md">중요 고정</span>' : ''}
                      <span class="text-xs text-gray-400 font-medium">관리자 작성</span>
                    </div>
                    <h4 class="text-sm font-bold text-gray-900 mt-1">${n.title}</h4>
                  </div>
                  <button class="delete-notice-btn text-xs text-red-500 bg-red-50 hover:bg-red-100 hover:text-red-600 px-2 py-1 rounded-lg transition-colors cursor-pointer" data-id="${n.id}">
                    삭제
                  </button>
                </div>
                <p class="text-xs text-gray-600 whitespace-pre-wrap leading-relaxed border-t border-gray-50 pt-3">${n.content}</p>
                <div class="text-[10px] text-gray-400 font-mono mt-1 text-right">
                  발행일: ${n.createdAt ? formatDate(n.createdAt) : '-'}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    </div>
  `;

  // Notice Submit
  document.getElementById('add-notice-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const title = formData.get('title');
    const content = formData.get('content');
    const pinned = formData.get('pinned') === 'true';

    try {
      await dbService.addDocument('notices', {
        type: 'all',
        grade: null,
        classNumber: null,
        classId: '',
        title,
        content,
        pinned,
        imageUrl: '',
        createdBy: 'admin-1',
        createdByName: '교무부장'
      });
      showToast("전체 학교 공지사항이 즉시 배포되었습니다.", "success");
      renderNoticesPanel(panel);
    } catch (err) {
      showToast("공지 배포 실패", "error");
    }
  });

  // Notice Delete
  panel.querySelectorAll('.delete-notice-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const noticeId = btn.getAttribute('data-id');
      if (await showConfirm('이 공지사항을 정말 삭제하시겠습니까?')) {
        await dbService.deleteDocument('notices', noticeId);
        showToast("공지사항이 정상적으로 철회되었습니다.", "success");
        renderNoticesPanel(panel);
      }
    });
  });
}
