/**
 * Student & Secretary Dashboard Controller
 */
import { dbService } from './firebase.js';
import { showToast, formatDate, getKoreanDayOfWeek, calculateDDay, generateId, showConfirm } from './utils.js';
import { renderClassBoard } from './board.js';
import { renderStudyTracker, resetStudyTimer } from './study.js';
import { renderStudentsPanel, renderRolesPanel, renderBoardPanel, renderTimetablePanel } from './teacher.js';

export async function renderStudentDashboard(container, currentUser) {
  const grade = currentUser.grade;
  const classNumber = currentUser.classNumber;
  const classId = `${grade}-${classNumber}`;
  const isSecretary = currentUser.assignedRole === '서기';

  container.innerHTML = `
    <div class="space-y-6">
      <!-- Student Dashboard Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
        <div class="space-y-2">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="bg-blue-50 text-blue-700 text-xs px-3 py-1 rounded-xl font-extrabold border border-blue-100 shadow-sm">
              🏫 ${grade}학년 ${classNumber}반 공간
            </span>
            ${isSecretary ? '<span class="bg-teal-50 border border-teal-100 text-teal-700 text-xs px-3 py-1 rounded-xl font-extrabold flex items-center gap-1 shadow-sm">✨ 학급서기 특임요원</span>' : ''}
          </div>
          <h1 class="text-3xl font-black text-slate-900 tracking-tight mt-1">${currentUser.name} 학생 대시보드</h1>
        </div>
        
        <!-- 1인 1역 Card -->
        <div class="bg-slate-900 border border-slate-800 p-4.5 rounded-2xl flex items-center gap-4 self-start sm:self-center text-white shadow-lg shadow-slate-950/10">
          <div class="p-2.5 bg-slate-800 text-blue-400 rounded-xl shrink-0">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
          </div>
          <div>
            <div class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">나의 학급 1인 1역</div>
            <div class="text-sm font-extrabold text-blue-300 mt-0.5">${currentUser.assignedRole || '임무 대기 중'}</div>
          </div>
        </div>
      </div>

      <!-- Student Tabs (Bento Style Pills) -->
      <div class="flex items-center gap-2 overflow-x-auto pb-2 select-none scrollbar-hide">
        <button class="student-tab-btn px-4 py-2.5 rounded-xl font-bold text-xs transition-all border flex items-center gap-2 cursor-pointer bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/15" data-tab="home">
          🏠 학급 종합 판넬
        </button>
        <button class="student-tab-btn px-4 py-2.5 rounded-xl font-semibold text-xs transition-all border flex items-center gap-2 cursor-pointer bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300" data-tab="study">
          ⏱️ 학습 타이머
        </button>
        <button class="student-tab-btn px-4 py-2.5 rounded-xl font-semibold text-xs transition-all border flex items-center gap-2 cursor-pointer bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300" data-tab="personal-timetable">
          📅 개인 시간표
        </button>
        <button class="student-tab-btn px-4 py-2.5 rounded-xl font-semibold text-xs transition-all border flex items-center gap-2 cursor-pointer bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300" data-tab="board">
          💬 학급 소통 게시판
        </button>
        ${isSecretary ? `
          <button class="student-tab-btn px-4 py-2.5 rounded-xl font-semibold text-xs transition-all border flex items-center gap-2 cursor-pointer bg-white border-slate-200 text-teal-600 hover:bg-teal-50 hover:border-teal-300" data-tab="secretary">
            📜 서기 특임 집무실
          </button>
        ` : ''}
      </div>

      <!-- Tab View Screen -->
      <div id="student-tab-panel" class="min-h-[400px]">
        <!-- Content will be swapped here -->
      </div>
    </div>
  `;

  // Navigation binders
  const tabs = container.querySelectorAll('.student-tab-btn');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => {
        t.className = 'student-tab-btn px-4 py-2.5 rounded-xl font-semibold text-xs transition-all border flex items-center gap-2 cursor-pointer bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300';
        if (t.getAttribute('data-tab') === 'secretary') {
          t.className = 'student-tab-btn px-4 py-2.5 rounded-xl font-semibold text-xs transition-all border flex items-center gap-2 cursor-pointer bg-white border-slate-200 text-teal-600 hover:bg-teal-50 hover:border-teal-300';
        }
      });
      
      const target = tab.getAttribute('data-tab');
      if (target === 'secretary') {
        tab.className = 'student-tab-btn px-4 py-2.5 rounded-xl font-bold text-xs transition-all border flex items-center gap-2 cursor-pointer bg-teal-600 border-teal-600 text-white shadow-md shadow-teal-500/15';
      } else {
        tab.className = 'student-tab-btn px-4 py-2.5 rounded-xl font-bold text-xs transition-all border flex items-center gap-2 cursor-pointer bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/15';
      }

      switchTab(target);
    });
  });

  async function switchTab(tabName) {
    if (tabName !== 'study') {
      resetStudyTimer(currentUser);
    }
    const panel = document.getElementById('student-tab-panel');
    panel.innerHTML = `<div class="flex justify-center items-center py-20"><svg class="animate-spin h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg></div>`;

    if (tabName === 'home') {
      await renderHomePanel(panel, classId, grade, classNumber, currentUser);
    } else if (tabName === 'study') {
      await renderStudyTracker(panel, classId, currentUser);
    } else if (tabName === 'personal-timetable') {
      await renderPersonalTimetable(panel, currentUser, classId);
    } else if (tabName === 'board') {
      await renderClassBoard(panel, classId, currentUser);
    } else if (tabName === 'secretary') {
      await renderSecretaryPanel(panel, classId, grade, classNumber);
    }
  }

  // Load Home Screen on First Render
  await switchTab('home');
}

