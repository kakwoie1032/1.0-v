/**
 * Firebase Initialization & Dual-Mode Persistence Layer (Real Firebase & LocalStorage Fallback)
 */
import { showToast, generateId } from './utils.js';

// Default Firebase Config Placeholder (Can be configured dynamically from the UI)
const DEFAULT_CONFIG_KEY = 'class_management_firebase_config';

// Global reference for active mode
let isRealFirebase = false;
let firebaseApp = null;
let firebaseAuth = null;
let firebaseDb = null;
let firebaseStorage = null;

// Try to load configured credentials from localStorage
export function getSavedFirebaseConfig() {
  try {
    const saved = localStorage.getItem(DEFAULT_CONFIG_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch (e) {
    return null;
  }
}

export function saveFirebaseConfig(config) {
  try {
    localStorage.setItem(DEFAULT_CONFIG_KEY, JSON.stringify(config));
    return true;
  } catch (e) {
    return false;
  }
}

export function clearFirebaseConfig() {
  localStorage.removeItem(DEFAULT_CONFIG_KEY);
}

// Initial Mock DB seeding data
const INITIAL_SEED = {
  users: [
    {
      uid: 'admin-1',
      name: '교무부장',
      email: 'admin@school.com',
      role: 'admin',
      grade: null,
      classNumber: null,
      studentNumber: null,
      assignedRole: '',
      createdAt: new Date().toISOString()
    },
    {
      uid: 'teacher-1',
      name: '김선생',
      email: 'teacher@school.com',
      role: 'teacher',
      grade: 1,
      classNumber: 3,
      studentNumber: null,
      assignedRole: '',
      createdAt: new Date().toISOString()
    },
    {
      uid: 'student-1',
      name: '홍길동',
      email: 'student1@school.com',
      role: 'student',
      grade: 1,
      classNumber: 3,
      studentNumber: 15,
      assignedRole: '칠판 담당',
      createdAt: new Date().toISOString()
    },
    {
      uid: 'student-2',
      name: '이서기',
      email: 'student2@school.com',
      role: 'student',
      grade: 1,
      classNumber: 3,
      studentNumber: 20,
      assignedRole: '서기',
      createdAt: new Date().toISOString()
    }
  ],
  classes: [
    {
      id: '1-3',
      grade: 1,
      classNumber: 3,
      teacherUid: 'teacher-1',
      teacherName: '김선생',
      createdAt: new Date().toISOString()
    }
  ],
  roles: [
    {
      id: 'role-1',
      classId: '1-3',
      roleName: '서기',
      description: '반 게시판과 D-Day를 등록하고 공지사항을 관리합니다.',
      assignedStudentUid: 'student-2',
      assignedStudentName: '이서기',
      createdAt: new Date().toISOString()
    },
    {
      id: 'role-2',
      classId: '1-3',
      roleName: '칠판 담당',
      description: '매 교시가 끝날 때마다 칠판을 깨끗하게 정리합니다.',
      assignedStudentUid: 'student-1',
      assignedStudentName: '홍길동',
      createdAt: new Date().toISOString()
    },
    {
      id: 'role-3',
      classId: '1-3',
      roleName: '급식 담당',
      description: '급식실 이동 전 줄을 맞춰주고 질서를 지키도록 돕습니다.',
      assignedStudentUid: '',
      assignedStudentName: '',
      createdAt: new Date().toISOString()
    }
  ],
  meals: [
    {
      id: 'meal-1',
      classId: '1-3',
      date: '2026-07-06',
      menu: '친환경 쌀밥, 얼큰 수제비 국, 수제 돈까스 & 브라운 소스, 마카로니 샐러드, 포기 김치, 급식 우유',
      imageUrl: '',
      createdBy: 'teacher-1',
      createdAt: new Date().toISOString()
    },
    {
      id: 'meal-2',
      classId: '1-3',
      date: '2026-07-07',
      menu: '잡곡밥, 맑은 미역국, 매콤 제육볶음, 상추 & 쌈장, 계란찜, 배추 김치',
      imageUrl: '',
      createdBy: 'teacher-1',
      createdAt: new Date().toISOString()
    }
  ],
  timetables: [
    {
      id: 'timetable-1',
      classId: '1-3',
      monday: ['국어', '수학', '영어', '과학', '체육', '사회', '자율'],
      tuesday: ['수학', '영어', '국어', '미술', '과학', '체육', '동아리'],
      wednesday: ['영어', '과학', '수학', '국어', '음악', '음악', '학급회의'],
      thursday: ['사회', '국어', '영어', '체육', '수학', '과학', '진로'],
      friday: ['기가', '기가', '영어', '수학', '국어', '사회', '청소'],
      updatedAt: new Date().toISOString()
    }
  ],
  ddays: [
    {
      id: 'dday-1',
      classId: '1-3',
      title: '1학기 기말고사 📝',
      targetDate: '2026-07-20',
      pinned: true,
      createdBy: 'teacher-1',
      createdAt: new Date().toISOString()
    },
    {
      id: 'dday-2',
      classId: '1-3',
      title: '여름방학식 🏖️',
      targetDate: '2026-07-25',
      pinned: false,
      createdBy: 'student-2',
      createdAt: new Date().toISOString()
    },
    {
      id: 'dday-3',
      classId: '1-3',
      title: '2027학년도 대입 수능 🎓',
      targetDate: '2026-11-19',
      pinned: true,
      createdBy: 'teacher-1',
      createdAt: new Date().toISOString()
    }
  ],
  notices: [
    {
      id: 'notice-1',
      type: 'all',
      grade: null,
      classNumber: null,
      classId: '',
      title: '📢 서울고등학교 종합 예방 교육 안내',
      content: '학교 폭력 예방 및 개인 위생 관리를 위한 행동 수칙을 숙지하고 실천해 주시기 바랍니다.',
      pinned: true,
      imageUrl: '',
      createdBy: 'admin-1',
      createdByName: '교무부장',
      createdAt: new Date().toISOString()
    },
    {
      id: 'notice-2',
      type: 'class',
      grade: 1,
      classNumber: 3,
      classId: '1-3',
      title: '내일 야외 체육 활동 복장 안내 (필독)',
      content: '내일 체육 수업은 운동장에서 진행됩니다. 반드시 단정한 체육복과 운동화를 착용하고 등교해 주세요.',
      pinned: true,
      imageUrl: '',
      createdBy: 'teacher-1',
      createdByName: '김선생',
      createdAt: new Date().toISOString()
    },
    {
      id: 'notice-3',
      type: 'class',
      grade: 1,
      classNumber: 3,
      classId: '1-3',
      title: '내일까지 국어 수행평가 보고서 제출',
      content: '지난주 공지된 독서 감상문 수행평가 보고서를 내일 1교시 시작 전까지 국어부장에게 제출하세요. (서기 작성)',
      pinned: false,
      imageUrl: '',
      createdBy: 'student-2',
      createdByName: '이서기',
      createdAt: new Date().toISOString()
    }
  ],
  posts: [
    {
      id: 'post-1',
      classId: '1-3',
      category: '자유게시판',
      title: '오늘 수학 숙제 어디까지인가요??',
      content: '수학 익힘책 45쪽까지인지 48쪽까지인지 헷갈리는데, 정확히 아시는 분 댓글 부탁드립니다!',
      authorUid: 'student-1',
      authorName: '홍길동',
      views: 12,
      likes: 2,
      likedBy: [],
      hidden: false,
      createdAt: new Date().toISOString()
    },
    {
      id: 'post-2',
      classId: '1-3',
      category: '준비물',
      title: '내일 미술 준비물 꼭 챙기세요!',
      content: '내일 미술 시간에 수채화 도구(물감, 붓, 물통) 필요합니다. 까먹고 안 가져오는 사람 없기를!',
      authorUid: 'student-2',
      authorName: '이서기',
      views: 8,
      likes: 1,
      likedBy: [],
      hidden: false,
      createdAt: new Date().toISOString()
    }
  ],
  comments: [
    {
      id: 'comment-1',
      postId: 'post-1',
      classId: '1-3',
      content: '수학 익힘책 48쪽까지 맞아요! 쌤이 홀수 번호만 풀라고 하셨습니다.',
      authorUid: 'student-2',
      authorName: '이서기',
      createdAt: new Date().toISOString()
    }
  ],
  studyLogs: [
    {
      id: 'log-1',
      classId: '1-3',
      studentUid: 'student-1',
      studentName: '홍길동',
      subject: '수학',
      memo: '수학 쎈 오답노트 작성 완료',
      startTime: new Date(Date.now() - 5400 * 1000).toISOString(),
      endTime: new Date().toISOString(),
      durationMinutes: 90,
      createdAt: new Date().toISOString()
    },
    {
      id: 'log-2',
      classId: '1-3',
      studentUid: 'student-2',
      studentName: '이서기',
      subject: '영어',
      memo: '수능 빈칸추론 기출 5지문 풀이',
      startTime: new Date(Date.now() - 2700 * 1000).toISOString(),
      endTime: new Date().toISOString(),
      durationMinutes: 45,
      createdAt: new Date().toISOString()
    }
  ]
};

// Storage Helper
export function getLocalDb() {
  let db = localStorage.getItem('class_management_mock_db');
  try {
    if (!db) {
      localStorage.setItem('class_management_mock_db', JSON.stringify(INITIAL_SEED));
      db = localStorage.getItem('class_management_mock_db');
    }
    const parsed = JSON.parse(db);
    if (!parsed || !parsed.users || parsed.users.length === 0) {
      localStorage.setItem('class_management_mock_db', JSON.stringify(INITIAL_SEED));
      return INITIAL_SEED;
    }
    return parsed;
  } catch (e) {
    localStorage.setItem('class_management_mock_db', JSON.stringify(INITIAL_SEED));
    return INITIAL_SEED;
  }
}

function saveLocalDb(data) {
  localStorage.setItem('class_management_mock_db', JSON.stringify(data));
}

// Ensure the Mock DB is seeded right away
getLocalDb();

// Load Firebase Scripts via CDN dynamically to satisfy Pure HTML/JS with Firebase Config
let isFirebaseScriptLoaded = false;
async function loadFirebaseScripts() {
  if (isFirebaseScriptLoaded) return true;
  return new Promise((resolve) => {
    // Dynamic import of Firebase SDK
    import('https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js')
      .then((appMod) => {
        window.firebaseAppMod = appMod;
        return import('https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js');
      })
      .then((authMod) => {
        window.firebaseAuthMod = authMod;
        return import('https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js');
      })
      .then((storeMod) => {
        window.firebaseStoreMod = storeMod;
        return import('https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js');
      })
      .then((storageMod) => {
        window.firebaseStorageMod = storageMod;
        isFirebaseScriptLoaded = true;
        resolve(true);
      })
      .catch((err) => {
        console.warn("Firebase Scripts CDN loading failed. Using Mock mode.", err);
        resolve(false);
      });
  });
}

// Initialize Active Services
export async function initializeFirebase() {
  const config = getSavedFirebaseConfig();
  if (!config) {
    isRealFirebase = false;
    console.log("Firebase is not configured. Running in DEMO Mock Mode.");
    return false;
  }

  const scriptLoaded = await loadFirebaseScripts();
  if (!scriptLoaded) {
    isRealFirebase = false;
    console.warn("Failed to load Firebase CDN script. Falling back to DEMO Mock Mode.");
    return false;
  }

  try {
    const { initializeApp } = window.firebaseAppMod;
    const { getAuth } = window.firebaseAuthMod;
    const { getFirestore } = window.firebaseStoreMod;
    const { getStorage } = window.firebaseStorageMod;

    firebaseApp = initializeApp(config);
    firebaseAuth = getAuth(firebaseApp);
    firebaseDb = getFirestore(firebaseApp);
    firebaseStorage = getStorage(firebaseApp);
    isRealFirebase = true;
    console.log("Real Firebase project successfully initialized!");
    return true;
  } catch (error) {
    isRealFirebase = false;
    console.error("Error initializing Real Firebase config, falling back to DEMO Mock Mode:", error);
    showToast("Firebase 연결 실패! 임시 데모 모드로 실행됩니다. 설정을 확인해 주세요.", "error");
    return false;
  }
}

// Check if running Real Firebase
export function isUsingRealFirebase() {
  return isRealFirebase;
}

// Standard Database Wrapper Methods
export const dbService = {
  async getCollection(collectionName) {
    if (isRealFirebase) {
      try {
        const { collection, getDocs } = window.firebaseStoreMod;
        const querySnapshot = await getDocs(collection(firebaseDb, collectionName));
        const list = [];
        querySnapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() });
        });
        return list;
      } catch (err) {
        showToast(`Firebase 데이터 로드 오류 (${collectionName})`, 'error');
        console.error(err);
        return [];
      }
    } else {
      const db = getLocalDb();
      return db[collectionName] || [];
    }
  },

  async getCollectionWithFilter(collectionName, fieldName, value) {
    if (isRealFirebase) {
      try {
        const { collection, query, where, getDocs } = window.firebaseStoreMod;
        const q = query(collection(firebaseDb, collectionName), where(fieldName, '==', value));
        const querySnapshot = await getDocs(q);
        const list = [];
        querySnapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() });
        });
        return list;
      } catch (err) {
        console.error(err);
        return [];
      }
    } else {
      const db = getLocalDb();
      const list = db[collectionName] || [];
      return list.filter(item => item[fieldName] === value);
    }
  },

  async addDocument(collectionName, data) {
    if (isRealFirebase) {
      try {
        const { collection, addDoc } = window.firebaseStoreMod;
        const docRef = await addDoc(collection(firebaseDb, collectionName), {
          ...data,
          createdAt: new Date().toISOString()
        });
        return docRef.id;
      } catch (err) {
        showToast('Firebase 데이터 쓰기 오류', 'error');
        console.error(err);
        throw err;
      }
    } else {
      const db = getLocalDb();
      const newId = generateId();
      const newDoc = { id: newId, ...data, createdAt: new Date().toISOString() };
      if (!db[collectionName]) db[collectionName] = [];
      db[collectionName].push(newDoc);
      saveLocalDb(db);
      return newId;
    }
  },

  async setDocument(collectionName, docId, data) {
    if (isRealFirebase) {
      try {
        const { doc, setDoc } = window.firebaseStoreMod;
        await setDoc(doc(firebaseDb, collectionName, docId), data, { merge: true });
        return docId;
      } catch (err) {
        console.error(err);
        throw err;
      }
    } else {
      const db = getLocalDb();
      if (!db[collectionName]) db[collectionName] = [];
      const index = db[collectionName].findIndex(item => item.id === docId || item.uid === docId);
      const updatedDoc = { ...(index >= 0 ? db[collectionName][index] : {}), ...data };
      if (!updatedDoc.id && !updatedDoc.uid) updatedDoc.id = docId;

      if (index >= 0) {
        db[collectionName][index] = updatedDoc;
      } else {
        db[collectionName].push(updatedDoc);
      }
      saveLocalDb(db);
      return docId;
    }
  },

  async updateDocument(collectionName, docId, data) {
    if (isRealFirebase) {
      try {
        const { doc, updateDoc } = window.firebaseStoreMod;
        await updateDoc(doc(firebaseDb, collectionName, docId), data);
        return true;
      } catch (err) {
        console.error(err);
        throw err;
      }
    } else {
      const db = getLocalDb();
      if (!db[collectionName]) return false;
      const index = db[collectionName].findIndex(item => item.id === docId || item.uid === docId);
      if (index >= 0) {
        db[collectionName][index] = { ...db[collectionName][index], ...data };
        saveLocalDb(db);
        return true;
      }
      return false;
    }
  },

  async deleteDocument(collectionName, docId) {
    if (isRealFirebase) {
      try {
        const { doc, deleteDoc } = window.firebaseStoreMod;
        await deleteDoc(doc(firebaseDb, collectionName, docId));
        return true;
      } catch (err) {
        console.error(err);
        throw err;
      }
    } else {
      const db = getLocalDb();
      if (!db[collectionName]) return false;
      const filtered = db[collectionName].filter(item => item.id !== docId && item.uid !== docId);
      db[collectionName] = filtered;
      saveLocalDb(db);
      return true;
    }
  }
};

