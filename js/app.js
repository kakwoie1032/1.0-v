/**
 * Main Application Coordinator & Session Orchestrator
 */
import { initializeFirebase, authService, isUsingRealFirebase, saveFirebaseConfig, clearFirebaseConfig, getSavedFirebaseConfig } from './firebase.js';
import { renderAdminDashboard } from './admin.js';
import { renderTeacherDashboard } from './teacher.js';
import { renderStudentDashboard } from './student.js';
import { showToast } from './utils.js';
import { logoutUser, loginStudentByInfo } from './auth.js';

// Global DOM elements
let appRoot = null;

// Application bootstrap
document.addEventListener('DOMContentLoaded', async () => {
  appRoot = document.getElementById('root');
  
  // Create beautiful dynamic initial loading screen
  appRoot.innerHTML = `
    <div class="min-h-screen flex flex-col justify-center items-center bg-gray-50 p-6">
      <div class="flex flex-col items-center gap-4 text-center">
        <!-- School Icon pulse -->
        <div class="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100 flex items-center justify-center animate-bounce shadow-sm">
          <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.168.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
        </div>
        <h1 class="text-xl font-bold text-gray-900">학급 종합 관리 프로그램</h1>
        <p class="text-sm text-gray-500 font-medium">데이터베이스 연동을 부팅하는 중입니다..</p>
      </div>
    </div>
  `;

  // 1. Initial active Firebase Mode Check
  await initializeFirebase();
  
  // 2. Validate login session
  const currentUser = authService.getCurrentUser();
  
  if (currentUser) {
    renderAppShell(currentUser);
  } else {
    renderLoginScreen();
  }
});

// Render Main App layout with sidebar & wrapper
function renderAppShell(user) {
  const isReal = isUsingRealFirebase();
  const connectionBadge = isReal 
    ? `<span class="bg-green-100 text-green-800 border border-green-200 text-[10px] font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
         <span class="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
         실제 Cloud Firebase 연동 중
       </span>`
    : `<span class="bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
         <span class="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></span>
         임시 데모 모드 (Local DB)
       </span>`;

  appRoot.innerHTML = `
    <div class="min-h-screen bg-slate-50 flex flex-col">
      <!-- Top Navigation bar -->
      <header class="bg-white border-b border-gray-100 sticky top-0 z-40 px-4 sm:px-6 py-3.5 shadow-sm">
        <div class="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <!-- Logo & Brand -->
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center font-bold shadow-sm shadow-blue-500/10">
              🏫
            </div>
            <div>
              <span class="text-sm font-extrabold text-gray-900 tracking-tight block">학급 종합 관리 프로그램</span>
              <span class="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">Class Management Console</span>
            </div>
          </div>

          <!-- Quick status center & controls -->
          <div class="flex items-center gap-2 sm:gap-3 flex-wrap">
            ${connectionBadge}
            
            <button id="open-config-btn" class="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs px-3 py-2 rounded-xl border border-gray-200 cursor-pointer transition-all flex items-center gap-1">
              ⚙️ Firebase 설정
            </button>
            <button id="logout-btn" class="bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs px-3 py-2 rounded-xl border border-red-100 cursor-pointer transition-all">
              로그아웃
            </button>
          </div>
        </div>
      </header>

      <!-- Main Canvas Wrapper -->
      <main class="flex-grow max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 animate-fade-in" id="dashboard-canvas">
        <!-- Sub-dashboards injected here -->
      </main>

      <!-- Minimal clean footer -->
      <footer class="bg-white border-t border-gray-100 py-4 px-6 text-center text-xs text-gray-400 font-medium">
        © 2026 학급 종합 관리 프로그램. Powered by Firebase Firestore & Storage.
      </footer>
    </div>

    <!-- Firebase Configuration Modal Dialog -->
    <div id="config-modal" class="hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-center items-center p-4">
      <div class="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-gray-100 shadow-2xl space-y-5 animate-fade-in">
        <div class="space-y-1.5">
          <h3 class="text-base font-bold text-gray-900 flex items-center gap-1.5">⚙️ 실제 Firebase 연동 구성</h3>
          <p class="text-xs text-gray-500 leading-relaxed">자신의 실제 Firebase 프로젝트 자격증명을 등록하면, 실시간 클라우드 DB와 파일 스토리지가 작동합니다.</p>
        </div>

        <form id="config-form" class="space-y-4 text-xs font-semibold text-gray-600">
          <div class="space-y-1">
            <label class="block mb-1">firebaseConfig JSON 객체 붙여넣기</label>
            <textarea id="config-json-input" rows="7" placeholder='{&#10;  "apiKey": "AIzaSy...",&#10;  "authDomain": "...",&#10;  "projectId": "...",&#10;  "storageBucket": "...",&#10;  "messagingSenderId": "...",&#10;  "appId": "..."&#10;}' class="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 font-mono text-[11px] focus:outline-none focus:border-blue-500 text-gray-700"></textarea>
          </div>

          <div class="flex gap-2">
            <button id="close-config-btn" type="button" class="w-1/2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 rounded-xl text-xs cursor-pointer">
              취소
            </button>
            <button type="submit" class="w-1/2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-xs cursor-pointer">
              설정 저장 및 새로고침
            </button>
          </div>
        </form>

        <div class="border-t border-gray-100 pt-3 flex justify-between items-center text-[10px] text-gray-400">
          <span>저장 시 자동으로 동기화됩니다.</span>
          <button id="reset-config-btn" class="text-red-500 hover:text-red-700 font-bold cursor-pointer underline">
            설정 초기화 (데모 복귀)
          </button>
        </div>
      </div>
    </div>
  `;

  // Bind top navbar controls
  document.getElementById('logout-btn').addEventListener('click', () => {
    logoutUser();
  });

  const modal = document.getElementById('config-modal');
  document.getElementById('open-config-btn').addEventListener('click', () => {
    const saved = getSavedFirebaseConfig();
    if (saved) {
      document.getElementById('config-json-input').value = JSON.stringify(saved, null, 2);
    }
    modal.classList.remove('hidden');
  });

  document.getElementById('close-config-btn').addEventListener('click', () => {
    modal.classList.add('hidden');
  });

  // Handle saving Firebase configuration
  document.getElementById('config-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const rawJson = document.getElementById('config-json-input').value.trim();
    if (!rawJson) {
      showToast("내용을 입력해 주세요.", "error");
      return;
    }

    try {
      const parsed = JSON.parse(rawJson);
      if (!parsed.apiKey || !parsed.projectId) {
        throw new Error("Invalid configuration structure.");
      }

      saveFirebaseConfig(parsed);
      showToast("Firebase 설정 저장 완료! 새로고침합니다.", "success");
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      showToast("올바른 JSON 형식이 아닙니다. 형식을 확인해 주세요.", "error");
    }
  });

  // Reset Firebase config to return to Demo Mock Mode
  document.getElementById('reset-config-btn').addEventListener('click', () => {
    if (confirm("Firebase 설정을 초기화하고 로컬 데모 모드로 복귀하시겠습니까?")) {
      clearFirebaseConfig();
      showToast("설정이 지워졌습니다. 데모 모드로 전환합니다.", "success");
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  });

  // Render Sub view dashboards
  const canvas = document.getElementById('dashboard-canvas');
  if (user.role === 'admin') {
    renderAdminDashboard(canvas, user);
  } else if (user.role === 'teacher') {
    renderTeacherDashboard(canvas, user);
  } else if (user.role === 'student') {
    renderStudentDashboard(canvas, user);
  }
}