// PANEL 1: Dynamic Classroom Home Overview
async function renderHomePanel(panel, classId, grade, classNumber, currentUser) {
  const todayStr = formatDate();
  const dayOfWeekEn = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase(); // e.g. "monday"

  // Fetch meals
  const mealDocs = await dbService.getCollectionWithFilter('meals', 'classId', classId);
  const todaysMeal = mealDocs.find(m => m.date === todayStr);

  // Fetch timetable
  const timetableDocs = await dbService.getCollectionWithFilter('timetables', 'classId', classId);
  const classTimetable = timetableDocs.length > 0 ? timetableDocs[0] : null;

  // Fetch personal timetable if exists
  let personalTimetable = null;
  if (currentUser) {
    const pTimetables = await dbService.getCollectionWithFilter('personalTimetables', 'studentUid', currentUser.uid);
    personalTimetable = pTimetables.length > 0 ? pTimetables[0] : null;
  }
  const isUsingPersonal = personalTimetable !== null;
  const displayedTimetable = isUsingPersonal ? personalTimetable : classTimetable;

  // Fetch D-Days
  const ddays = await dbService.getCollectionWithFilter('ddays', 'classId', classId);
  const pinnedDdays = ddays.filter(d => d.pinned).sort((a,b) => a.targetDate.localeCompare(b.targetDate));
  const otherDdays = ddays.filter(d => !d.pinned).sort((a,b) => a.targetDate.localeCompare(b.targetDate));
  const mergedDdays = [...pinnedDdays, ...otherDdays];

  // Fetch Notices (school-wide + class notices)
  const schoolNotices = (await dbService.getCollection('notices')).filter(n => n.type === 'all');
  const classNotices = (await dbService.getCollectionWithFilter('notices', 'classId', classId));
  const mergedNotices = [...schoolNotices, ...classNotices].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  panel.innerHTML = `
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 items-start">
      
      <!-- Bento Tile 1: School & Class Notices Board (span 7) -->
      <div class="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 lg:col-span-7 md:col-span-2 hover:shadow-md transition-all duration-300">
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 class="text-sm font-bold text-slate-800 flex items-center gap-2">
            📢 우리 학교 & 우리 반 공지사항
          </h2>
          <span class="text-[10px] bg-indigo-50 text-indigo-700 font-extrabold px-2 py-0.5 rounded-lg border border-indigo-100 uppercase tracking-wider">최신동향</span>
        </div>

        <div class="space-y-4 max-h-[420px] overflow-y-auto pr-1 flex-1">
          ${mergedNotices.length === 0 ? `
            <div class="text-center py-16 text-slate-400 text-xs">등록된 공지사항이 아직 없습니다.</div>
          ` : mergedNotices.map(n => {
            const badge = n.type === 'all' 
              ? '<span class="bg-purple-50 text-purple-700 text-[10px] font-extrabold px-2.5 py-1 border border-purple-100 rounded-lg shadow-xs">학교 전체</span>'
              : '<span class="bg-emerald-50 text-emerald-700 text-[10px] font-extrabold px-2.5 py-1 border border-emerald-100 rounded-lg shadow-xs">우리반 공지</span>';
            
            return `
              <div class="notice-card-trigger cursor-pointer p-4.5 rounded-2xl border border-slate-100 bg-slate-50/50 flex flex-col gap-2 transition-all hover:bg-white hover:border-slate-300 hover:shadow-md" data-notice-id="${n.id}">
                <div class="flex items-center justify-between flex-wrap gap-2">
                  <div class="flex items-center gap-1.5 flex-wrap">
                    ${badge}
                    ${n.pinned ? '<span class="bg-rose-50 text-rose-600 text-[9px] font-extrabold px-2 py-1 border border-rose-100 rounded-lg shadow-xs animate-pulse">중요 고정</span>' : ''}
                    <span class="text-xs text-slate-900 font-extrabold">${n.title}</span>
                  </div>
                  <span class="text-[9px] text-slate-400 font-bold font-mono bg-slate-100 px-2 py-0.5 rounded-md">${n.createdByName || '작성자'} | ${n.createdAt ? n.createdAt.slice(0, 10) : ''}</span>
                </div>
                <p class="text-xs text-slate-600 whitespace-pre-line leading-relaxed mt-1 font-medium truncate max-w-full">${n.content.length > 100 ? n.content.slice(0, 100) + '...' : n.content}</p>
                ${n.imageUrl ? `<img src="${n.imageUrl}" referrerPolicy="no-referrer" class="w-full max-h-48 object-cover rounded-2xl mt-2 border border-slate-100 shadow-sm" />` : ''}
                <div class="text-[10px] text-indigo-600 font-black mt-1 text-right">자세히 보기 & 댓글 달기 ➔</div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- Bento Tile 2: Pinned / Active D-Day Widget (span 5) -->
      <div class="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 lg:col-span-5 md:col-span-1 hover:shadow-md transition-all duration-300">
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 class="text-sm font-bold text-slate-800 flex items-center gap-2">
            🎯 학급 주요 디데이 (D-Day)
          </h2>
          <span class="text-[10px] text-slate-400 font-extrabold font-mono tracking-widest uppercase">COUNTDOWN</span>
        </div>

        <div class="space-y-3">
          ${mergedDdays.length === 0 ? `
            <div class="text-center py-16 text-slate-400 text-xs border border-dashed border-slate-200 rounded-2xl bg-slate-50/30">등록된 고정 일정이 없습니다.</div>
          ` : mergedDdays.map(d => {
            const diffStr = calculateDDay(d.targetDate);
            const isPinned = d.pinned;
            const isOver = diffStr.startsWith('D+');

            let badgeStyle = 'bg-blue-50 text-blue-700 border border-blue-100';
            if (isPinned) badgeStyle = 'bg-rose-50 text-rose-700 border border-rose-100 font-black';
            if (isOver) badgeStyle = 'bg-slate-100 text-slate-500 border border-slate-200 font-extrabold';

            return `
              <div class="flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-slate-50/40 hover:bg-white hover:border-slate-300 hover:shadow-md transition-all">
                <div class="space-y-0.5">
                  <div class="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                    ${isPinned ? '📌' : '🗓️'}
                    ${d.title}
                  </div>
                  <div class="text-[9px] text-slate-400 font-bold font-mono tracking-wide">${d.targetDate}</div>
                </div>
                <span class="text-xs font-extrabold px-3 py-1.5 rounded-xl ${badgeStyle} font-mono shadow-xs">
                  ${diffStr}
                </span>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- Bento Tile 3: Weekly Timetable Highlight Card (span 6) -->
      <div class="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 lg:col-span-6 md:col-span-1 hover:shadow-md transition-all duration-300">
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 class="text-sm font-bold text-slate-800 flex items-center gap-2">
            ${isUsingPersonal ? '📅 나의 개인 주간 시간표' : '📅 우리 학급 주간 시간표'}
            ${isUsingPersonal ? '<span class="bg-blue-50 text-blue-700 text-[9px] font-extrabold px-1.5 py-0.5 rounded-lg border border-blue-100 shadow-xs">개인맞춤</span>' : ''}
          </h2>
          <span class="text-xs text-blue-600 font-extrabold bg-blue-50 border border-blue-100 px-3 py-1 rounded-xl shadow-xs">오늘: ${getKoreanDayOfWeek(todayStr)}</span>
        </div>

        <div class="grid grid-cols-5 gap-2">
          ${['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].map(dayKey => {
            const isToday = dayOfWeekEn.includes(dayKey);
            const dayName = { monday: '월', tuesday: '화', wednesday: '수', thursday: '목', friday: '금' }[dayKey];
            const list = displayedTimetable ? displayedTimetable[dayKey] : Array(7).fill('');

            return `
              <div class="rounded-2xl border p-2.5 flex flex-col items-center gap-2 transition-all ${isToday ? 'bg-blue-50/50 border-blue-200 shadow-sm ring-1 ring-blue-100' : 'bg-white border-slate-100'}" style="min-height: 240px;">
                <div class="text-xs font-black ${isToday ? 'text-blue-700' : 'text-slate-400'}">${dayName}요일</div>
                <div class="w-full space-y-1.5 mt-1 flex-1 flex flex-col justify-between">
                  ${Array.from({ length: 7 }).map((_, idx) => {
                    const subject = list[idx] || '-';
                    return `
                      <div class="text-[10px] py-1 text-center rounded-xl font-bold flex-1 flex items-center justify-center ${isToday ? (subject !== '-' ? 'bg-blue-100 text-blue-800' : 'bg-white text-slate-300 border border-slate-100') : (subject !== '-' ? 'bg-slate-50 text-slate-700 border border-slate-100' : 'text-slate-300')}">
                        ${subject}
                      </div>
                    `;
                  }).join('')}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- Bento Tile 4: Lunch Meals of Today (span 6) -->
      <div class="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 lg:col-span-6 md:col-span-2 hover:shadow-md transition-all duration-300">
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 class="text-sm font-bold text-slate-800 flex items-center gap-2">
            🍱 오늘 점심 급식표
          </h2>
          <span class="text-xs text-emerald-600 font-extrabold font-mono bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-xl shadow-xs">${todayStr}</span>
        </div>

        <div class="space-y-4">
          ${todaysMeal ? `
            <div class="space-y-3">
              <p class="text-xs text-slate-600 leading-relaxed font-semibold bg-slate-50/50 p-4.5 rounded-2xl border border-slate-150 whitespace-pre-wrap">${todaysMeal.menu}</p>
              ${todaysMeal.imageUrl ? `<img src="${todaysMeal.imageUrl}" referrerPolicy="no-referrer" class="w-full h-44 object-cover rounded-2xl mt-1 border border-slate-200 shadow-xs" />` : ''}
            </div>
          ` : `
            <div class="text-center py-16 text-slate-400 text-xs border border-dashed border-slate-200 rounded-2xl bg-slate-50/10">
              오늘 등록된 급식 식단표 정보가 아직 존재하지 않습니다.
            </div>
          `}
        </div>
      </div>

    </div>
  `;

  // Bind Notice Clicking
  panel.querySelectorAll('.notice-card-trigger').forEach(card => {
    card.addEventListener('click', async () => {
      const noticeId = card.getAttribute('data-notice-id');
      const notice = mergedNotices.find(n => n.id === noticeId);
      if (notice) {
        const { renderPostDetail } = await import('./board.js');
        await renderPostDetail(panel, notice, currentUser, classId, () => {
          renderHomePanel(panel, classId, grade, classNumber, currentUser);
        });
      }
    });
  });
}

// PANEL 2: Secretary Administrative Dashboard Room
async function renderSecNoticePanel(subPanel, classId, grade, classNumber, refreshParent) {
  const ddays = await dbService.getCollectionWithFilter('ddays', 'classId', classId);

  subPanel.innerHTML = `
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
      
      <!-- Action 1: Create Class Announcement -->
      <div class="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-4">
        <h3 class="text-sm font-bold text-gray-800 border-b border-gray-50 pb-2">📢 학급 전용 공지사항 배포</h3>
        <form id="sec-notice-form" class="space-y-3">
          <div>
            <label class="block text-xs font-semibold text-gray-500 mb-1">공지 제목</label>
            <input name="title" type="text" placeholder="예: [안내] 내일 독서활동용 소설책 준비" required class="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-teal-500 font-semibold text-gray-700">
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-500 mb-1">상세 공지 내용</label>
            <textarea name="content" rows="4" placeholder="반 친구들이 꼭 확인해야 하는 주요 세부 내용을 작성해 주세요." required class="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-teal-500 font-semibold text-gray-700"></textarea>
          </div>
          <button type="submit" class="w-full bg-teal-600 hover:bg-teal-700 text-white font-medium text-xs py-2.5 rounded-xl transition-colors cursor-pointer">
            반 공지사항 발행 및 등록
          </button>
        </form>
      </div>

      <!-- Action 2: Create D-Days -->
      <div class="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-4">
        <h3 class="text-sm font-bold text-gray-800 border-b border-gray-50 pb-2">🎯 신규 학급 D-Day 개설 및 삭제</h3>
        
        <!-- Add Form -->
        <form id="sec-dday-form" class="space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold text-gray-500 mb-1">일정 제목</label>
              <input name="title" type="text" placeholder="예: 수행평가 마감" required class="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-teal-500 font-semibold text-gray-700">
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-500 mb-1">목표 날짜</label>
              <input name="targetDate" type="date" required class="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-teal-500 font-semibold text-gray-700">
            </div>
          </div>
          <div class="flex items-center gap-1.5 py-1">
            <input id="sec-dday-pin" name="pinned" type="checkbox" value="true" class="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500">
            <label for="sec-dday-pin" class="text-xs font-semibold text-gray-700 select-none">상단 주요 고정 지정</label>
          </div>
          <button type="submit" class="w-full bg-teal-600 hover:bg-teal-700 text-white font-medium text-xs py-2 rounded-lg transition-colors cursor-pointer">
            디데이 일정 등록
          </button>
        </form>

        <!-- Dday Active Directory table -->
        <div class="space-y-2 mt-4">
          <div class="text-[10px] font-bold text-gray-400">활성 디데이 일정 목록</div>
          <div class="max-h-36 overflow-y-auto space-y-1.5 pr-1">
            ${ddays.length === 0 ? `
              <div class="text-center py-6 text-gray-400 text-xs">등록된 디데이가 없습니다.</div>
            ` : ddays.map(d => {
              return `
                <div class="flex items-center justify-between text-xs p-2 bg-gray-50 border border-gray-100 rounded-lg">
                  <span class="font-semibold text-gray-700">${d.pinned ? '📌' : '🗓️'} ${d.title} (${d.targetDate})</span>
                  <button class="delete-sec-dday text-[10px] text-red-500 hover:text-red-700 font-semibold cursor-pointer" data-id="${d.id}">삭제</button>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>

    </div>
  `;

  // Submit Notice handler
  document.getElementById('sec-notice-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const title = fd.get('title');
    const content = fd.get('content');

    try {
      await dbService.addDocument('notices', {
        type: 'class',
        grade,
        classNumber,
        classId,
        title,
        content,
        pinned: false,
        imageUrl: '',
        createdBy: 'student-2', // Secretary
        createdByName: '이서기'
      });

      showToast("학급 공지사항이 전파되었습니다.", "success");
      e.target.reset();
      refreshParent();
    } catch (err) {
      showToast("공지 발행 실패", "error");
    }
  });

  // Submit DDay handler
  document.getElementById('sec-dday-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const title = fd.get('title');
    const targetDate = fd.get('targetDate');
    const pinned = fd.get('pinned') === 'true';

    try {
      const ddayId = 'dday_' + generateId();
      await dbService.setDocument('ddays', ddayId, {
        id: ddayId,
        classId,
        title,
        targetDate,
        pinned,
        createdBy: 'student-2'
      });

      showToast("D-Day 일정이 신규 등록되었습니다.", "success");
      e.target.reset();
      refreshParent();
    } catch (err) {
      showToast("D-Day 일정 추가 실패", "error");
    }
  });

  // Delete Dday handler
  subPanel.querySelectorAll('.delete-sec-dday').forEach(btn => {
    btn.addEventListener('click', async () => {
      const dId = btn.getAttribute('data-id');
      if (await showConfirm('이 디데이 일정을 삭제하시겠습니까?')) {
        await dbService.deleteDocument('ddays', dId);
        showToast("디데이가 정상 소거되었습니다.", "success");
        refreshParent();
      }
    });
  });
}

async function renderSecretaryPanel(panel, classId, grade, classNumber) {
  panel.innerHTML = `
    <div class="space-y-6">
      <div class="bg-teal-50 border border-teal-200 p-5 rounded-2xl text-teal-900 shadow-xs">
        <h3 class="text-base font-bold flex items-center gap-1.5">📜 학급 서기(Secretary) 특임 집무 공간</h3>
        <p class="text-xs text-teal-800/80 mt-1">서기 학생은 담임 선생님을 대리하여 학급 공지/D-Day, 학생 등록 및 관리, 1인 1역 지정, 그리고 학급 소통방 모니터링을 독립적으로 행사할 수 있습니다.</p>
      </div>

      <!-- Secretary Inner Sub-Tabs -->
      <div class="flex items-center gap-2 overflow-x-auto pb-1 select-none scrollbar-hide">
        <button class="sec-sub-tab-btn px-4 py-2.5 rounded-xl font-bold text-xs transition-all border flex items-center gap-2 cursor-pointer bg-teal-600 border-teal-600 text-white shadow-xs" data-sec-tab="notice">
          📢 공지 & 디데이
        </button>
        <button class="sec-sub-tab-btn px-4 py-2.5 rounded-xl font-semibold text-xs transition-all border flex items-center gap-2 cursor-pointer bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300" data-sec-tab="students">
          👥 학급 명단 & 등록
        </button>
        <button class="sec-sub-tab-btn px-4 py-2.5 rounded-xl font-semibold text-xs transition-all border flex items-center gap-2 cursor-pointer bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300" data-sec-tab="roles">
          🎭 1인 1역 마스터
        </button>
        <button class="sec-sub-tab-btn px-4 py-2.5 rounded-xl font-semibold text-xs transition-all border flex items-center gap-2 cursor-pointer bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300" data-sec-tab="board">
          🛡️ 소통방 검열
        </button>
        <button class="sec-sub-tab-btn px-4 py-2.5 rounded-xl font-semibold text-xs transition-all border flex items-center gap-2 cursor-pointer bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300" data-sec-tab="timetable">
          📅 시간표 작성
        </button>
      </div>

      <!-- Internal Sub Panel Screen -->
      <div id="sec-sub-panel" class="min-h-[300px]"></div>
    </div>
  `;

  const subPanel = document.getElementById('sec-sub-panel');
  const secTabs = panel.querySelectorAll('.sec-sub-tab-btn');

  let currentTab = 'notice';

  const refreshTab = async () => {
    subPanel.innerHTML = `
      <div class="flex justify-center items-center py-20">
        <svg class="animate-spin h-7 w-7 text-teal-600" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    `;

    if (currentTab === 'notice') {
      await renderSecNoticePanel(subPanel, classId, grade, classNumber, refreshTab);
    } else if (currentTab === 'students') {
      await renderStudentsPanel(subPanel, grade, classNumber);
    } else if (currentTab === 'roles') {
      await renderRolesPanel(subPanel, classId);
    } else if (currentTab === 'board') {
      await renderBoardPanel(subPanel, classId);
    } else if (currentTab === 'timetable') {
      await renderTimetablePanel(subPanel, classId);
    }
  };

  secTabs.forEach(tab => {
    tab.addEventListener('click', async () => {
      secTabs.forEach(t => {
        t.className = 'sec-sub-tab-btn px-4 py-2.5 rounded-xl font-semibold text-xs transition-all border flex items-center gap-2 cursor-pointer bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300';
      });
      tab.className = 'sec-sub-tab-btn px-4 py-2.5 rounded-xl font-bold text-xs transition-all border flex items-center gap-2 cursor-pointer bg-teal-600 border-teal-600 text-white shadow-xs';

      currentTab = tab.getAttribute('data-sec-tab');
      await refreshTab();
    });
  });

  // Init Notice
  await refreshTab();
}

// PANEL 5: Personal Timetable Customizer for All Students
async function renderPersonalTimetable(panel, currentUser, classId) {
  const pTimetables = await dbService.getCollectionWithFilter('personalTimetables', 'studentUid', currentUser.uid);
  const hasPTimetable = pTimetables.length > 0;
  let ptData = hasPTimetable ? pTimetables[0] : {
    monday: Array(7).fill(''),
    tuesday: Array(7).fill(''),
    wednesday: Array(7).fill(''),
    thursday: Array(7).fill(''),
    friday: Array(7).fill('')
  };

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
  const dayNames = { monday: '월요일', tuesday: '화요일', wednesday: '수요일', thursday: '목요일', friday: '금요일' };

  const renderForm = () => {
    panel.innerHTML = `
      <div class="space-y-6 animate-fade-in">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <h3 class="text-base font-bold text-gray-900 flex items-center gap-1.5">📅 나의 개인 맞춤형 시간표</h3>
            <p class="text-xs text-gray-500 mt-1">방과 후 수업, 개인 보습학원, 또는 나만의 개인 학습 계획에 맞춰 1교시부터 7교시 시간표를 자유롭게 구성해 보세요.</p>
          </div>
          <button id="import-class-timetable-btn" class="shrink-0 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-xs">
            📋 우리 반 기본 시간표 불러오기
          </button>
        </div>

        <form id="personal-timetable-form" class="space-y-6 bg-slate-50/50 p-6 rounded-2xl border border-slate-200">
          <div class="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-5 gap-4">
            ${days.map(dayKey => {
              const list = ptData[dayKey] || Array(7).fill('');
              return `
                <div class="bg-white p-4.5 rounded-2xl border border-slate-150 shadow-sm space-y-3.5">
                  <div class="text-xs font-black text-slate-800 text-center pb-2 border-b border-slate-100">${dayNames[dayKey]}</div>
                  ${Array.from({ length: 7 }).map((_, idx) => {
                    return `
                      <div class="space-y-1">
                        <div class="flex justify-between items-center px-1">
                          <label class="block text-[10px] text-slate-400 font-black">${idx + 1}교시</label>
                        </div>
                        <input name="${dayKey}_${idx}" id="pt-input-${dayKey}-${idx}" type="text" value="${list[idx] || ''}" placeholder="예: 국어 / 독서" class="w-full bg-slate-50/70 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-center font-bold text-slate-700 focus:outline-none focus:border-blue-500 focus:bg-white transition-all">
                      </div>
                    `;
                  }).join('')}
                </div>
              `;
            }).join('')}
          </div>

          <div class="flex flex-col sm:flex-row justify-center gap-3">
            <button type="submit" class="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-6 py-3 rounded-xl transition-all cursor-pointer shadow-lg shadow-blue-500/15">
              💾 개인 맞춤 시간표 저장하기
            </button>
            ${hasPTimetable ? `
              <button id="delete-personal-timetable-btn" type="button" class="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs px-5 py-3 rounded-xl transition-all cursor-pointer">
                🗑️ 개인 시간표 초기화 (삭제)
              </button>
            ` : ''}
          </div>
        </form>
      </div>
    `;

    // Bind Import Class Timetable Button
    document.getElementById('import-class-timetable-btn').addEventListener('click', async () => {
      const timetableDocs = await dbService.getCollectionWithFilter('timetables', 'classId', classId);
      if (timetableDocs.length === 0) {
        showToast("학급 주간 시간표가 아직 등록되지 않았습니다.", "error");
        return;
      }
      
      const classT = timetableDocs[0];
      days.forEach(dayKey => {
        const list = classT[dayKey] || Array(7).fill('');
        for (let i = 0; i < 7; i++) {
          const input = document.getElementById(`pt-input-${dayKey}-${i}`);
          if (input) {
            input.value = list[i] || '';
          }
        }
      });
      showToast("우리 반 기본 시간표를 가져왔습니다! 원하는 부분을 변경하고 하단의 저장 버튼을 눌러주세요.", "success");
    });

    // Bind Submit Handler
    document.getElementById('personal-timetable-form').addEventListener('submit', async (e) => {
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
        if (hasPTimetable) {
          await dbService.updateDocument('personalTimetables', ptData.id, {
            ...payload,
            updatedAt: new Date().toISOString()
          });
        } else {
          const ptId = 'pt_' + generateId();
          await dbService.setDocument('personalTimetables', ptId, {
            id: ptId,
            studentUid: currentUser.uid,
            studentName: currentUser.name,
            classId,
            ...payload,
            updatedAt: new Date().toISOString()
          });
        }
        showToast("나만의 개인 시간표가 안전하게 저장되었습니다!", "success");
        renderPersonalTimetable(panel, currentUser, classId);
      } catch (err) {
        console.error(err);
        showToast("저장 중 오류가 발생했습니다.", "error");
      }
    });

    // Bind Delete Handler
    const deleteBtn = document.getElementById('delete-personal-timetable-btn');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', async () => {
        if (await showConfirm("개인 시간표를 삭제하고 초기화하시겠습니까? 학급 기본 보기로 돌아갑니다.")) {
          try {
            await dbService.deleteDocument('personalTimetables', ptData.id);
            showToast("개인 시간표가 초기화되었습니다.", "success");
            renderPersonalTimetable(panel, currentUser, classId);
          } catch (err) {
            console.error(err);
            showToast("초기화 실패", "error");
          }
        }
      });
    }
  };

  renderForm();
}

