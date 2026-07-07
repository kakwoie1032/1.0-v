/**
 * Class Bulletin Board (Forum) Controller (Blog System Upgraded)
 */
import { dbService, storageService } from './firebase.js';
import { showToast, formatDate, showConfirm } from './utils.js';

export async function renderClassBoard(container, classId, currentUser) {
  let activeCategory = '전체';
  const categories = ['전체', '공지사항', '자유게시판', '질문게시판', '수행평가 정보', '준비물', '분실물', '학급회의', '건의사항'];

  const isTeacher = currentUser.role === 'teacher';
  const allowedWriteCategories = isTeacher 
    ? categories.slice(1) 
    : categories.slice(1).filter(cat => cat !== '공지사항');

  container.innerHTML = `
    <div class="space-y-6">
      <!-- Board Actions Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-100">
        <h3 class="text-sm font-bold text-gray-800 flex items-center gap-1.5">
          💬 우리 반 소통 게시판
        </h3>
        <button id="write-post-toggle-btn" class="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 self-start sm:self-center">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
          새 게시글 쓰기
        </button>
      </div>

      <!-- Expandable Write Post Form Box -->
      <div id="write-post-form-box" class="hidden bg-gray-50 border border-gray-100 p-6 rounded-2xl transition-all">
        <h4 class="text-sm font-bold text-gray-900 mb-4">✍️ 신규 게시글 작성</h4>
        <form id="write-post-form" class="space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-gray-600 mb-1.5">카테고리 선택</label>
              <select name="category" required class="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500 font-semibold text-gray-700">
                ${allowedWriteCategories.map(cat => `<option value="${cat}">${cat}</option>`).join('')}
              </select>
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-600 mb-1.5">글 제목</label>
              <input name="title" type="text" placeholder="제목을 기입하세요." required class="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500 font-semibold text-gray-700">
            </div>
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-600 mb-1.5">게시글 본문 내용</label>
            <textarea name="content" rows="5" placeholder="공개 범위는 학급 구성원 전체입니다. 비속어나 부적절한 언어 사용 시 삭제 또는 숨김 처리될 수 있습니다." required class="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500 font-semibold text-gray-700"></textarea>
          </div>

          <!-- Attachments Field -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-gray-100 pt-3">
            <div>
              <label class="block text-xs font-semibold text-gray-600 mb-1.5">🔗 참고 외부 링크 첨부 (선택)</label>
              <input name="linkUrl" type="url" placeholder="https://example.com/..." class="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500 font-semibold text-gray-700">
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-600 mb-1.5">🖼️ 사진 첨부 파일 (선택)</label>
              <div class="flex items-center gap-2">
                <label for="post-image-input" class="bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs px-3 py-2.5 rounded-xl cursor-pointer font-bold transition-colors shrink-0">
                  사진 선택
                </label>
                <span id="post-image-name" class="text-[10px] text-gray-400 font-semibold truncate max-w-[150px]">선택된 사진 없음</span>
                <input id="post-image-input" type="file" accept="image/*" class="hidden">
              </div>
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-600 mb-1.5">📁 일반 파일 첨부 (선택)</label>
              <div class="flex items-center gap-2">
                <label for="post-file-input" class="bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs px-3 py-2.5 rounded-xl cursor-pointer font-bold transition-colors shrink-0">
                  파일 선택
                </label>
                <span id="post-file-name" class="text-[10px] text-gray-400 font-semibold truncate max-w-[150px]">선택된 파일 없음</span>
                <input id="post-file-input" type="file" class="hidden">
              </div>
            </div>
          </div>

          <div class="flex justify-end gap-2 border-t border-gray-100 pt-3">
            <button id="cancel-write-post" type="button" class="bg-gray-100 hover:bg-gray-200 text-gray-600 px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer">
              취소
            </button>
            <button type="submit" class="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer">
              게시글 올리기
            </button>
          </div>
        </form>
      </div>

      <!-- Categories Filter Tabs -->
      <div class="flex items-center gap-1.5 overflow-x-auto pb-1 select-none scrollbar-hide">
        ${categories.map(cat => `
          <button class="board-cat-btn px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border shrink-0 ${cat === activeCategory ? 'bg-blue-600 border-blue-600 text-white shadow-sm' : 'bg-white border-gray-100 hover:border-gray-200 text-gray-500'}" data-cat="${cat}">
            ${cat}
          </button>
        `).join('')}
      </div>

      <!-- Post List Container -->
      <div id="board-posts-list" class="space-y-4">
        <!-- Posts will load dynamically -->
      </div>
    </div>
  `;

  // Toggle writing panel
  const writeBox = document.getElementById('write-post-form-box');
  const toggleBtn = document.getElementById('write-post-toggle-btn');
  const cancelBtn = document.getElementById('cancel-write-post');

  toggleBtn.addEventListener('click', () => {
    writeBox.classList.toggle('hidden');
  });

  cancelBtn.addEventListener('click', () => {
    writeBox.classList.add('hidden');
  });

  // Handle file name display for Post creation
  const imageInput = document.getElementById('post-image-input');
  const imageNameSpan = document.getElementById('post-image-name');
  if (imageInput && imageNameSpan) {
    imageInput.addEventListener('change', () => {
      if (imageInput.files && imageInput.files[0]) {
        imageNameSpan.textContent = imageInput.files[0].name;
        imageNameSpan.classList.remove('text-gray-400');
        imageNameSpan.classList.add('text-blue-600', 'font-bold');
      } else {
        imageNameSpan.textContent = "선택된 사진 없음";
        imageNameSpan.classList.add('text-gray-400');
        imageNameSpan.classList.remove('text-blue-600', 'font-bold');
      }
    });
  }

  const fileInput = document.getElementById('post-file-input');
  const fileNameSpan = document.getElementById('post-file-name');
  if (fileInput && fileNameSpan) {
    fileInput.addEventListener('change', () => {
      if (fileInput.files && fileInput.files[0]) {
        fileNameSpan.textContent = fileInput.files[0].name;
        fileNameSpan.classList.remove('text-gray-400');
        fileNameSpan.classList.add('text-blue-600', 'font-bold');
      } else {
        fileNameSpan.textContent = "선택된 파일 없음";
        fileNameSpan.classList.add('text-gray-400');
        fileNameSpan.classList.remove('text-blue-600', 'font-bold');
      }
    });
  }

  // Handle category tab filtering
  const catButtons = container.querySelectorAll('.board-cat-btn');
  catButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      catButtons.forEach(b => {
        b.classList.remove('bg-blue-600', 'border-blue-600', 'text-white', 'shadow-sm');
        b.classList.add('bg-white', 'border-gray-100', 'text-gray-500');
      });
      btn.classList.remove('bg-white', 'border-gray-100', 'text-gray-500');
      btn.classList.add('bg-blue-600', 'border-blue-600', 'text-white', 'shadow-sm');

      activeCategory = btn.getAttribute('data-cat');
      loadPosts();
    });
  });

  // Handle Post Creation
  document.getElementById('write-post-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const category = fd.get('category');
    const title = fd.get('title');
    const content = fd.get('content');
    const linkUrl = fd.get('linkUrl') || '';

    let imageUrl = '';
    let fileUrl = '';
    let fileName = '';

    try {
      if (imageInput && imageInput.files && imageInput.files[0]) {
        showToast("이미지를 업로드하고 있습니다...", "info");
        imageUrl = await storageService.uploadFile(`posts/${classId}`, imageInput.files[0]);
      }

      if (fileInput && fileInput.files && fileInput.files[0]) {
        showToast("파일을 업로드하고 있습니다...", "info");
        fileName = fileInput.files[0].name;
        fileUrl = await storageService.uploadFile(`posts/${classId}`, fileInput.files[0]);
      }

      await dbService.addDocument('posts', {
        classId,
        category,
        title,
        content,
        authorUid: currentUser.uid,
        authorName: isTeacher ? `${currentUser.name} 선생님` : currentUser.name,
        views: 0,
        likes: 0,
        likedBy: [], // Track unique likes
        hidden: false,
        imageUrl,
        fileUrl,
        fileName,
        linkUrl,
        createdAt: new Date().toISOString()
      });

      showToast("게시글이 성공적으로 등록되었습니다.", "success");
      e.target.reset();
      if (imageNameSpan) {
        imageNameSpan.textContent = "선택된 사진 없음";
        imageNameSpan.classList.add('text-gray-400');
        imageNameSpan.classList.remove('text-blue-600', 'font-bold');
      }
      if (fileNameSpan) {
        fileNameSpan.textContent = "선택된 파일 없음";
        fileNameSpan.classList.add('text-gray-400');
        fileNameSpan.classList.remove('text-blue-600', 'font-bold');
      }
      writeBox.classList.add('hidden');
      loadPosts();
    } catch (err) {
      showToast("게시글 등록 실패", "error");
    }
  });

  // Dynamic Posts Loader (Blog Style Grid/List)
  async function loadPosts() {
    const listContainer = document.getElementById('board-posts-list');
    listContainer.innerHTML = `<div class="flex justify-center py-12"><svg class="animate-spin h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg></div>`;

    let allPosts = await dbService.getCollectionWithFilter('posts', 'classId', classId);
    let comments = await dbService.getCollectionWithFilter('comments', 'classId', classId);

    // Apply category filter
    if (activeCategory !== '전체') {
      allPosts = allPosts.filter(p => p.category === activeCategory);
    }

    // Filter hidden unless teacher/secretary/author
    const isMod = currentUser.role === 'teacher' || currentUser.assignedRole === '서기';
    
    // Sort latest first
    allPosts.sort((a,b) => b.createdAt.localeCompare(a.createdAt));

    if (allPosts.length === 0) {
      listContainer.innerHTML = `
        <div class="text-center py-16 text-gray-400 text-xs border border-dashed border-gray-100 rounded-2xl bg-white">
          작성된 소통 게시글이 아직 없습니다. 첫 이야기를 시작해보세요!
        </div>
      `;
      return;
    }

    listContainer.innerHTML = allPosts.map(p => {
      // Hide rule: if post is hidden and user is normal student (and not the author)
      if (p.hidden && !isMod && p.authorUid !== currentUser.uid) {
        return `
          <div class="bg-gray-50 border border-gray-100 p-4 rounded-xl text-center text-xs text-gray-400">
            🔒 담임 선생님 또는 학급 서기에 의해 블라인드 처리된 소통 게시글입니다.
          </div>
        `;
      }

      const postCommentsCount = comments.filter(c => c.postId === p.id).length;
      const hasLiked = p.likedBy && p.likedBy.includes(currentUser.uid);
      const isAuthor = p.authorUid === currentUser.uid;
      const snippet = p.content.length > 120 ? p.content.slice(0, 120) + '...' : p.content;

      // Attachments info
      let attachmentBadge = '';
      if (p.imageUrl || p.linkUrl || p.fileUrl) {
        attachmentBadge = `
          <span class="inline-flex items-center gap-1 text-[9px] bg-slate-100 text-slate-500 font-extrabold px-1.5 py-0.5 rounded-md border border-slate-200">
            📎 ${p.imageUrl ? '🖼️사진' : ''} ${p.linkUrl ? '🔗링크' : ''} ${p.fileUrl ? '📁파일' : ''}
          </span>
        `;
      }

      // Special visual for Announcement (Notice)
      const isAnnounce = p.category === '공지사항';
      const borderClass = isAnnounce ? 'border-rose-200 bg-rose-50/10' : 'border-gray-100 bg-white';
      const badgeColor = isAnnounce ? 'bg-rose-100 text-rose-800 border-rose-200' : 'bg-blue-50 text-blue-700 border-blue-100';

      return `
        <div class="post-blog-card p-5 rounded-2xl border shadow-sm space-y-3 cursor-pointer hover:border-blue-500 hover:shadow-md transition-all ${borderClass}" data-post-id="${p.id}">
          
          <div class="flex items-start justify-between gap-4">
            <div class="space-y-1">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="text-[10px] font-extrabold px-2.5 py-0.5 rounded-lg border ${badgeColor}">
                  ${isAnnounce ? '📢 ' + p.category : p.category}
                </span>
                <span class="text-xs text-gray-400 font-medium">${p.authorName}</span>
                <span class="text-[10px] text-gray-300 font-mono">${p.createdAt ? p.createdAt.slice(0, 16).replace('T', ' ') : ''}</span>
                ${p.hidden ? '<span class="bg-rose-50 border border-rose-100 text-rose-600 text-[9px] font-bold px-2 py-0.5 rounded-md">블라인드 중</span>' : ''}
                ${attachmentBadge}
              </div>
              <h4 class="text-sm font-bold text-gray-900 mt-1.5 flex items-center gap-1.5">
                ${p.title}
              </h4>
            </div>

            <!-- Mod controls -->
            ${isMod || isAuthor ? `
              <div class="flex items-center gap-1.5 shrink-0">
                ${isMod ? `
                  <button class="mod-hide-post text-[10px] bg-amber-50 text-amber-600 border border-amber-100 hover:bg-amber-100 hover:text-amber-700 px-2 py-1 rounded-lg font-semibold cursor-pointer" data-id="${p.id}" data-hidden="${p.hidden}">
                    ${p.hidden ? '공개' : '숨김'}
                  </button>
                ` : ''}
                <button class="mod-delete-post text-[10px] bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-100 hover:text-rose-700 px-2 py-1 rounded-lg font-semibold cursor-pointer" data-id="${p.id}">
                  삭제
                </button>
              </div>
            ` : ''}
          </div>

          <div class="flex gap-4 items-start border-t border-gray-50 pt-3">
            <div class="grow min-w-0">
              <p class="text-xs text-gray-500 leading-relaxed whitespace-pre-line">${snippet}</p>
            </div>
            ${p.imageUrl ? `
              <div class="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border border-gray-100 shrink-0 bg-gray-50">
                <img src="${p.imageUrl}" referrerPolicy="no-referrer" class="w-full h-full object-cover" />
              </div>
            ` : ''}
          </div>

          <div class="flex items-center justify-between border-t border-gray-50 pt-3 flex-wrap gap-2 text-xs font-semibold text-gray-400">
            <div class="flex items-center gap-3">
              <span class="flex items-center gap-1 ${hasLiked ? 'text-red-500' : ''}">
                ❤️ 공감 ${p.likes || 0}
              </span>
              <span class="font-mono">
                👁️ 조회수 ${p.views || 0}
              </span>
            </div>
            <span class="text-blue-600 flex items-center gap-1 font-mono">
              💬 댓글 ${postCommentsCount}개 작성됨 ➔
            </span>
          </div>

        </div>
      `;
    }).join('');

    // Attach Interactive Events to Loaded Posts
    attachPostInteractions(allPosts);
  }

  // Bind Likes, Comment Submission, Mod deletes
  function attachPostInteractions(posts) {
    const listContainer = document.getElementById('board-posts-list');

    // 0. Card Click (Opens blog detailed reader)
    listContainer.querySelectorAll('.post-blog-card').forEach(card => {
      card.addEventListener('click', async () => {
        const pId = card.getAttribute('data-post-id');
        const post = posts.find(p => p.id === pId);
        if (post) {
          await renderPostDetail(container, post, currentUser, classId, () => {
            renderClassBoard(container, classId, currentUser);
          });
        }
      });
    });

    // Stop propagation on mod buttons
    listContainer.querySelectorAll('.mod-hide-post, .mod-delete-post').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
      });
    });

    // 1. Mod Hide Toggle
    listContainer.querySelectorAll('.mod-hide-post').forEach(btn => {
      btn.addEventListener('click', async () => {
        const pId = btn.getAttribute('data-id');
        const isHidden = btn.getAttribute('data-hidden') === 'true';

        await dbService.updateDocument('posts', pId, {
          hidden: !isHidden
        });
        showToast(isHidden ? "다시 글이 오픈되었습니다." : "글이 블라인드(숨김) 처리되었습니다.", "success");
        loadPosts();
      });
    });

    // 2. Mod Delete Post
    listContainer.querySelectorAll('.mod-delete-post').forEach(btn => {
      btn.addEventListener('click', async () => {
        const pId = btn.getAttribute('data-id');
        if (await showConfirm("정말 이 소통글을 강제 철회하시겠습니까? 관련 댓글까지 모두 소실됩니다.")) {
          await dbService.deleteDocument('posts', pId);
          showToast("게시물이 완벽히 철회되었습니다.", "success");
          loadPosts();
        }
      });
    });
  }

  // Load Posts initially
  loadPosts();
}