// Render Elegant Login/Register Interface
function renderLoginScreen() {
  let isRegisterView = false;
  let activeLoginTab = 'student'; // 'student' or 'teacher'

  const updateCardContent = () => {
    const cardTitle = document.getElementById('auth-card-title');
    const cardSubtitle = document.getElementById('auth-card-subtitle');
    const authFormContainer = document.getElementById('auth-form-container');
    const toggleAuthViewBtn = document.getElementById('toggle-auth-view');

    if (!isRegisterView) {
      // Show Login Form with Tabs
      cardTitle.textContent = '계정 로그인';
      cardSubtitle.textContent = 'LOG INTO YOUR CLASSROOM';
      
      authFormContainer.innerHTML = `
        <div class="flex border-b border-gray-100 mb-5 select-none">
          <button id="tab-student-login" class="flex-1 pb-3 text-xs font-extrabold transition-all border-b-2 text-center cursor-pointer ${activeLoginTab === 'student' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-600'}">
            👦 학생 로그인
          </button>
          <button id="tab-teacher-login" class="flex-1 pb-3 text-xs font-extrabold transition-all border-b-2 text-center cursor-pointer ${activeLoginTab === 'teacher' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-600'}">
            🧑‍🏫 교직원 / 관리자
          </button>
        </div>

        ${activeLoginTab === 'student' ? `
          <form id="student-login-form" class="space-y-4 animate-fade-in">
            <div>
              <label class="block text-xs font-semibold text-gray-500 mb-1.5">학번</label>
              <input id="login-student-id" type="text" placeholder="예: 30415 또는 3-4-15 (3학년 4반 15번)" required class="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-gray-700 focus:outline-none focus:border-blue-500">
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-500 mb-1.5">이름</label>
              <input id="login-student-name" type="text" placeholder="학생 본명 입력" required class="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-gray-700 focus:outline-none focus:border-blue-500">
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-500 mb-1.5">비밀번호</label>
              <input id="login-student-password" type="password" placeholder="비밀번호 입력" required class="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-gray-700 focus:outline-none focus:border-blue-500">
            </div>
            <button type="submit" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs py-3 rounded-xl transition-all cursor-pointer shadow-lg shadow-blue-500/10">
              학생으로 안전하게 로그인하기
            </button>
          </form>
        ` : `
          <form id="teacher-login-form" class="space-y-4 animate-fade-in">
            <div>
              <label class="block text-xs font-semibold text-gray-500 mb-1.5">이메일 주소 (ID)</label>
              <input id="login-email" type="email" placeholder="email@school.com" required class="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-gray-700 focus:outline-none focus:border-blue-500">
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-500 mb-1.5">비밀번호</label>
              <input id="login-password" type="password" placeholder="비밀번호 입력" required class="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-gray-700 focus:outline-none focus:border-blue-500">
            </div>
            <button type="submit" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs py-3 rounded-xl transition-all cursor-pointer shadow-lg shadow-blue-500/10">
              안전하게 로그인하기
            </button>
          </form>
        `}
      `;
      toggleAuthViewBtn.innerHTML = `선생님이신가요? <span class="text-blue-600 font-bold hover:underline">선생님 회원가입하기</span>`;

      // Bind tab switchers
      const tabStudent = document.getElementById('tab-student-login');
      const tabTeacher = document.getElementById('tab-teacher-login');
      if (tabStudent && tabTeacher) {
        tabStudent.addEventListener('click', () => {
          activeLoginTab = 'student';
          updateCardContent();
        });
        tabTeacher.addEventListener('click', () => {
          activeLoginTab = 'teacher';
          updateCardContent();
        });
      }

      // Re-bind student login submit
      const studentForm = document.getElementById('student-login-form');
      if (studentForm) {
        studentForm.addEventListener('submit', async (e) => {
          e.preventDefault();
          const studentId = document.getElementById('login-student-id').value.trim();
          const name = document.getElementById('login-student-name').value.trim();
          const pass = document.getElementById('login-student-password').value;

          try {
            const user = await loginStudentByInfo(studentId, name, pass);
            renderAppShell(user);
          } catch (err) {
            console.error(err);
          }
        });
      }

      // Re-bind teacher login submit
      const teacherForm = document.getElementById('teacher-login-form');
      if (teacherForm) {
        teacherForm.addEventListener('submit', async (e) => {
          e.preventDefault();
          const email = document.getElementById('login-email').value.trim();
          const pass = document.getElementById('login-password').value;

          try {
            const user = await authService.login(email, pass);
            renderAppShell(user);
          } catch (err) {
            console.error(err);
          }
        });
      }
    } else {
      // Show Register Form (Teacher Only)
      cardTitle.textContent = '선생님 회원가입';
      cardSubtitle.textContent = 'CREATE YOUR TEACHER ACCOUNT';
      authFormContainer.innerHTML = `
        <form id="register-form" class="space-y-3.5 animate-fade-in">
          <div>
            <label class="block text-xs font-semibold text-gray-500 mb-1">사용자 본명 (선생님 성함)</label>
            <input id="register-name" type="text" placeholder="예: 김교사" required class="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-gray-700 focus:outline-none focus:border-blue-500">
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-500 mb-1">이메일 주소 (ID)</label>
            <input id="register-email" type="email" placeholder="example@school.com" required class="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-gray-700 focus:outline-none focus:border-blue-500">
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-500 mb-1">비밀번호 설정</label>
            <input id="register-password" type="password" minlength="6" placeholder="최소 6자리 이상 입력" required class="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-gray-700 focus:outline-none focus:border-blue-500">
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold text-gray-500 mb-1">담당 학년</label>
              <input id="register-grade" type="number" min="1" max="6" value="1" required class="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-gray-700 focus:outline-none focus:border-blue-500">
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-500 mb-1">담당 학급 (반)</label>
              <input id="register-class" type="number" min="1" max="20" value="3" required class="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-gray-700 focus:outline-none focus:border-blue-500">
            </div>
          </div>
          <button type="submit" class="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-3 rounded-xl transition-all cursor-pointer shadow-lg shadow-emerald-500/10 mt-1">
            선생님 계정 생성하기
          </button>
        </form>
      `;
      toggleAuthViewBtn.innerHTML = `이미 계정이 있으신가요? <span class="text-blue-600 font-bold hover:underline">로그인하기</span>`;

      // Register submit handler
      document.getElementById('register-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('register-name').value.trim();
        const email = document.getElementById('register-email').value.trim();
        const password = document.getElementById('register-password').value;
        const grade = parseInt(document.getElementById('register-grade').value);
        const classNumber = parseInt(document.getElementById('register-class').value);

        try {
          const userData = {
            name,
            role: 'teacher',
            grade,
            classNumber,
            assignedRole: ''
          };

          await authService.registerUser(email, password, userData);
          showToast(`${name} 선생님의 계정이 성공적으로 생성되었습니다!`, 'success');
          
          // Auto login after register
          const user = await authService.login(email, password);
          renderAppShell(user);
        } catch (err) {
          console.error(err);
        }
      });
    }
  };

  appRoot.innerHTML = `
    <div class="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 lg:p-8 animate-fade-in relative">
      <!-- Ambient background decoration -->
      <div class="absolute top-20 left-20 w-72 h-72 bg-blue-100/40 rounded-full blur-3xl -z-10 animate-pulse"></div>
      <div class="absolute bottom-20 right-20 w-96 h-96 bg-emerald-100/30 rounded-full blur-3xl -z-10 animate-pulse"></div>

      <div class="max-w-md w-full space-y-6">
        <!-- Logo Header -->
        <div class="flex flex-col items-center gap-3.5 text-center">
          <div class="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center text-2xl shadow-lg shadow-blue-500/20 font-bold">
            🏫
          </div>
          <div>
            <h1 class="text-2xl font-black text-gray-900 tracking-tight">학급 종합 관리 프로그램</h1>
            <p class="text-xs text-gray-400 mt-1 font-bold">선생님과 학생을 잇는 우리 반 올인원 공간</p>
          </div>
        </div>

        <!-- Auth Card -->
        <div class="bg-white p-8 rounded-3xl border border-gray-100 shadow-xl space-y-5 relative">
          <div class="text-center pb-2 border-b border-gray-50">
            <h3 id="auth-card-title" class="text-base font-bold text-gray-800">계정 로그인</h3>
            <span id="auth-card-subtitle" class="text-[10px] text-gray-400 font-bold">LOG INTO YOUR CLASSROOM</span>
          </div>

          <!-- Dynamic form container -->
          <div id="auth-form-container"></div>

          <!-- View toggler -->
          <div class="text-center pt-2">
            <button id="toggle-auth-view" class="text-xs text-gray-500 font-semibold hover:text-gray-700 transition-colors cursor-pointer outline-none">
              아직 계정이 없으신가요? 회원가입하기
            </button>
          </div>
        </div>

        <!-- MVP QUICK-TEST LOGINS CARD -->
        <div class="bg-white p-6 rounded-3xl border border-gray-100 shadow-lg space-y-4">
          <div class="space-y-1">
            <h4 class="text-xs font-bold text-gray-800 flex items-center gap-1">⚡ MVP 즉시 테스트용 퀵로그인</h4>
            <p class="text-[10px] text-gray-400 font-medium">실행을 위해 아래 각 역할별 시연용 계정 단추를 누르면 즉시 로그인 상태로 대시보드에 진입합니다.</p>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <button class="quick-login-btn bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-100 p-3 rounded-2xl text-xs font-bold transition-all cursor-pointer text-left flex flex-col justify-between h-20" data-email="admin@school.com" data-pass="admin123">
              <span>👑 관리자 마스터</span>
              <span class="text-[9px] text-purple-500/80 font-semibold font-mono">admin@school.com</span>
            </button>
            <button class="quick-login-btn bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-100 p-3 rounded-2xl text-xs font-bold transition-all cursor-pointer text-left flex flex-col justify-between h-20" data-email="teacher@school.com" data-pass="teacher123">
              <span>🧑‍🏫 담임 선생님</span>
              <span class="text-[9px] text-amber-500/80 font-semibold font-mono">teacher@school.com</span>
            </button>
            <button class="quick-login-btn bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-100 p-3 rounded-2xl text-xs font-bold transition-all cursor-pointer text-left flex flex-col justify-between h-20" data-email="student1@school.com" data-pass="student123">
              <span>👦 일반 학급학생</span>
              <span class="text-[9px] text-blue-500/80 font-semibold font-mono">student1@school.com</span>
            </button>
            <button class="quick-login-btn bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-100 p-3 rounded-2xl text-xs font-bold transition-all cursor-pointer text-left flex flex-col justify-between h-20" data-email="student2@school.com" data-pass="student234">
              <span>📜 학급 서기학생</span>
              <span class="text-[9px] text-teal-500/80 font-semibold font-mono">student2@school.com</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Bind view switcher
  document.getElementById('toggle-auth-view').addEventListener('click', () => {
    isRegisterView = !isRegisterView;
    updateCardContent();
  });

  // Bind quick logins globally so they are active in both login and register views
  document.querySelectorAll('.quick-login-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const email = btn.getAttribute('data-email');
      const pass = btn.getAttribute('data-pass');

      try {
        const user = await authService.login(email, pass);
        renderAppShell(user);
      } catch (err) {
        console.error(err);
      }
    });
  });

  // Load initial view content (Login form)
  updateCardContent();
}
