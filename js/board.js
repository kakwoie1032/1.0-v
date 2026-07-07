/**
 * Class Bulletin Board (Forum) Controller
 */
import { dbService } from './firebase.js';
import { showToast, formatDate } from './utils.js';

export async function renderClassBoard(container, classId, currentUser) {
  let activeCategory = '전체';
  const categories = ['전체', '자유게시판', '질문게시판', '수행평가 정보', '준비물', '분실물', '학급회의', '건의사항'];

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
                ${categories.slice(1).map(cat => `<option value="${cat}">${cat}</option>`).join('')}
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
          <div class="flex justify-end gap-2">
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

    try {
      await dbService.addDocument('posts', {
        classId,
        category,
        title,
        content,
        authorUid: currentUser.uid,
        authorName: currentUser.name,
        views: 0,
        likes: 0,
        likedBy: [], // Track unique likes
        hidden: false
      });

      showToast("게시글이 성공적으로 등록되었습니다.", "success");
      e.target.reset();
      writeBox.classList.add('hidden');
      loadPosts();
    } catch (err) {
      showToast("게시글 등록 실패", "error");
    }
  });

  // Dynamic Posts Loader
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

      const postComments = comments.filter(c => c.postId === p.id).sort((a,b) => a.createdAt.localeCompare(b.createdAt));
      const hasLiked = p.likedBy && p.likedBy.includes(currentUser.uid);
      const isAuthor = p.authorUid === currentUser.uid;

      return `
        <div class="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4 hover:border-gray-200 transition-all">
          
          <!-- Post Card Top -->
          <div class="flex items-start justify-between gap-4">
            <div class="space-y-1">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="bg-blue-50 text-blue-700 text-[10px] font-bold px-2.5 py-0.5 rounded-lg border border-blue-100">${p.category}</span>
                <span class="text-xs text-gray-400 font-medium">${p.authorName} 학생</span>
                <span class="text-[10px] text-gray-300 font-mono">${p.createdAt ? p.createdAt.slice(0, 16).replace('T', ' ') : ''}</span>
                ${p.hidden ? '<span class="bg-rose-50 border border-rose-100 text-rose-600 text-[9px] font-bold px-2 py-0.5 rounded-md">블라인드 적용 중</span>' : ''}
              </div>
              <h4 class="text-sm font-bold text-gray-900 mt-1.5">${p.title}</h4>
            </div>

            <!-- Mod controls (Teacher, Secretary, Author) -->
            ${isMod || isAuthor ? `
              <div class="flex items-center gap-1.5 shrink-0">
                ${isMod ? `
                  <button class="mod-hide-post text-[10px] bg-amber-50 text-amber-600 border border-amber-100 hover:bg-amber-100 hover:text-amber-700 px-2.5 py-1.5 rounded-lg font-semibold cursor-pointer" data-id="${p.id}" data-hidden="${p.hidden}">
                    ${p.hidden ? '공개 전환' : '숨김'}
                  </button>
                ` : ''}
                <button class="mod-delete-post text-[10px] bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-100 hover:text-rose-700 px-2.5 py-1.5 rounded-lg font-semibold cursor-pointer" data-id="${p.id}">
                  삭제
                </button>
              </div>
            ` : ''}
          </div>

          <!-- Post Content -->
          <p class="text-xs text-gray-600 leading-relaxed whitespace-pre-line border-t border-gray-50 pt-3">${p.content}</p>

          <!-- Interactive Footer (Like / Comment Indicator) -->
          <div class="flex items-center justify-between border-t border-gray-50 pt-3 flex-wrap gap-2">
            <div class="flex items-center gap-3">
              <!-- Like button -->
              <button class="like-post-btn flex items-center gap-1.5 text-xs font-semibold ${hasLiked ? 'text-red-600' : 'text-gray-400 hover:text-gray-600'} transition-all cursor-pointer" data-id="${p.id}">
                <svg class="w-4 h-4 ${hasLiked ? 'fill-current' : 'fill-none'}" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                공감 (${p.likes || 0})
              </button>
              <!-- Views -->
              <span class="text-xs text-gray-400 font-semibold flex items-center gap-1 font-mono">
                👁️ 조회수 ${p.views || 0}
              </span>
            </div>

            <button class="toggle-comment-section text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 font-mono cursor-pointer" data-id="${p.id}">
              💬 댓글 토글 (${postComments.length}개)
            </button>
          </div>

          <!-- Dynamic Comments Block -->
          <div id="comments-block-${p.id}" class="bg-gray-50 border border-gray-50 p-4 rounded-xl mt-2 space-y-3">
            <!-- Nested Comment Lists -->
            ${postComments.length > 0 ? `
              <div class="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                ${postComments.map(c => {
                  const isCommentOwner = c.authorUid === currentUser.uid;
                  return `
                    <div class="flex items-start justify-between gap-4 text-xs">
                      <div class="leading-relaxed">
                        <strong class="text-gray-800 font-bold">${c.authorName}</strong>
                        <span class="text-gray-600 ml-1.5">${c.content}</span>
                      </div>
                      <div class="flex items-center gap-1.5 shrink-0 font-mono">
                        <span class="text-[9px] text-gray-300">${c.createdAt ? c.createdAt.slice(11, 16) : ''}</span>
                        ${isMod || isCommentOwner ? `
                          <button class="delete-comment-trigger text-[9px] text-red-500 hover:text-red-700" data-id="${c.id}" data-post-id="${p.id}">삭제</button>
                        ` : ''}
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            ` : `
              <div class="text-center text-[11px] text-gray-400 py-2">댓글이 없습니다. 첫 의견을 작성해 보세요.</div>
            `}

            <!-- Write Comment Inline Form -->
            <form class="write-comment-form flex gap-2 border-t border-gray-100 pt-3" data-post-id="${p.id}">
              <input name="content" type="text" placeholder="예의바른 표현을 사용합시다." required class="bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-xs grow shrink-1 focus:outline-none focus:border-blue-500 font-semibold text-gray-700">
              <button type="submit" class="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-3.5 py-1.5 rounded-xl shrink-0 transition-all cursor-pointer">
                작성
              </button>
            </form>
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

    // 1. Likes toggling
    listContainer.querySelectorAll('.like-post-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const pId = btn.getAttribute('data-id');
        const post = posts.find(p => p.id === pId);
        if (!post) return;

        let likedBy = post.likedBy || [];
        let likes = post.likes || 0;

        if (likedBy.includes(currentUser.uid)) {
          // Unlike
          likedBy = likedBy.filter(id => id !== currentUser.uid);
          likes = Math.max(0, likes - 1);
        } else {
          // Like
          likedBy.push(currentUser.uid);
          likes += 1;
        }

        await dbService.updateDocument('posts', pId, {
          likes,
          likedBy
        });
        loadPosts();
      });
    });

    // 2. Incremental Views (Increments once per panel rendering / trigger)
    listContainer.querySelectorAll('.toggle-comment-section').forEach(btn => {
      btn.addEventListener('click', async () => {
        const pId = btn.getAttribute('data-id');
        const block = document.getElementById(`comments-block-${pId}`);
        block.classList.toggle('hidden');

        // Increment post views
        const post = posts.find(p => p.id === pId);
        if (post) {
          const freshViews = (post.views || 0) + 1;
          await dbService.updateDocument('posts', pId, {
            views: freshViews
          });
          // Update local view text instantly without full reload to prevent visual jump
          btn.parentNode.querySelector('.font-mono').textContent = `👁️ 조회수 ${freshViews}`;
        }
      });
    });

    // 3. Inline Comment Submission
    listContainer.querySelectorAll('.write-comment-form').forEach(form => {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const postId = form.getAttribute('data-post-id');
        const fd = new FormData(form);
        const content = fd.get('content');

        try {
          await dbService.addDocument('comments', {
            postId,
            classId,
            content,
            authorUid: currentUser.uid,
            authorName: currentUser.name
          });
          showToast("댓글이 등록되었습니다.", "success");
          form.reset();
          loadPosts();
        } catch (err) {
          showToast("댓글 작성 오류", "error");
        }
      });
    });

    // 4. Delete Comment Trigger
    listContainer.querySelectorAll('.delete-comment-trigger').forEach(btn => {
      btn.addEventListener('click', async () => {
        const cId = btn.getAttribute('data-id');
        if (confirm("이 댓글을 정말 지우시겠습니까?")) {
          await dbService.deleteDocument('comments', cId);
          showToast("댓글이 소거되었습니다.", "success");
          loadPosts();
        }
      });
    });

    // 5. Mod Hide Toggle
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

    // 6. Mod Delete Post
    listContainer.querySelectorAll('.mod-delete-post').forEach(btn => {
      btn.addEventListener('click', async () => {
        const pId = btn.getAttribute('data-id');
        if (confirm("정말 이 소통글을 강제 철회하시겠습니까? 관련 댓글까지 숨김 소실됩니다.")) {
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
