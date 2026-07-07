/**
 * Authentication Helper Functions
 */
import { authService, dbService } from './firebase.js';
import { showToast } from './utils.js';

// Handle User Login
export async function loginUser(email, password) {
  try {
    const user = await authService.login(email, password);
    showToast(`${user.name}님 환영합니다!`, 'success');
    return user;
  } catch (err) {
    console.error("Login failed:", err);
    throw err;
  }
}

// Parse Student ID (e.g. 10315 or 1-3-15)
export function parseStudentId(str) {
  const clean = str.trim().replace(/\s+/g, ' ');
  
  // Try pattern matching "학년", "반", "번"
  const korMatch = clean.match(/(\d+)\s*학년\s*(\d+)\s*반\s*(\d+)\s*번/);
  if (korMatch) {
    return {
      grade: parseInt(korMatch[1]),
      classNumber: parseInt(korMatch[2]),
      studentNumber: parseInt(korMatch[3])
    };
  }
  
  // Try hyphens or spaces: e.g. "1-3-15" or "1 3 15"
  const parts = clean.split(/[- ]+/);
  if (parts.length === 3) {
    const g = parseInt(parts[0]);
    const c = parseInt(parts[1]);
    const n = parseInt(parts[2]);
    if (!isNaN(g) && !isNaN(c) && !isNaN(n)) {
      return { grade: g, classNumber: c, studentNumber: n };
    }
  }

  // Pure digits: "1315" or "10315"
  const digits = clean.replace(/[^0-9]/g, '');
  if (digits.length === 4) {
    return {
      grade: parseInt(digits[0]),
      classNumber: parseInt(digits[1]),
      studentNumber: parseInt(digits.slice(2))
    };
  } else if (digits.length === 5) {
    return {
      grade: parseInt(digits[0]),
      classNumber: parseInt(digits.slice(1, 3)),
      studentNumber: parseInt(digits.slice(3))
    };
  } else if (digits.length >= 6) {
    return {
      grade: parseInt(digits[0]),
      classNumber: parseInt(digits.slice(1, 3)),
      studentNumber: parseInt(digits.slice(3))
    };
  }
  
  return null;
}

// Handle Student Login using Grade, Class, Number, Name, and Password
export async function loginStudentByInfo(studentIdStr, name, password) {
  try {
    const parsed = parseStudentId(studentIdStr);
    if (!parsed) {
      throw new Error("학번 형식이 올바르지 않습니다. (예: 10315 또는 1-3-15)");
    }
    
    const { grade, classNumber, studentNumber } = parsed;
    
    // Find matching student
    const allUsers = await dbService.getCollection('users');
    const matchedStudent = allUsers.find(u => {
      if (u.role !== 'student') return false;
      const cleanDbName = u.name.replace(/\s*\(.*\)/, '').trim();
      return cleanDbName === name.trim() &&
        parseInt(u.grade) === grade &&
        parseInt(u.classNumber) === classNumber &&
        parseInt(u.studentNumber) === studentNumber;
    });
    
    if (!matchedStudent) {
      throw new Error("일치하는 학생 정보를 찾을 수 없습니다. 학번과 이름을 확인해 주세요.");
    }
    
    // Login with student's email and password
    const user = await authService.login(matchedStudent.email, password);
    showToast(`${user.name}님 환영합니다!`, 'success');
    return user;
  } catch (err) {
    console.error("Student login failed:", err);
    showToast(err.message, "error");
    throw err;
  }
}

// Handle User Logout
export async function logoutUser() {
  await authService.logout();
  // Clear any active UI dashboards and refresh to login screen
  window.location.reload();
}

// Check current user session and return fresh user details
export async function checkSession() {
  const user = authService.getCurrentUser();
  if (!user) return null;
  
  // Fetch fresh user record to ensure roles and info are up to date
  const userDocs = await dbService.getCollectionWithFilter('users', 'uid', user.uid);
  if (userDocs.length > 0) {
    // If assignedRole has changed, update session reference
    authService.currentUser = userDocs[0];
    return userDocs[0];
  }
  return user;
}

// Check detailed roles
export function isUserAdmin(user) {
  return user && user.role === 'admin';
}

export function isUserTeacher(user) {
  return user && user.role === 'teacher';
}

export function isUserStudent(user) {
  return user && user.role === 'student';
}

// Check if student is assigned Secretary (서기) role
export function isUserSecretary(user) {
  if (!isUserStudent(user)) return false;
  return user.assignedRole === '서기';
}

// Helper to get formatted Class ID (e.g., "1-3")
export function getClassId(user) {
  if (!user || (!user.grade && !user.classNumber)) return '';
  return `${user.grade}-${user.classNumber}`;
}
