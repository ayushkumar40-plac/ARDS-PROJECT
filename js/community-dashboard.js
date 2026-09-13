/* ================================================================
   Community Connect Dashboard Integration
   Interactive features for community members, posts, and score sharing
   ================================================================ */

(function () {
  'use strict';

  // Sample community members data (integrated with clinical context)
  const communityMembers = [
    {
      id: 1,
      name: 'Sarah Johnson',
      username: 'sarahj_rehab',
      amputationType: 'below-knee',
      rehabilitationStage: 'prosthetic-training',
      currentScore: 72,
      goalScore: 85,
      joinedDate: '2024-03-15',
      bio: 'Below-knee amputee learning to walk again. Love hiking and outdoor activities.',
      avatar: 'SJ',
      isOnline: true
    },
    {
      id: 2,
      name: 'Michael Chen',
      username: 'mikec_adaptive',
      amputationType: 'above-knee',
      rehabilitationStage: 'long-term',
      currentScore: 89,
      goalScore: 95,
      joinedDate: '2023-11-20',
      bio: 'Above-knee amputee for 3 years. Engineer by day, adaptive athlete by weekend.',
      avatar: 'MC',
      isOnline: false
    },
    {
      id: 3,
      name: 'Emma Williams',
      username: 'emmaw_wellness',
      amputationType: 'upper-limb',
      rehabilitationStage: 'rehabilitation',
      currentScore: 65,
      goalScore: 80,
      joinedDate: '2024-05-08',
      bio: 'Upper-limb amputee focused on holistic recovery. Yoga instructor.',
      avatar: 'EW',
      isOnline: true
    },
    {
      id: 4,
      name: 'David Martinez',
      username: 'davidm_strength',
      amputationType: 'below-knee',
      rehabilitationStage: 'long-term',
      currentScore: 92,
      goalScore: 98,
      joinedDate: '2023-08-12',
      bio: 'Below-knee amputee and personal trainer. Specializing in strength training.',
      avatar: 'DM',
      isOnline: false
    },
    {
      id: 5,
      name: 'Lisa Thompson',
      username: 'lisat_recovery',
      amputationType: 'above-knee',
      rehabilitationStage: 'prosthetic-training',
      currentScore: 68,
      goalScore: 85,
      joinedDate: '2024-04-22',
      bio: 'Above-knee amputee navigating prosthetic training. Music therapist.',
      avatar: 'LT',
      isOnline: true
    }
  ];

  // Sample community posts
  const communityPosts = [
    {
      id: 1,
      author: 'Sarah Johnson',
      authorAvatar: 'SJ',
      authorScore: 72,
      content: 'Just reached my goal of walking 1km continuously! My rehabilitation score improved from 65 to 72 this month. The community support has been amazing! 🎉',
      timestamp: '2 hours ago',
      likes: 24,
      comments: 8,
      type: 'achievement'
    },
    {
      id: 2,
      author: 'Michael Chen',
      authorAvatar: 'MC',
      authorScore: 89,
      content: 'Anyone have tips for managing socket pressure during long work days? My current score is 89 but I feel discomfort after 6+ hours.',
      timestamp: '5 hours ago',
      likes: 15,
      comments: 12,
      type: 'question'
    },
    {
      id: 3,
      author: 'Emma Williams',
      authorAvatar: 'EW',
      authorScore: 65,
      content: 'Started adaptive yoga classes this week. It\'s helping with my balance and overall well-being. Highly recommend trying it!',
      timestamp: '1 day ago',
      likes: 32,
      comments: 6,
      type: 'tip'
    }
  ];

  // Sample shared scores and reports
  const sharedContent = [
    {
      id: 1,
      type: 'score',
      author: 'David Martinez',
      authorAvatar: 'DM',
      score: 92,
      previousScore: 88,
      improvement: '+4',
      timestamp: '3 hours ago',
      message: 'Hit a new personal best! Consistent training is paying off.'
    },
    {
      id: 2,
      type: 'report',
      author: 'Lisa Thompson',
      authorAvatar: 'LT',
      reportType: 'Monthly Progress',
      keyMetrics: 'Gait speed: 1.2m/s, Stability: 78%, Fatigue: 25%',
      timestamp: '1 day ago',
      message: 'Monthly report shows great improvement in stability metrics.'
    },
    {
      id: 3,
      type: 'score',
      author: 'Sarah Johnson',
      authorAvatar: 'SJ',
      score: 72,
      previousScore: 68,
      improvement: '+4',
      timestamp: '2 days ago',
      message: 'Finally broke the 70-point barrier! Thanks everyone for the encouragement.'
    }
  ];

  // DOM Elements
  const membersGrid = document.getElementById('communityMembersGrid');
  const postsFeed = document.getElementById('communityPostsFeed');
  const sharedContentFeed = document.getElementById('sharedContentFeed');
  const createPostBtn = document.getElementById('createPostBtn');
  const shareScoreBtn = document.getElementById('shareScoreBtn');
  const shareReportBtn = document.getElementById('shareReportBtn');

  // Initialize community dashboard
  function initCommunityDashboard() {
    renderMembers();
    renderPosts();
    renderSharedContent();
    setupEventListeners();
  }

  // Render community members
  function renderMembers() {
    if (!membersGrid) return;

    membersGrid.innerHTML = communityMembers.map(member => `
      <div class="p-4 bg-slate-800/50 border border-slate-700 rounded-lg hover:border-sky-500/50 transition cursor-pointer">
        <div class="flex items-start gap-3">
          <div class="relative">
            <div class="w-12 h-12 rounded-full bg-gradient-to-tr from-sky-600 to-teal-400 flex items-center justify-center text-white text-sm font-bold">
              ${member.avatar}
            </div>
            ${member.isOnline ? '<div class="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 rounded-full border-2 border-slate-800"></div>' : ''}
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <h4 class="text-sm font-bold text-slate-100 truncate">${member.name}</h4>
              <span class="text-xs text-slate-400">@${member.username}</span>
            </div>
            <p class="text-xs text-slate-400 mt-1 line-clamp-2">${member.bio}</p>
            <div class="flex items-center gap-2 mt-2">
              <div class="flex items-center gap-1">
                <i data-lucide="trending-up" class="w-3 h-3 text-emerald-400"></i>
                <span class="text-xs font-semibold text-emerald-400">${member.currentScore}</span>
              </div>
              <div class="text-xs text-slate-500">→ ${member.goalScore}</div>
            </div>
          </div>
        </div>
        <div class="flex gap-2 mt-3">
          <button class="flex-1 px-2 py-1.5 bg-sky-600/20 hover:bg-sky-600/30 text-sky-400 rounded text-xs font-semibold transition" onclick="connectWithMember(${member.id})">
            Connect
          </button>
          <button class="flex-1 px-2 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded text-xs font-semibold transition" onclick="viewMemberProfile(${member.id})">
            View Profile
          </button>
        </div>
      </div>
    `).join('');

    // Re-initialize Lucide icons
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  // Render community posts
  function renderPosts() {
    if (!postsFeed) return;

    postsFeed.innerHTML = communityPosts.map(post => `
      <div class="p-4 bg-slate-800/30 border border-slate-700 rounded-lg">
        <div class="flex items-start gap-3">
          <div class="w-10 h-10 rounded-full bg-gradient-to-tr from-rose-500 to-orange-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            ${post.authorAvatar}
          </div>
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-1">
              <span class="text-sm font-bold text-slate-100">${post.author}</span>
              <span class="text-xs text-slate-400">${post.timestamp}</span>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                post.type === 'achievement' ? 'bg-emerald-500/20 text-emerald-400' :
                post.type === 'question' ? 'bg-amber-500/20 text-amber-400' :
                'bg-sky-500/20 text-sky-400'
              }">${post.type}</span>
            </div>
            <p class="text-sm text-slate-300">${post.content}</p>
            <div class="flex items-center gap-4 mt-3">
              <button class="flex items-center gap-1.5 text-xs text-slate-400 hover:text-rose-400 transition" onclick="likePost(${post.id})">
                <i data-lucide="heart" class="w-4 h-4"></i>
                ${post.likes}
              </button>
              <button class="flex items-center gap-1.5 text-xs text-slate-400 hover:text-sky-400 transition" onclick="commentOnPost(${post.id})">
                <i data-lucide="message-circle" class="w-4 h-4"></i>
                ${post.comments}
              </button>
              <button class="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition">
                <i data-lucide="share-2" class="w-4 h-4"></i>
                Share
              </button>
            </div>
          </div>
        </div>
      </div>
    `).join('');

    // Re-initialize Lucide icons
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  // Render shared content (scores and reports)
  function renderSharedContent() {
    if (!sharedContentFeed) return;

    sharedContentFeed.innerHTML = sharedContent.map(content => {
      if (content.type === 'score') {
        return `
          <div class="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
            <div class="flex items-start gap-3">
              <div class="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                ${content.authorAvatar}
              </div>
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-1">
                  <span class="text-sm font-bold text-slate-100">${content.author}</span>
                  <span class="text-xs text-slate-400">${content.timestamp}</span>
                </div>
                <div class="flex items-center gap-3 mb-2">
                  <div class="text-2xl font-bold text-emerald-400">${content.score}</div>
                  <div class="text-xs text-slate-400">
                    <span class="text-slate-500">${content.previousScore}</span>
                    <span class="text-emerald-400 font-semibold ml-1">${content.improvement}</span>
                  </div>
                </div>
                <p class="text-xs text-slate-300">${content.message}</p>
              </div>
            </div>
          </div>
        `;
      } else {
        return `
          <div class="p-4 bg-sky-500/10 border border-sky-500/20 rounded-lg">
            <div class="flex items-start gap-3">
              <div class="w-10 h-10 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                ${content.authorAvatar}
              </div>
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-1">
                  <span class="text-sm font-bold text-slate-100">${content.author}</span>
                  <span class="text-xs text-slate-400">${content.timestamp}</span>
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-500/20 text-sky-400">${content.reportType}</span>
                </div>
                <div class="text-xs text-slate-300 mb-2 font-mono bg-slate-800/50 p-2 rounded">${content.keyMetrics}</div>
                <p class="text-xs text-slate-300">${content.message}</p>
              </div>
            </div>
          </div>
        `;
      }
    }).join('');

    // Re-initialize Lucide icons
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  // Setup event listeners
  function setupEventListeners() {
    if (createPostBtn) {
      createPostBtn.addEventListener('click', createNewPost);
    }

    if (shareScoreBtn) {
      shareScoreBtn.addEventListener('click', shareCurrentScore);
    }

    if (shareReportBtn) {
      shareReportBtn.addEventListener('click', shareCurrentReport);
    }
  }

  // Create new post
  function createNewPost() {
    const postContent = prompt('Share your thoughts with the community:');
    if (postContent && postContent.trim()) {
      const patient = window.dataStore ? window.dataStore.getActivePatient() : null;
      const currentScore = patient ? calculateCurrentScore(patient) : 70;

      const newPost = {
        id: communityPosts.length + 1,
        author: 'You',
        authorAvatar: 'Y',
        authorScore: currentScore,
        content: postContent,
        timestamp: 'Just now',
        likes: 0,
        comments: 0,
        type: 'update'
      };

      communityPosts.unshift(newPost);
      renderPosts();
      alert('Your thought has been shared with the community!');
    }
  }

  // Share current score
  function shareCurrentScore() {
    const patient = window.dataStore ? window.dataStore.getActivePatient() : null;
    if (!patient) {
      alert('Please select a patient first to share their score.');
      return;
    }

    const currentScore = calculateCurrentScore(patient);
    const previousScore = currentScore - Math.floor(Math.random() * 5) - 1; // Simulated previous score
    const improvement = currentScore - previousScore;

    const newScoreShare = {
      id: sharedContent.length + 1,
      type: 'score',
      author: 'You',
      authorAvatar: 'Y',
      score: currentScore,
      previousScore: previousScore,
      improvement: `+${improvement}`,
      timestamp: 'Just now',
      message: 'Sharing my current rehabilitation progress with the community.'
    };

    sharedContent.unshift(newScoreShare);
    renderSharedContent();
    alert(`Your score of ${currentScore} has been shared with the community!`);
  }

  // Share current report
  function shareCurrentReport() {
    const patient = window.dataStore ? window.dataStore.getActivePatient() : null;
    if (!patient) {
      alert('Please select a patient first to share their report.');
      return;
    }

    const session = window.dataStore ? window.dataStore.getActiveSession() : null;
    if (!session) {
      alert('Please select a session first to share the report.');
      return;
    }

    const keyMetrics = `Gait speed: ${session.gaitSpeed || 'N/A'} m/s, Stability: ${session.stability || 'N/A'}%, Fatigue: ${session.fatigue || 'N/A'}%`;

    const newReportShare = {
      id: sharedContent.length + 1,
      type: 'report',
      author: 'You',
      authorAvatar: 'Y',
      reportType: 'Session Report',
      keyMetrics: keyMetrics,
      timestamp: 'Just now',
      message: 'Sharing my clinical session report with the community.'
    };

    sharedContent.unshift(newReportShare);
    renderSharedContent();
    alert('Your clinical report has been shared with the community!');
  }

  // Calculate current score (simplified version)
  function calculateCurrentScore(patient) {
    if (!patient || !patient.sessions || patient.sessions.length === 0) {
      return 70; // Default score
    }

    const latestSession = patient.sessions[patient.sessions.length - 1];
    // Simple score calculation based on available metrics
    let score = 50; // Base score
    
    if (latestSession.gaitSpeed) {
      score += Math.min(latestSession.gaitSpeed * 10, 25);
    }
    if (latestSession.stability) {
      score += Math.min(latestSession.stability * 0.2, 20);
    }
    if (latestSession.fatigue) {
      score += Math.max(0, 20 - latestSession.fatigue * 0.3);
    }

    return Math.min(Math.round(score), 100);
  }

  // Connect with member
  window.connectWithMember = function(memberId) {
    const member = communityMembers.find(m => m.id === memberId);
    if (member) {
      alert(`Connection request sent to ${member.name}!\n\nThey will be notified and can choose to accept your connection.`);
    }
  };

  // View member profile
  window.viewMemberProfile = function(memberId) {
    const member = communityMembers.find(m => m.id === memberId);
    if (member) {
      alert(`${member.name}'s Profile\n\nCurrent Score: ${member.currentScore}\nGoal: ${member.goalScore}\nStage: ${member.rehabilitationStage}\n\nBio: ${member.bio}`);
    }
  };

  // Like post
  window.likePost = function(postId) {
    const post = communityPosts.find(p => p.id === postId);
    if (post) {
      post.likes++;
      renderPosts();
    }
  };

  // Comment on post
  window.commentOnPost = function(postId) {
    const comment = prompt('Add a comment:');
    if (comment && comment.trim()) {
      const post = communityPosts.find(p => p.id === postId);
      if (post) {
        post.comments++;
        renderPosts();
        alert('Comment added successfully!');
      }
    }
  };

  // Initialize when the community tab is activated
  function observeCommunityTab() {
    const communityTab = document.getElementById('nav-btn-community');
    if (communityTab) {
      communityTab.addEventListener('click', () => {
        // Small delay to ensure the tab is visible before rendering
        setTimeout(() => {
          initCommunityDashboard();
        }, 100);
      });
    }
  }

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', observeCommunityTab);
  } else {
    observeCommunityTab();
  }

})();