// Standard Authentication Wrapper Methods
export const authService = {
  // Current logged in user object
  currentUser: null,

  async login(email, password) {
    if (isRealFirebase) {
      try {
        const { signInWithEmailAndPassword } = window.firebaseAuthMod;
        const userCredential = await signInWithEmailAndPassword(firebaseAuth, email, password);
        const user = userCredential.user;
        
        // Fetch user document roles from db
        const userDocs = await dbService.getCollectionWithFilter('users', 'uid', user.uid);
        if (userDocs.length > 0) {
          this.currentUser = userDocs[0];
          return this.currentUser;
        } else {
          // Fallback if not recorded in users collection
          const defaultUser = {
            uid: user.uid,
            name: user.displayName || email.split('@')[0],
            email: user.email,
            role: 'student',
            grade: 1,
            classNumber: 3,
            studentNumber: 1,
            assignedRole: '',
            createdAt: new Date().toISOString()
          };
          await dbService.setDocument('users', user.uid, defaultUser);
          this.currentUser = defaultUser;
          return this.currentUser;
        }
      } catch (error) {
        console.warn("Real Firebase login failed. Attempting Mock/Demo Mode fallback for test accounts:", error);
        
        // Fallback to Mock login if it's one of our default test/mock accounts
        const db = getLocalDb();
        const matched = db.users.find(u => u.email === email);
        if (matched) {
          this.currentUser = matched;
          isRealFirebase = false; // Temporarily fall back to Mock mode for this session
          localStorage.setItem('class_management_mock_auth_user', JSON.stringify(matched));
          showToast("실제 Firebase 연동에 실패하여 임시 데모 계정으로 로그인되었습니다.", "warning");
          return matched;
        }

        let errorMsg = "로그인 도중 오류가 발생했습니다.";
        if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
          errorMsg = "이메일 또는 비밀번호가 올바르지 않습니다.";
        } else if (error.code === 'auth/invalid-email') {
          errorMsg = "유효하지 않은 이메일 형식입니다.";
        }
        showToast(errorMsg, "error");
        throw error;
      }
    } else {
      // Mock Login Mode
      const db = getLocalDb();
      const matched = db.users.find(u => u.email === email);
      if (matched && password) { // Simple mock check: accept any password for mock accounts
        this.currentUser = matched;
        localStorage.setItem('class_management_mock_auth_user', JSON.stringify(matched));
        return matched;
      } else {
        const err = new Error("Wrong credentials");
        showToast("등록되지 않은 사용자거나 비밀번호가 다릅니다. (힌트: admin@school.com / admin123)", "error");
        throw err;
      }
    }
  },

  async registerUser(email, password, userData) {
    if (isRealFirebase) {
      try {
        // Creating student/teacher is managed by auth or admin manually, 
        // We'll write this into user profile creation
        const { getAuth, createUserWithEmailAndPassword } = window.firebaseAuthMod;
        const tempAuth = getAuth(firebaseApp);
        // Registering creates new credential
        const userCredential = await createUserWithEmailAndPassword(tempAuth, email, password);
        const uid = userCredential.user.uid;
        
        const fullUser = {
          uid,
          email,
          ...userData,
          createdAt: new Date().toISOString()
        };
        await dbService.setDocument('users', uid, fullUser);
        return fullUser;
      } catch (error) {
        showToast("계정 등록 실패: " + error.message, "error");
        throw error;
      }
    } else {
      // Mock Register
      const db = getLocalDb();
      if (db.users.some(u => u.email === email)) {
        showToast("이미 등록된 이메일입니다.", "error");
        throw new Error("Email exists");
      }
      const newUid = generateId();
      const newProfile = {
        uid: newUid,
        email,
        ...userData,
        createdAt: new Date().toISOString()
      };
      db.users.push(newProfile);
      saveLocalDb(db);
      return newProfile;
    }
  },

  async logout() {
    this.currentUser = null;
    if (isRealFirebase) {
      try {
        const { signOut } = window.firebaseAuthMod;
        await signOut(firebaseAuth);
        showToast("로그아웃 되었습니다.", "success");
      } catch (err) {
        console.error(err);
      }
    } else {
      localStorage.removeItem('class_management_mock_auth_user');
      showToast("로그아웃 되었습니다.", "success");
    }
  },

  getCurrentUser() {
    if (isRealFirebase) {
      // Returned from current active state
      return this.currentUser;
    } else {
      if (!this.currentUser) {
        const saved = localStorage.getItem('class_management_mock_auth_user');
        if (saved) {
          this.currentUser = JSON.parse(saved);
        }
      }
      return this.currentUser;
    }
  }
};

// Storage Service Wrapper
export const storageService = {
  async uploadFile(path, file) {
    if (isRealFirebase) {
      try {
        const { ref, uploadBytes, getDownloadURL } = window.firebaseStorageMod;
        const fileRef = ref(firebaseStorage, `${path}/${Date.now()}_${file.name}`);
        const snapshot = await uploadBytes(fileRef, file);
        const url = await getDownloadURL(snapshot.ref);
        return url;
      } catch (error) {
        showToast("파일 업로드 실패!", "error");
        console.error(error);
        return "";
      }
    } else {
      // Mock File Upload (Convert to local Base64 URL for demo purposes)
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(reader.result); // Base64 data-uri
        };
        reader.readAsDataURL(file);
      });
    }
  }
};
