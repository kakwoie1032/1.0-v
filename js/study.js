/**
 * Study Time Tracker & Rankings (Yeolpumta Style) Controller
 */
import { dbService } from './firebase.js';
import { showToast, formatDuration, formatMinutes } from './utils.js';

let activeTimerInterval = null;

export function resetStudyTimer(currentUser) {
  if (activeTimerInterval) {
    clearInterval(activeTimerInterval);
    activeTimerInterval = null;
  }
  if (currentUser) {
    const sessionKey = `active_study_session_${currentUser.uid}`;
    if (localStorage.getItem(sessionKey)) {
      localStorage.removeItem(sessionKey);
      showToast("학습 타이머가 초기화되었습니다. (다른 메뉴로 이동)", "warning");
      dbService.updateDocument('users', currentUser.uid, { isStudying: false }).catch(console.error);
    }
  }
}

export async function renderStudyTracker(container, classId, currentUser) {
  const subjects = ['국어', '수학', '영어', '과학', '사회', '한국사', '기타'];
  const sessionKey = `active_study_session_${currentUser.uid}`;
  
  // Try to load any previously running session from localStorage
  let savedSession = null;
  try {
    const saved = localStorage.getItem(sessionKey);
    if (saved) savedSession = JSON.parse(saved);
  } catch (e) {
    savedSession = null;
  }

  container.innerHTML = `
    <div class="space-y-6">
      <!-- Active Stopwatch Panel -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <!-- Timer Core Left Column -->
        <div class="lg:col-span-1 bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 rounded-2xl shadow-md border border-slate-700/50 flex flex-col justify-between min-h-[380px] relative overflow-hidden">
          <div class="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl -mr-6 -mt-6"></div>
          
          <div class="z-10">
            <span class="bg-blue-500/20 text-blue-300 text-[10px] font-bold tracking-widest px-2.5 py-1 rounded-full uppercase border border-blue-500/30">
              STATION STOPWATCH
            </span>
            <div class="text-xs text-gray-400 mt-2 font-medium">열중하는 한 걸음이 위대한 결과를 만듭니다.</div>
          </div>

          <!-- Clock Face -->
          <div class="my-6 text-center z-10">
            <div id="stopwatch-display" class="text-4xl sm:text-5xl font-extrabold font-mono tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-cyan-200 to-emerald-300 drop-shadow">
              00:00:00
            </div>
            <div id="active-subject-badge" class="text-xs text-blue-300 font-semibold mt-2.5 hidden bg-blue-500/10 border border-blue-400/20 py-1 px-3.5 rounded-full inline-block">
              과목 미선택
            </div>
          </div>

          <!-- Controls Form -->
          <div id="study-controls-form" class="space-y-3 z-10">
            <!-- Subject select (only if idle) -->
            <div id="timer-setup-inputs" class="space-y-3">
              <div>
                <label class="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-wider">공부할 과목 선택</label>
                <select id="study-subject" class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-bold">
                  ${subjects.map(sub => `<option value="${sub}">${sub}</option>`).join('')}
                </select>
              </div>
              <div>
                <label class="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-wider">메모 기입 (오늘의 다짐)</label>
                <input id="study-memo" type="text" placeholder="예: 쎈 오답풀이 마감하기" class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-semibold">
              </div>
            </div>

            <button id="start-study-btn" class="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-3 rounded-xl transition-all cursor-pointer shadow-lg shadow-blue-500/20">
              🔥 공부 시작하기 (타이머 작동)
            </button>
            <button id="stop-study-btn" class="w-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-3 rounded-xl transition-all cursor-pointer hidden shadow-lg shadow-red-500/20">
              ⏸️ 공부 완료 (로그 기록 저장)
            </button>
          </div>
        </div>

        <!-- My Stat Accumulators Right columns -->
        <div class="lg:col-span-2 flex flex-col gap-6">
          
          <!-- Statistics Widgets -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div class="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
              <span class="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">오늘 학습 총량</span>
              <h3 id="stat-my-today" class="text-xl font-bold text-gray-800 mt-1 font-mono">0분</h3>
              <div id="stat-my-active-status" class="text-[10px] text-slate-400 font-semibold mt-1.5">💤 휴식 중</div>
            </div>
            <div class="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
              <span class="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">최근 주간 학습 합계</span>
              <h3 id="stat-my-weekly" class="text-xl font-bold text-gray-800 mt-1 font-mono">0분</h3>
              <div class="text-[10px] text-gray-400 font-medium mt-1.5">지난 7일간 기록</div>
            </div>
            <div class="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
              <span class="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">이번 달 월간 합계</span>
              <h3 id="stat-my-monthly" class="text-xl font-bold text-gray-800 mt-1 font-mono">0분</h3>
              <div class="text-[10px] text-gray-400 font-medium mt-1.5">지난 30일간 기록</div>
            </div>
          </div>

          <!-- Classroom Ranking Board -->
          <div class="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm shrink-1 grow">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-50 pb-3 mb-4">
              <div class="space-y-0.5">
                <h3 class="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                  🏆 실시간 우리 반 공부 시간 랭킹
                </h3>
                <p class="text-[10px] text-gray-400">학급 구성원들의 합산 공부 시간 순위표입니다.</p>
              </div>

              <!-- Filter Toggles -->
              <div class="flex gap-1.5 self-start sm:self-center">
                <button class="rank-toggle-btn px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white border border-blue-600 font-bold text-[10px] rounded-lg shadow-sm" data-period="today">오늘</button>
                <button class="rank-toggle-btn px-3 py-1 bg-white hover:border-gray-200 text-gray-500 border border-gray-100 font-bold text-[10px] rounded-lg" data-period="weekly">주간</button>
                <button class="rank-toggle-btn px-3 py-1 bg-white hover:border-gray-200 text-gray-500 border border-gray-100 font-bold text-[10px] rounded-lg" data-period="monthly">월간</button>
              </div>
            </div>

            <!-- Ranking table -->
            <div class="max-h-56 overflow-y-auto space-y-2.5 pr-1" id="ranking-list-box">
              <!-- ranking lists will load dynamically -->
            </div>
          </div>

        </div>
      </div>
    </div>
  `;

  const display = document.getElementById('stopwatch-display');
  const startBtn = document.getElementById('start-study-btn');
  const stopBtn = document.getElementById('stop-study-btn');
  const setupBox = document.getElementById('timer-setup-inputs');
  const activeSubjectBadge = document.getElementById('active-subject-badge');

  // Load My Stats
  async function loadMyStats() {
    const logs = await dbService.getCollectionWithFilter('studyLogs', 'studentUid', currentUser.uid);

    const todayStr = new Date().toISOString().split('T')[0];
    
    // Calculate periods
    const todayMins = logs
      .filter(l => l.createdAt && l.createdAt.startsWith(todayStr))
      .reduce((sum, l) => sum + (l.durationMinutes || 0), 0);

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const weeklyMins = logs
      .filter(l => l.createdAt && l.createdAt >= sevenDaysAgo)
      .reduce((sum, l) => sum + (l.durationMinutes || 0), 0);

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const monthlyMins = logs
      .filter(l => l.createdAt && l.createdAt >= thirtyDaysAgo)
      .reduce((sum, l) => sum + (l.durationMinutes || 0), 0);

    const tEl = document.getElementById('stat-my-today');
    const wEl = document.getElementById('stat-my-weekly');
    const mEl = document.getElementById('stat-my-monthly');

    if (tEl) tEl.textContent = formatMinutes(todayMins);
    if (wEl) wEl.textContent = formatMinutes(weeklyMins);
    if (mEl) mEl.textContent = formatMinutes(monthlyMins);
  }

  // Active Timer Interval Orchestrator
  function startTickInterval(startTimeMs) {
    if (activeTimerInterval) clearInterval(activeTimerInterval);
    activeTimerInterval = setInterval(() => {
      const elapsedSecs = Math.floor((Date.now() - startTimeMs) / 1000);
      display.textContent = formatDuration(elapsedSecs);
    }, 1000);
  }

  // Stop Timer Interval
  function stopTickInterval() {
    if (activeTimerInterval) {
      clearInterval(activeTimerInterval);
      activeTimerInterval = null;
    }
  }

  // Check if session is already running
  if (savedSession) {
    setupBox.classList.add('hidden');
    startBtn.classList.add('hidden');
    stopBtn.classList.remove('hidden');
    activeSubjectBadge.textContent = `🎯 ${savedSession.subject} 공부 중 🔥`;
    activeSubjectBadge.classList.remove('hidden');

    const activeStatusEl = document.getElementById('stat-my-active-status');
    if (activeStatusEl) {
      activeStatusEl.innerHTML = '🔥 열공 모드 작동 중';
      activeStatusEl.className = 'text-[10px] text-green-500 font-bold mt-1.5';
    }

    startTickInterval(savedSession.startTimeMs);
    
    // Update DB to true in case it got cleared or out of sync
    dbService.updateDocument('users', currentUser.uid, { isStudying: true }).catch(console.error);
  } else {
    const activeStatusEl = document.getElementById('stat-my-active-status');
    if (activeStatusEl) {
      activeStatusEl.innerHTML = '💤 휴식 중';
      activeStatusEl.className = 'text-[10px] text-slate-400 font-semibold mt-1.5';
    }
    // Update DB to false to ensure sync
    dbService.updateDocument('users', currentUser.uid, { isStudying: false }).catch(console.error);
  }

  // Start study handler
  startBtn.addEventListener('click', async () => {
    const subject = document.getElementById('study-subject').value;
    const memo = document.getElementById('study-memo').value;
    const startTimeMs = Date.now();

    const sessionData = {
      subject,
      memo,
      startTimeMs
    };

    try {
      localStorage.setItem(sessionKey, JSON.stringify(sessionData));
    } catch (e) {
      console.warn("localStorage quota exceeded, timer will not survive reload", e);
    }

    setupBox.classList.add('hidden');
    startBtn.classList.add('hidden');
    stopBtn.classList.remove('hidden');
    activeSubjectBadge.textContent = `🎯 ${subject} 공부 중 🔥`;
    activeSubjectBadge.classList.remove('hidden');

    const activeStatusEl = document.getElementById('stat-my-active-status');
    if (activeStatusEl) {
      activeStatusEl.innerHTML = '🔥 열공 모드 작동 중';
      activeStatusEl.className = 'text-[10px] text-green-500 font-bold mt-1.5';
    }

    startTickInterval(startTimeMs);
    showToast(`'${subject}' 공부를 시작합니다! 타이머 작동 중..`, "success");

    // Update database status
    try {
      await dbService.updateDocument('users', currentUser.uid, { isStudying: true });
      await loadLeaderboard('today'); // Reload list to show active status
    } catch (err) {
      console.error(err);
    }
  });

  // Stop study handler
  stopBtn.addEventListener('click', async () => {
    stopTickInterval();
    const activeSession = JSON.parse(localStorage.getItem(sessionKey));
    if (!activeSession) return;

    const endTimeMs = Date.now();
    const totalSeconds = Math.floor((endTimeMs - activeSession.startTimeMs) / 1000);

    // Update database status to false immediately
    try {
      await dbService.updateDocument('users', currentUser.uid, { isStudying: false });
    } catch (err) {
      console.error(err);
    }

    // Minimum 5 minutes required (5 * 60 = 300 seconds)
    if (totalSeconds < 300) {
      localStorage.removeItem(sessionKey);
      showToast("5분 미만으로 공부한 세션은 기록되지 않습니다. (최소 5분 이상 공부해야 기록됩니다)", "warning");

      // Reset Stopwatch visual states
      display.textContent = '00:00:00';
      setupBox.classList.remove('hidden');
      startBtn.classList.remove('hidden');
      stopBtn.classList.add('hidden');
      activeSubjectBadge.classList.add('hidden');

      const activeStatusEl = document.getElementById('stat-my-active-status');
      if (activeStatusEl) {
        activeStatusEl.innerHTML = '💤 휴식 중';
        activeStatusEl.className = 'text-[10px] text-slate-400 font-semibold mt-1.5';
      }

      // Refresh data
      await loadMyStats();
      await loadLeaderboard('today');
      return;
    }

    const durationMinutes = Math.floor(totalSeconds / 60);

    try {
      await dbService.addDocument('studyLogs', {
        classId,
        studentUid: currentUser.uid,
        studentName: currentUser.name,
        subject: activeSession.subject,
        memo: activeSession.memo,
        startTime: new Date(activeSession.startTimeMs).toISOString(),
        endTime: new Date(endTimeMs).toISOString(),
        durationMinutes
      });

      localStorage.removeItem(sessionKey);
      showToast(`수고하셨습니다! 총 ${durationMinutes}분 동안 공부를 완료했습니다!`, "success");

      // Reset Stopwatch visual states
      display.textContent = '00:00:00';
      setupBox.classList.remove('hidden');
      startBtn.classList.remove('hidden');
      stopBtn.classList.add('hidden');
      activeSubjectBadge.classList.add('hidden');

      const activeStatusEl = document.getElementById('stat-my-active-status');
      if (activeStatusEl) {
        activeStatusEl.innerHTML = '💤 휴식 중';
        activeStatusEl.className = 'text-[10px] text-slate-400 font-semibold mt-1.5';
      }

      // Refresh data
      await loadMyStats();
      await loadLeaderboard('today');
    } catch (err) {
      showToast("공부 로그 저장 실패", "error");
    }
  });

  // Load Ranking list
  async function loadLeaderboard(period = 'today') {
    const rListBox = document.getElementById('ranking-list-box');
    rListBox.innerHTML = `<div class="flex justify-center items-center py-8"><svg class="animate-spin h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg></div>`;

    const allLogs = await dbService.getCollectionWithFilter('studyLogs', 'classId', classId);
    
    // Group and sum minutes
    const summary = {}; // uid -> { name, minutes, isStudying }

    const todayStr = new Date().toISOString().split('T')[0];
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    allLogs.forEach(log => {
      let isEligible = false;
      if (period === 'today' && log.createdAt && log.createdAt.startsWith(todayStr)) {
        isEligible = true;
      } else if (period === 'weekly' && log.createdAt && log.createdAt >= sevenDaysAgo) {
        isEligible = true;
      } else if (period === 'monthly' && log.createdAt && log.createdAt >= thirtyDaysAgo) {
        isEligible = true;
      }

      if (isEligible) {
        const uid = log.studentUid;
        if (!summary[uid]) {
          summary[uid] = { name: log.studentName, minutes: 0, isStudying: false };
        }
        summary[uid].minutes += log.durationMinutes || 0;
      }
    });

    // Also inject classmates who might not have logs for this period to display complete roster
    const allUsers = await dbService.getCollection('users');
    const classStudents = allUsers.filter(u => u.role === 'student' && `${u.grade}-${u.classNumber}` === classId);
    classStudents.forEach(s => {
      if (!summary[s.uid]) {
        summary[s.uid] = { name: s.name, minutes: 0, isStudying: s.isStudying || false };
      } else {
        summary[s.uid].isStudying = s.isStudying || false;
      }
    });

    const sortedList = Object.values(summary).sort((a,b) => b.minutes - a.minutes);

    rListBox.innerHTML = sortedList.length === 0 ? `
      <div class="text-center py-10 text-gray-400 text-xs">순위 정보가 없습니다.</div>
    ` : sortedList.map((entry, index) => {
      let rankingMedal = '';
      if (index === 0) rankingMedal = '🥇';
      else if (index === 1) rankingMedal = '🥈';
      else if (index === 2) rankingMedal = '🥉';
      else rankingMedal = `<span class="text-xs font-mono font-bold text-gray-400 w-5 inline-block text-center">${index + 1}</span>`;

      return `
        <div class="flex items-center justify-between p-3 rounded-xl border border-gray-50 bg-gray-50/20 hover:border-gray-100 transition-all">
          <div class="flex items-center gap-3">
            <div class="shrink-0 text-base">${rankingMedal}</div>
            <div class="font-bold text-xs text-gray-800">${entry.name}</div>
          </div>
          <div class="text-xs font-bold text-gray-700 font-mono flex items-center gap-2">
            <span>${formatMinutes(entry.minutes)}</span>
            ${entry.isStudying ? '<span class="text-[9px] bg-red-50 text-red-500 border border-red-100 px-1 py-0.5 rounded-md animate-pulse">공부 중</span>' : ''}
          </div>
        </div>
      `;
    }).join('');
  }

  // Bind period buttons
  const rankButtons = container.querySelectorAll('.rank-toggle-btn');
  rankButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      rankButtons.forEach(b => {
        b.classList.remove('bg-blue-600', 'border-blue-600', 'text-white', 'shadow-sm');
        b.classList.add('bg-white', 'border-gray-100', 'text-gray-500');
      });
      btn.classList.remove('bg-white', 'border-gray-100', 'text-gray-500');
      btn.classList.add('bg-blue-600', 'border-blue-600', 'text-white', 'shadow-sm');

      const activePeriod = btn.getAttribute('data-period');
      loadLeaderboard(activePeriod);
    });
  });

  // Initialize
  await loadMyStats();
  await loadLeaderboard('today');
}
