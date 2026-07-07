/**
 * Utility functions for Class Management System
 */

// Generate standard unique ID
export function generateId() {
  return Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
}

// Format Date object as YYYY-MM-DD
export function formatDate(date = new Date()) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Get day of week in Korean (0: 일, 1: 월, ...)
export function getKoreanDayOfWeek(dateStr) {
  const date = new Date(dateStr);
  const days = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
  return days[date.getDay()];
}

// Calculate D-Day
export function calculateDDay(targetDateStr) {
  const target = new Date(targetDateStr);
  target.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffTime = target.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'D-Day';
  return diffDays > 0 ? `D-${diffDays}` : `D+${Math.abs(diffDays)}`;
}

// Format duration in minutes into a pretty HH:MM:SS format
export function formatDuration(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// Format minutes only
export function formatMinutes(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0) {
    return `${h}시간 ${m}분`;
  }
  return `${m}분`;
}

// Show Toast notifications (gorgeous popup message)
export function showToast(message, type = 'success') {
  // Check if toast container exists
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full px-4 sm:px-0';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `flex items-center gap-3 p-4 rounded-xl shadow-lg border text-sm transition-all duration-300 transform translate-x-12 opacity-0`;
  
  let bgClass = 'bg-white text-gray-800 border-gray-100';
  let iconHtml = '';

  if (type === 'success') {
    bgClass = 'bg-green-50 border-green-200 text-green-800';
    iconHtml = `<svg class="w-5 h-5 text-green-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>`;
  } else if (type === 'error') {
    bgClass = 'bg-red-50 border-red-200 text-red-800';
    iconHtml = `<svg class="w-5 h-5 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>`;
  } else if (type === 'info') {
    bgClass = 'bg-blue-50 border-blue-200 text-blue-800';
    iconHtml = `<svg class="w-5 h-5 text-blue-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`;
  }

  toast.className = `${toast.className} ${bgClass}`;
  toast.innerHTML = `
    ${iconHtml}
    <div class="font-medium shrink-1 grow">${message}</div>
    <button class="text-gray-400 hover:text-gray-600 focus:outline-none ml-auto shrink-0 transition-colors">
      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
    </button>
  `;

  container.appendChild(toast);

  // Trigger enter animation after paint
  setTimeout(() => {
    toast.classList.remove('translate-x-12', 'opacity-0');
  }, 10);

  // Auto remove toast
  const timer = setTimeout(() => {
    removeToast(toast);
  }, 4000);

  // Click close button
  toast.querySelector('button').addEventListener('click', () => {
    clearTimeout(timer);
    removeToast(toast);
  });
}

function removeToast(toast) {
  toast.classList.add('translate-x-12', 'opacity-0');
  setTimeout(() => {
    if (toast.parentNode) {
      toast.parentNode.removeChild(toast);
    }
  }, 300);
}

// Convert Firestore timestamp or JS Date/String to formatted date string
export function formatTimestamp(timestamp) {
  if (!timestamp) return '';
  let date;
  if (timestamp.seconds) {
    // Firestore Timestamp
    date = new Date(timestamp.seconds * 1000);
  } else {
    date = new Date(timestamp);
  }
  
  if (isNaN(date.getTime())) return '';
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${year}.${month}.${day} ${hours}:${minutes}`;
}