/**
 * Beautiful Blog Post/Notice Detail Reader View
 */
export async function renderPostDetail(container, item, currentUser, classId, onBack) {
  const isNotice = item.type === 'all' || item.type === 'class';
  const collectionName = isNotice ? 'notices' : 'posts';

  // Increment views count in database for posts (not notices)
  if (!isNotice && !item._viewIncremented) {
    item._viewIncremented = true;
    try {
      const freshViews = (item.views || 0) + 1;
      await dbService.updateDocument('posts', item.id, { views: freshViews });
      item.views = freshViews;
    } catch (e) {
      console.error(e);
    }
  }

  // Load comments
  async function loadDetailComments() {
    const commentsList = document.getElementById('detail-comments-list');
    if (!commentsList) return;
    commentsList.innerHTML = `<div class="flex justify-center py-4"><svg class="animate-spin h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg></div>`;
    
    try {
      const allComments = await dbService.getCollectionWithFilter('comments', 'postId', item.id);
      allComments.sort((a,b) => a.createdAt.localeCompare(b.createdAt));
      
      const isMod = currentUser.role === 'teacher' || currentUser.assignedRole === '서기';

      if (allComments.length === 0) {
        commentsList.innerHTML = `<p class="text-xs text-gray-400 text-center py-6">등록된 댓글이 아직 없습니다. 첫 의견을 남겨보세요!</p>`;
        return;
      }

      commentsList.innerHTML = allComments.map(c => {
        const isCommentOwner = c.authorUid === currentUser.uid;

        let attachmentsHtml = '';
        if (c.imageUrl || c.linkUrl || c.fileUrl) {
          attachmentsHtml = `<div class="mt-2 space-y-1.5">`;
          if (c.imageUrl) {
            attachmentsHtml += `
              <div class="max-w-xs overflow-hidden rounded-xl border border-slate-100">
                <img src="${c.imageUrl}" referrerPolicy="no-referrer" class="max-h-48 w-full object-cover" />
              </div>
            `;
          }
          if (c.linkUrl) {
            attachmentsHtml += `
              <a href="${c.linkUrl}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1 text-[10px] text-blue-600 hover:underline font-bold bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                🔗 링크 바로가기
              </a>
            `;
          }
          if (c.fileUrl) {
            attachmentsHtml += `
              <a href="${c.fileUrl}" target="_blank" download="${c.fileName || '첨부파일'}" class="inline-flex items-center gap-1 text-[10px] text-slate-700 hover:underline font-bold bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                📁 ${c.fileName || '첨부파일 다운로드'}
              </a>
            `;
          }
          attachmentsHtml += `</div>`;
        }

        return `
          <div class="flex justify-between items-start gap-4 p-3 bg-slate-50/50 rounded-xl border border-slate-100 hover:bg-slate-50 transition-all text-xs">
            <div class="space-y-1 grow min-w-0">
              <div class="flex items-center gap-1.5">
                <span class="font-extrabold text-slate-800">${c.authorName}</span>
                <span class="text-[9px] text-slate-300 font-mono">${c.createdAt ? c.createdAt.slice(0, 16).replace('T', ' ') : ''}</span>
              </div>
              <p class="text-slate-600 leading-relaxed whitespace-pre-line">${c.content}</p>
              ${attachmentsHtml}
            </div>
            ${isMod || isCommentOwner ? `
              <button class="delete-detail-comment-btn text-[10px] text-red-500 hover:text-red-700 font-semibold cursor-pointer shrink-0" data-id="${c.id}">
                삭제
              </button>
            ` : ''}
          </div>
        `;
      }).join('');

      // Bind delete comment events
      commentsList.querySelectorAll('.delete-detail-comment-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          const cId = btn.getAttribute('data-id');
          if (await showConfirm("이 댓글을 정말 삭제하시겠습니까?")) {
            await dbService.deleteDocument('comments', cId);
            showToast("댓글이 정상 소거되었습니다.", "success");
            loadDetailComments();
          }
        });
      });
    } catch (err) {
      commentsList.innerHTML = `<p class="text-xs text-red-500 text-center py-4">댓글 로드 실패</p>`;
    }
  }

  // Set up container
  container.innerHTML = `
    <div class="space-y-6 max-w-3xl mx-auto bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-xl transition-all duration-300">
      
      <!-- Top Actions / Back -->
      <div class="flex items-center justify-between border-b border-slate-100 pb-4">
        <button id="post-detail-back-btn" class="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer transition-all bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-xl">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          목록으로 돌아가기
        </button>
        <span class="text-[10px] font-black tracking-widest text-slate-300 font-mono uppercase bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-lg">
          BLOG READER
        </span>
      </div>

      <!-- Main Post Article -->
      <article class="space-y-6">
        <header class="space-y-3">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="bg-blue-50 text-blue-700 text-[10px] font-black px-2.5 py-1 rounded-lg border border-blue-100 shadow-xs">
              ${isNotice ? (item.type === 'all' ? '📢 학교 전체 공지' : '📢 우리 반 공지') : (item.category || '소통방')}
            </span>
            <span class="text-xs text-slate-400 font-bold font-mono">
              작성자: ${isNotice ? (item.createdByName || '작성자') : (item.authorName || '익명')}
            </span>
            <span class="text-xs text-slate-300 font-bold font-mono">|</span>
            <span class="text-xs text-slate-400 font-bold font-mono">
              ${item.createdAt ? item.createdAt.slice(0, 16).replace('T', ' ') : ''}
            </span>
            ${!isNotice ? `
              <span class="text-xs text-slate-300 font-bold font-mono">|</span>
              <span id="detail-views-count" class="text-xs text-slate-400 font-bold font-mono">
                👁️ 조회수 ${item.views || 0}
              </span>
            ` : ''}
          </div>
          <h1 class="text-xl sm:text-2xl font-extrabold text-slate-800 leading-snug tracking-tight">
            ${item.title}
          </h1>
        </header>

        <!-- Post Content body -->
        <div class="text-sm text-slate-600 leading-relaxed whitespace-pre-line border-t border-slate-100 pt-6">
          ${item.content}
        </div>

        <!-- Attachments Section (Images, Links, Files) -->
        ${(item.imageUrl || item.linkUrl || item.fileUrl) ? `
          <div class="border-t border-slate-100 pt-6 space-y-4">
            <h4 class="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              📎 첨부 자료 & 참조 자료
            </h4>
            
            ${item.imageUrl ? `
              <div class="relative group overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 max-h-96 flex justify-center items-center">
                <img src="${item.imageUrl}" referrerPolicy="no-referrer" class="max-h-96 w-full object-contain transition-all duration-300 group-hover:scale-[1.01]" />
              </div>
            ` : ''}

            ${item.linkUrl ? `
              <a href="${item.linkUrl}" target="_blank" rel="noopener noreferrer" class="flex items-center gap-3 p-4 rounded-2xl border border-blue-100 bg-blue-50/30 hover:bg-blue-50 hover:border-blue-300 transition-all text-xs group cursor-pointer font-semibold">
                <div class="p-2.5 bg-blue-500 text-white rounded-xl shadow-md shadow-blue-500/10 shrink-0 group-hover:scale-105 transition-all">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                </div>
                <div class="grow min-w-0">
                  <div class="font-extrabold text-blue-900 truncate">첨부된 참고 링크가 존재합니다.</div>
                  <div class="text-[10px] text-blue-500 font-mono truncate mt-0.5">${item.linkUrl}</div>
                </div>
                <svg class="w-4 h-4 text-blue-400 shrink-0 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
              </a>
            ` : ''}

            ${item.fileUrl ? `
              <a href="${item.fileUrl}" target="_blank" download="${item.fileName || '첨부파일'}" class="flex items-center gap-3 p-4 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-all text-xs group cursor-pointer font-semibold">
                <div class="p-2.5 bg-slate-600 text-white rounded-xl shadow-md shrink-0 group-hover:scale-105 transition-all">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                </div>
                <div class="grow min-w-0">
                  <div class="font-extrabold text-slate-800 truncate">첨부파일 다운로드</div>
                  <div class="text-[10px] text-slate-500 font-mono truncate mt-0.5">${item.fileName || '다운로드'}</div>
                </div>
                <svg class="w-4 h-4 text-slate-400 shrink-0 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
              </a>
            ` : ''}
          </div>
        ` : ''}

        <!-- Likes Toggle (Only for board posts) -->
        ${!isNotice ? `
          <div class="flex items-center justify-start border-t border-b border-slate-50 py-3">
            <button id="detail-like-btn" class="flex items-center gap-2 text-xs font-black bg-slate-50 border border-slate-200 hover:border-red-200 hover:bg-red-50 text-slate-500 hover:text-red-600 px-4 py-2 rounded-2xl transition-all cursor-pointer shadow-xs">
              <svg id="detail-like-icon" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
              공감 피드백 (<span id="detail-likes-count">${item.likes || 0}</span>)
            </button>
          </div>
        ` : ''}
      </article>

      <!-- Comments Subsection -->
      <section class="border-t border-slate-100 pt-6 space-y-4">
        <h3 class="text-xs font-black text-slate-500 uppercase tracking-wider">
          💬 소통 댓글창
        </h3>

        <!-- Comments Container list -->
        <div id="detail-comments-list" class="space-y-2.5">
          <!-- Loaded dynamically -->
        </div>

        <!-- Write Comment Box -->
        <form id="detail-comment-form" class="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
          <div class="flex gap-2">
            <input name="content" type="text" placeholder="고운 언어와 배려하는 표현을 사용해주세요." required class="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs grow focus:outline-none focus:border-blue-500 font-semibold text-slate-700">
            <button type="submit" class="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shrink-0 transition-all cursor-pointer shadow-lg shadow-blue-500/10">
              댓글 등록
            </button>
          </div>
          
          <!-- Comment Attachments Bar -->
          <div class="flex items-center gap-4 flex-wrap text-xs pt-1 border-t border-slate-200/50">
            <!-- Add Link Trigger/Input -->
            <div class="flex items-center gap-1.5">
              <span class="text-slate-400 text-[11px] font-bold">🔗 링크:</span>
              <input name="commentLink" type="url" placeholder="참조 링크 주소(선택)" class="bg-white border border-slate-200 rounded-lg px-2 py-1 text-[10px] w-40 focus:outline-none focus:border-blue-500 font-semibold text-slate-700">
            </div>

            <!-- Add Photo Input -->
            <div class="flex items-center gap-1.5">
              <span class="text-slate-400 text-[11px] font-bold">🖼️ 사진:</span>
              <label for="comment-image-input" class="bg-slate-200 hover:bg-slate-300 text-slate-700 text-[10px] px-2 py-1 rounded-lg cursor-pointer font-bold transition-colors">
                사진 선택
              </label>
              <span id="comment-image-name" class="text-[10px] text-slate-400 font-semibold max-w-[100px] truncate">없음</span>
              <input id="comment-image-input" type="file" accept="image/*" class="hidden">
            </div>

            <!-- Add Generic File Input -->
            <div class="flex items-center gap-1.5">
              <span class="text-slate-400 text-[11px] font-bold">📁 파일:</span>
              <label for="comment-file-input" class="bg-slate-200 hover:bg-slate-300 text-slate-700 text-[10px] px-2 py-1 rounded-lg cursor-pointer font-bold transition-colors">
                파일 선택
              </label>
              <span id="comment-file-name" class="text-[10px] text-slate-400 font-semibold max-w-[100px] truncate">없음</span>
              <input id="comment-file-input" type="file" class="hidden">
            </div>
          </div>
        </form>
      </section>

    </div>
  `;

  // Bind Back Button
  document.getElementById('post-detail-back-btn').addEventListener('click', () => {
    onBack();
  });

  // Handle comment attachments filename display
  const commentImageInput = document.getElementById('comment-image-input');
  const commentImageName = document.getElementById('comment-image-name');
  if (commentImageInput && commentImageName) {
    commentImageInput.addEventListener('change', () => {
      if (commentImageInput.files && commentImageInput.files[0]) {
        commentImageName.textContent = commentImageInput.files[0].name;
        commentImageName.classList.remove('text-slate-400');
        commentImageName.classList.add('text-blue-600', 'font-bold');
      } else {
        commentImageName.textContent = "없음";
        commentImageName.classList.add('text-slate-400');
        commentImageName.classList.remove('text-blue-600', 'font-bold');
      }
    });
  }

  const commentFileInput = document.getElementById('comment-file-input');
  const commentFileName = document.getElementById('comment-file-name');
  if (commentFileInput && commentFileName) {
    commentFileInput.addEventListener('change', () => {
      if (commentFileInput.files && commentFileInput.files[0]) {
        commentFileName.textContent = commentFileInput.files[0].name;
        commentFileName.classList.remove('text-slate-400');
        commentFileName.classList.add('text-blue-600', 'font-bold');
      } else {
        commentFileName.textContent = "없음";
        commentFileName.classList.add('text-slate-400');
        commentFileName.classList.remove('text-blue-600', 'font-bold');
      }
    });
  }

  // Bind Likes (if not notice)
  if (!isNotice) {
    const likeBtn = document.getElementById('detail-like-btn');
    const updateLikeUI = () => {
      const hasLiked = item.likedBy && item.likedBy.includes(currentUser.uid);
      const icon = document.getElementById('detail-like-icon');
      if (hasLiked) {
        likeBtn.classList.remove('bg-slate-50', 'text-slate-500', 'border-slate-200');
        likeBtn.classList.add('bg-red-50', 'text-red-600', 'border-red-200');
        icon.classList.add('fill-current');
      } else {
        likeBtn.classList.add('bg-slate-50', 'text-slate-500', 'border-slate-200');
        likeBtn.classList.remove('bg-red-50', 'text-red-600', 'border-red-200');
        icon.classList.remove('fill-current');
      }
    };
    
    updateLikeUI();

    likeBtn.addEventListener('click', async () => {
      let likedBy = item.likedBy || [];
      let likes = item.likes || 0;

      if (likedBy.includes(currentUser.uid)) {
        likedBy = likedBy.filter(uid => uid !== currentUser.uid);
        likes = Math.max(0, likes - 1);
      } else {
        likedBy.push(currentUser.uid);
        likes += 1;
      }

      item.likedBy = likedBy;
      item.likes = likes;

      await dbService.updateDocument('posts', item.id, { likes, likedBy });
      document.getElementById('detail-likes-count').textContent = likes;
      updateLikeUI();
    });
  }

  // Bind Submit Comment Form
  document.getElementById('detail-comment-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const content = fd.get('content');
    const commentLink = fd.get('commentLink') || '';

    let imageUrl = '';
    let fileUrl = '';
    let fileName = '';

    try {
      if (commentImageInput && commentImageInput.files && commentImageInput.files[0]) {
        showToast("댓글 이미지 업로드 중...", "info");
        imageUrl = await storageService.uploadFile(`comments/${classId}`, commentImageInput.files[0]);
      }

      if (commentFileInput && commentFileInput.files && commentFileInput.files[0]) {
        showToast("댓글 파일 업로드 중...", "info");
        fileName = commentFileInput.files[0].name;
        fileUrl = await storageService.uploadFile(`comments/${classId}`, commentFileInput.files[0]);
      }

      await dbService.addDocument('comments', {
        postId: item.id,
        classId,
        content,
        authorUid: currentUser.uid,
        authorName: isNotice && currentUser.role === 'teacher' ? `${currentUser.name} 선생님` : currentUser.name,
        imageUrl,
        fileUrl,
        fileName,
        linkUrl: commentLink,
        createdAt: new Date().toISOString()
      });
      showToast("댓글이 등록되었습니다.", "success");
      e.target.reset();

      // Reset attachment labels
      if (commentImageName) {
        commentImageName.textContent = "없음";
        commentImageName.classList.add('text-slate-400');
        commentImageName.classList.remove('text-blue-600', 'font-bold');
      }
      if (commentFileName) {
        commentFileName.textContent = "없음";
        commentFileName.classList.add('text-slate-400');
        commentFileName.classList.remove('text-blue-600', 'font-bold');
      }

      loadDetailComments();
    } catch (err) {
      showToast("댓글 등록에 실패했습니다.", "error");
    }
  });

  // Initial load of comments
  loadDetailComments();
}
