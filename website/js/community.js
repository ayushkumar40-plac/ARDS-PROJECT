/* ================================================================
   Community Connect — JavaScript
   Interactive features for community functionality
   ================================================================ */

(function () {
  'use strict';

  // Sample community members data
  const communityMembers = [
    {
      id: 1,
      name: 'Sarah Johnson',
      username: 'sarahj_rehab',
      age: 34,
      location: 'San Diego, CA',
      amputationType: 'below-knee',
      rehabilitationStage: 'prosthetic-training',
      prostheticExperience: '6-12-months',
      bio: ' below-knee amputee learning to walk again. Love hiking and outdoor activities. Looking to connect with others on similar journeys.',
      interests: ['Hiking', 'Swimming', 'Adaptive Sports'],
      whatsappAvailable: true,
      whatsappConsent: true,
      avatar: 'SJ'
    },
    {
      id: 2,
      name: 'Michael Chen',
      username: 'mikec_adaptive',
      age: 42,
      location: 'New York, NY',
      amputationType: 'above-knee',
      rehabilitationStage: 'long-term',
      prostheticExperience: '3-plus-years',
      bio: 'Above-knee amputee for 3 years. Engineer by day, adaptive athlete by weekend. Happy to share my experience with prosthetics.',
      interests: ['Cycling', 'Running', 'Technology'],
      whatsappAvailable: true,
      whatsappConsent: true,
      avatar: 'MC'
    },
    {
      id: 3,
      name: 'Emma Williams',
      username: 'emmaw_wellness',
      age: 28,
      location: 'London, UK',
      amputationType: 'upper-limb',
      rehabilitationStage: 'rehabilitation',
      prostheticExperience: '1-6-months',
      bio: 'Upper-limb amputee focused on holistic recovery. Yoga instructor sharing adaptive techniques for mind-body wellness.',
      interests: ['Yoga', 'Meditation', 'Art Therapy'],
      whatsappAvailable: false,
      whatsappConsent: false,
      avatar: 'EW'
    },
    {
      id: 4,
      name: 'David Martinez',
      username: 'davidm_strength',
      age: 51,
      location: 'Austin, TX',
      amputationType: 'below-knee',
      rehabilitationStage: 'long-term',
      prostheticExperience: '3-plus-years',
      bio: 'Below-knee amputee and personal trainer. Specializing in strength training for amputees. Let\'s get stronger together!',
      interests: ['Fitness', 'Coaching', 'Nutrition'],
      whatsappAvailable: true,
      whatsappConsent: true,
      avatar: 'DM'
    },
    {
      id: 5,
      name: 'Lisa Thompson',
      username: 'lisat_recovery',
      age: 39,
      location: 'Seattle, WA',
      amputationType: 'above-knee',
      rehabilitationStage: 'prosthetic-training',
      prostheticExperience: '6-12-months',
      bio: 'Above-knee amputee navigating prosthetic training. Music therapist by profession. Finding rhythm in recovery.',
      interests: ['Music', 'Dance', 'Creative Arts'],
      whatsappAvailable: true,
      whatsappConsent: true,
      avatar: 'LT'
    },
    {
      id: 6,
      name: 'James Wilson',
      username: 'jamesw_active',
      age: 45,
      location: 'Denver, CO',
      amputationType: 'multiple',
      rehabilitationStage: 'long-term',
      prostheticExperience: '3-plus-years',
      bio: 'Multiple amputee living an active lifestyle. Advocate for accessibility and adaptive sports. Always happy to help newcomers.',
      interests: ['Advocacy', 'Skiing', 'Cycling'],
      whatsappAvailable: true,
      whatsappConsent: true,
      avatar: 'JW'
    },
    {
      id: 7,
      name: 'Amanda Lee',
      username: 'amandal_support',
      age: 31,
      location: 'Chicago, IL',
      amputationType: 'below-knee',
      rehabilitationStage: 'early-recovery',
      prostheticExperience: 'new-user',
      bio: 'Recently underwent below-knee amputation. Looking for guidance and support from the community. Medical student.',
      interests: ['Reading', 'Medicine', 'Support Groups'],
      whatsappAvailable: true,
      whatsappConsent: true,
      avatar: 'AL'
    },
    {
      id: 8,
      name: 'Robert Garcia',
      username: 'robertg_resilience',
      age: 58,
      location: 'Miami, FL',
      amputationType: 'above-knee',
      rehabilitationStage: 'long-term',
      prostheticExperience: '3-plus-years',
      bio: 'Above-knee amputee for 5 years. Retired military. Believe in the power of community and resilience.',
      interests: ['Fishing', 'Mentoring', 'Veterans Support'],
      whatsappAvailable: true,
      whatsappConsent: true,
      avatar: 'RG'
    }
  ];

  // Sample community posts
  const communityPosts = [
    {
      id: 1,
      author: 'Sarah Johnson',
      authorAvatar: 'SJ',
      title: 'First Day with New Prosthetic - Mixed Emotions',
      content: 'Today was my first day with my new prosthetic leg. It\'s overwhelming but also exciting. The physical therapist was amazing, but I\'m nervous about the journey ahead. Any words of wisdom from those who\'ve been there?',
      category: 'experience',
      timestamp: '2 hours ago',
      likes: 24,
      comments: 8
    },
    {
      id: 2,
      author: 'Michael Chen',
      authorAvatar: 'MC',
      title: 'Tips for Returning to Work',
      content: 'After 6 months of rehabilitation, I\'m returning to work next week. I\'ve learned some great strategies for navigating the office environment with a prosthetic. Happy to share what worked for me!',
      category: 'tips',
      timestamp: '5 hours ago',
      likes: 45,
      comments: 12
    },
    {
      id: 3,
      author: 'Emma Williams',
      authorAvatar: 'EW',
      title: 'Celebrating Small Victories',
      content: 'Today I managed to prepare dinner completely independently using my adaptive tools. It might seem small, but it feels huge! Celebrating every win on this journey. 🎉',
      category: 'milestone',
      timestamp: '1 day ago',
      likes: 67,
      comments: 23
    },
    {
      id: 4,
      author: 'David Martinez',
      authorAvatar: 'DM',
      title: 'Question About Prosthetic Maintenance',
      content: 'Looking for recommendations on daily maintenance routines for prosthetic legs. What works best for keeping everything in good condition?',
      category: 'question',
      timestamp: '2 days ago',
      likes: 18,
      comments: 15
    }
  ];

  // Category labels mapping
  const categoryLabels = {
    'experience': 'Share Experience',
    'question': 'Ask Question',
    'encouragement': 'Offer Encouragement',
    'tips': 'Share Tips',
    'milestone': 'Celebrate Milestone'
  };

  // Stage labels mapping
  const stageLabels = {
    'pre-surgery': 'Pre-Surgery',
    'early-recovery': 'Early Recovery',
    'rehabilitation': 'Rehabilitation',
    'prosthetic-training': 'Prosthetic Training',
    'long-term': 'Long-term Adaptation'
  };

  // Experience labels mapping
  const experienceLabels = {
    'new-user': 'New User',
    '1-6-months': '1-6 Months',
    '6-12-months': '6-12 Months',
    '1-3-years': '1-3 Years',
    '3-plus-years': '3+ Years'
  };

  // Amputation type labels
  const amputationLabels = {
    'above-knee': 'Above-Knee',
    'below-knee': 'Below-Knee',
    'upper-limb': 'Upper-Limb',
    'multiple': 'Multiple'
  };

  // Current state
  let currentCategory = 'all';
  let currentFilters = {
    amputation: '',
    stage: '',
    experience: '',
    location: ''
  };
  let searchQuery = '';

  // DOM Elements
  const membersGrid = document.getElementById('membersGrid');
  const categoryBtns = document.querySelectorAll('.category-btn');
  const searchInput = document.getElementById('communitySearch');
  const filterSelects = {
    amputation: document.getElementById('filterAmputation'),
    stage: document.getElementById('filterStage'),
    experience: document.getElementById('filterExperience'),
    location: document.getElementById('filterLocation')
  };
  const applyFiltersBtn = document.getElementById('applyFilters');
  const resetFiltersBtn = document.getElementById('resetFilters');
  const filteredResults = document.getElementById('filteredResults');
  const postsFeed = document.getElementById('postsFeed');
  const createPostForm = document.getElementById('createPostForm');

  // Modal elements
  const profileModal = document.getElementById('profileModal');
  const profileModalOverlay = document.getElementById('profileModalOverlay');
  const closeProfileModal = document.getElementById('closeProfileModal');
  const profileModalBody = document.getElementById('profileModalBody');

  const whatsappModal = document.getElementById('whatsappModal');
  const whatsappModalOverlay = document.getElementById('whatsappModalOverlay');
  const closeWhatsappModal = document.getElementById('closeWhatsappModal');
  const whatsappUserName = document.getElementById('whatsappUserName');
  const confirmWhatsapp = document.getElementById('confirmWhatsapp');
  const cancelWhatsapp = document.getElementById('cancelWhatsapp');

  let currentWhatsappUser = null;

  // Initialize community page
  function initCommunity() {
    renderMembers();
    renderPosts();
    setupEventListeners();
    animateCounters();
  }

  // Render community members
  function renderMembers(members = communityMembers) {
    if (!membersGrid) return;

    const filteredMembers = filterMembers(members);

    if (filteredMembers.length === 0) {
      membersGrid.innerHTML = `
        <div class="empty-state">
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3M12 17h.01"/></svg>
          <h4>No members found</h4>
          <p>Try adjusting your filters or search terms.</p>
        </div>
      `;
      return;
    }

    membersGrid.innerHTML = filteredMembers.map(member => `
      <div class="member-card" data-member-id="${member.id}" tabindex="0" role="button" aria-label="View ${member.name}'s profile">
        <div class="member-header">
          <div class="member-avatar">
            ${member.avatar}
          </div>
          <div class="member-info">
            <h3 class="member-name">${member.name}</h3>
            <p class="member-details">@${member.username}</p>
            <span class="member-stage">${stageLabels[member.rehabilitationStage] || member.rehabilitationStage}</span>
          </div>
        </div>
        <p class="member-bio">${member.bio}</p>
        <div class="member-interests">
          ${member.interests.map(interest => `<span class="interest-tag">${interest}</span>`).join('')}
        </div>
        <div class="member-actions">
          <button class="btn btn-primary btn-sm connect-btn" data-member-id="${member.id}">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
            Connect
          </button>
          ${member.whatsappAvailable && member.whatsappConsent ? `
            <button class="btn btn-secondary btn-sm whatsapp-btn" data-member-id="${member.id}">
              <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/></svg>
              WhatsApp
            </button>
          ` : ''}
        </div>
      </div>
    `).join('');

    // Add event listeners to member cards
    document.querySelectorAll('.member-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (!e.target.closest('.connect-btn') && !e.target.closest('.whatsapp-btn')) {
          const memberId = parseInt(card.dataset.memberId);
          showProfileModal(memberId);
        }
      });

      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const memberId = parseInt(card.dataset.memberId);
          showProfileModal(memberId);
        }
      });
    });

    // Add event listeners to connect buttons
    document.querySelectorAll('.connect-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const memberId = parseInt(btn.dataset.memberId);
        handleConnect(memberId);
      });
    });

    // Add event listeners to WhatsApp buttons
    document.querySelectorAll('.whatsapp-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const memberId = parseInt(btn.dataset.memberId);
        showWhatsappConsent(memberId);
      });
    });
  }

  // Filter members based on current filters and search
  function filterMembers(members) {
    return members.filter(member => {
      // Category filter
      if (currentCategory !== 'all') {
        if (currentCategory === 'above-knee' && member.amputationType !== 'above-knee') return false;
        if (currentCategory === 'below-knee' && member.amputationType !== 'below-knee') return false;
        if (currentCategory === 'upper-limb' && member.amputationType !== 'upper-limb') return false;
        if (currentCategory === 'prosthetic-users' && member.prostheticExperience === 'new-user') return false;
        if (currentCategory === 'rehab-support' && member.rehabilitationStage === 'long-term') return false;
      }

      // Advanced filters
      if (currentFilters.amputation && member.amputationType !== currentFilters.amputation) return false;
      if (currentFilters.stage && member.rehabilitationStage !== currentFilters.stage) return false;
      if (currentFilters.experience && member.prostheticExperience !== currentFilters.experience) return false;

      // Search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const searchableText = `${member.name} ${member.username} ${member.bio} ${member.interests.join(' ')}`.toLowerCase();
        if (!searchableText.includes(query)) return false;
      }

      return true;
    });
  }

  // Render community posts
  function renderPosts() {
    if (!postsFeed) return;

    postsFeed.innerHTML = communityPosts.map(post => `
      <div class="post-card">
        <div class="post-header">
          <div class="post-author">
            <div class="post-author-avatar">${post.authorAvatar}</div>
            <div>
              <div class="post-author-name">${post.author}</div>
              <div class="post-meta">${post.timestamp}</div>
            </div>
          </div>
          <span class="post-category">${categoryLabels[post.category] || post.category}</span>
        </div>
        <h4 class="post-title">${post.title}</h4>
        <p class="post-content">${post.content}</p>
        <div class="post-actions">
          <button class="post-action like-btn" data-post-id="${post.id}">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
            ${post.likes}
          </button>
          <button class="post-action comment-btn" data-post-id="${post.id}">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/></svg>
            ${post.comments}
          </button>
          <button class="post-action share-btn" data-post-id="${post.id}">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
            Share
          </button>
          <button class="post-action report-btn" data-post-id="${post.id}">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            Report
          </button>
        </div>
      </div>
    `).join('');

    // Add event listeners to post actions
    document.querySelectorAll('.like-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const postId = parseInt(btn.dataset.postId);
        handleLike(postId);
      });
    });

    document.querySelectorAll('.comment-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const postId = parseInt(btn.dataset.postId);
        handleComment(postId);
      });
    });

    document.querySelectorAll('.report-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const postId = parseInt(btn.dataset.postId);
        handleReport(postId);
      });
    });
  }

  // Show profile modal
  function showProfileModal(memberId) {
    const member = communityMembers.find(m => m.id === memberId);
    if (!member) return;

    profileModalBody.innerHTML = `
      <div class="profile-detail">
        <div class="profile-detail-avatar">${member.avatar}</div>
        <div class="profile-detail-info">
          <h4>${member.name}</h4>
          <p>@${member.username}</p>
          <p class="text-sm text-muted">${member.location || 'Location not specified'}</p>
        </div>
      </div>

      <div class="profile-section">
        <h5>About</h5>
        <p>${member.bio}</p>
      </div>

      <div class="profile-section">
        <h5>Rehabilitation Journey</h5>
        <p><strong>Amputation Type:</strong> ${amputationLabels[member.amputationType] || member.amputationType}</p>
        <p><strong>Current Stage:</strong> ${stageLabels[member.rehabilitationStage] || member.rehabilitationStage}</p>
        <p><strong>Prosthetic Experience:</strong> ${experienceLabels[member.prostheticExperience] || member.prostheticExperience}</p>
      </div>

      <div class="profile-section">
        <h5>Interests</h5>
        <div class="profile-interests-list">
          ${member.interests.map(interest => `<span class="interest-tag">${interest}</span>`).join('')}
        </div>
      </div>

      <div class="modal-actions">
        <button class="btn btn-primary" onclick="handleConnect(${member.id})">
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
          Connect
        </button>
        ${member.whatsappAvailable && member.whatsappConsent ? `
          <button class="btn btn-secondary" onclick="showWhatsappConsent(${member.id})">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/></svg>
            Chat on WhatsApp
          </button>
        ` : ''}
        <button class="btn btn-outline" onclick="handleBlock(${member.id})">
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/><line x1="19.07" y1="4.93" x2="4.93" y2="19.07"/></svg>
          Block User
        </button>
      </div>
    `;

    profileModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  // Close profile modal
  function closeProfileModalHandler() {
    profileModal.classList.remove('active');
    document.body.style.overflow = '';
  }

  // Show WhatsApp consent modal
  function showWhatsappConsent(memberId) {
    const member = communityMembers.find(m => m.id === memberId);
    if (!member || !member.whatsappAvailable || !member.whatsappConsent) return;

    currentWhatsappUser = member;
    whatsappUserName.textContent = member.name;
    whatsappModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  // Close WhatsApp modal
  function closeWhatsappModalHandler() {
    whatsappModal.classList.remove('active');
    document.body.style.overflow = '';
    currentWhatsappUser = null;
  }

  // Handle WhatsApp connection
  function handleWhatsappConnection() {
    if (!currentWhatsappUser) return;

    // In a real implementation, this would open WhatsApp with the user's number
    // For privacy, we're not including actual phone numbers in this demo
    alert(`Opening WhatsApp to connect with ${currentWhatsappUser.name}...\n\nIn a real implementation, this would open WhatsApp with their contact information.`);
    
    closeWhatsappModalHandler();
  }

  // Handle connect action
  function handleConnect(memberId) {
    const member = communityMembers.find(m => m.id === memberId);
    if (!member) return;

    alert(`Connection request sent to ${member.name}!\n\nThey will be notified and can choose to accept your connection.`);
  }

  // Handle block action
  function handleBlock(memberId) {
    const member = communityMembers.find(m => m.id === memberId);
    if (!member) return;

    if (confirm(`Are you sure you want to block ${member.name}? They will no longer be able to contact you.`)) {
      alert(`${member.name} has been blocked. You can unblock them in your settings.`);
      closeProfileModalHandler();
    }
  }

  // Handle like action
  function handleLike(postId) {
    const post = communityPosts.find(p => p.id === postId);
    if (!post) return;

    post.likes++;
    renderPosts();
  }

  // Handle comment action
  function handleComment(postId) {
    const post = communityPosts.find(p => p.id === postId);
    if (!post) return;

    const comment = prompt('Add a comment:');
    if (comment && comment.trim()) {
      post.comments++;
      alert('Comment added successfully!');
      renderPosts();
    }
  }

  // Handle report action
  function handleReport(postId) {
    const post = communityPosts.find(p => p.id === postId);
    if (!post) return;

    if (confirm('Are you sure you want to report this post? Our team will review it shortly.')) {
      alert('Post reported successfully. Thank you for helping keep our community safe.');
    }
  }

  // Setup event listeners
  function setupEventListeners() {
    // Category buttons
    categoryBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        categoryBtns.forEach(b => {
          b.classList.remove('active');
          b.setAttribute('aria-selected', 'false');
          b.setAttribute('tabindex', '-1');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');
        btn.setAttribute('tabindex', '0');
        currentCategory = btn.dataset.category;
        renderMembers();
      });

      // Keyboard navigation for category buttons
      btn.addEventListener('keydown', (e) => {
        const buttons = Array.from(categoryBtns);
        const currentIndex = buttons.indexOf(btn);
        
        switch (e.key) {
          case 'ArrowLeft':
          case 'ArrowUp':
            e.preventDefault();
            const prevIndex = (currentIndex - 1 + buttons.length) % buttons.length;
            buttons[prevIndex].focus();
            buttons[prevIndex].click();
            break;
          case 'ArrowRight':
          case 'ArrowDown':
            e.preventDefault();
            const nextIndex = (currentIndex + 1) % buttons.length;
            buttons[nextIndex].focus();
            buttons[nextIndex].click();
            break;
          case 'Home':
            e.preventDefault();
            buttons[0].focus();
            buttons[0].click();
            break;
          case 'End':
            e.preventDefault();
            buttons[buttons.length - 1].focus();
            buttons[buttons.length - 1].click();
            break;
        }
      });
    });

    // Search input
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        renderMembers();
      });
    }

    // Filter buttons
    if (applyFiltersBtn) {
      applyFiltersBtn.addEventListener('click', () => {
        currentFilters.amputation = filterSelects.amputation.value;
        currentFilters.stage = filterSelects.stage.value;
        currentFilters.experience = filterSelects.experience.value;
        currentFilters.location = filterSelects.location.value;
        
        renderMembers();
        
        // Scroll to filtered results
        if (filteredResults) {
          filteredResults.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    }

    if (resetFiltersBtn) {
      resetFiltersBtn.addEventListener('click', () => {
        filterSelects.amputation.value = '';
        filterSelects.stage.value = '';
        filterSelects.experience.value = '';
        filterSelects.location.value = '';
        
        currentFilters = {
          amputation: '',
          stage: '',
          experience: '',
          location: ''
        };
        
        renderMembers();
      });
    }

    // Modal close handlers
    if (profileModalOverlay) {
      profileModalOverlay.addEventListener('click', closeProfileModalHandler);
    }
    if (closeProfileModal) {
      closeProfileModal.addEventListener('click', closeProfileModalHandler);
    }

    if (whatsappModalOverlay) {
      whatsappModalOverlay.addEventListener('click', closeWhatsappModalHandler);
    }
    if (closeWhatsappModal) {
      closeWhatsappModal.addEventListener('click', closeWhatsappModalHandler);
    }

    if (confirmWhatsapp) {
      confirmWhatsapp.addEventListener('click', handleWhatsappConnection);
    }
    if (cancelWhatsapp) {
      cancelWhatsapp.addEventListener('click', closeWhatsappModalHandler);
    }

    // Create post form
    if (createPostForm) {
      createPostForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const title = document.getElementById('postTitle').value;
        const content = document.getElementById('postContent').value;
        const category = document.getElementById('postCategory').value;

        if (title && content && category) {
          const newPost = {
            id: communityPosts.length + 1,
            author: 'You',
            authorAvatar: 'Y',
            title: title,
            content: content,
            category: category,
            timestamp: 'Just now',
            likes: 0,
            comments: 0
          };

          communityPosts.unshift(newPost);
          renderPosts();
          createPostForm.reset();
          alert('Your post has been shared with the community!');
        }
      });
    }

    // Keyboard navigation for modals
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeProfileModalHandler();
        closeWhatsappModalHandler();
      }
    });

    // Join community button
    const joinCommunityBtn = document.getElementById('joinCommunityBtn');
    if (joinCommunityBtn) {
      joinCommunityBtn.addEventListener('click', () => {
        alert('Welcome to the Community Connect! 🎉\n\nYou can now browse members, share your story, and connect with others on similar rehabilitation journeys.');
      });
    }

    // Find someone button
    const findSomeoneBtn = document.getElementById('findSomeoneBtn');
    if (findSomeoneBtn) {
      findSomeoneBtn.addEventListener('click', () => {
        document.getElementById('findSomeoneSection').scrollIntoView({ behavior: 'smooth' });
      });
    }

    // Safety notice buttons
    const viewGuidelinesBtn = document.getElementById('viewGuidelinesBtn');
    if (viewGuidelinesBtn) {
      viewGuidelinesBtn.addEventListener('click', () => {
        alert('Community Guidelines:\n\n1. Be respectful and supportive\n2. Share experiences, not medical advice\n3. Protect your privacy - don\'t share personal information\n4. Report inappropriate behavior\n5. Help create a safe, welcoming environment');
      });
    }

    const reportIssueBtn = document.getElementById('reportIssueBtn');
    if (reportIssueBtn) {
      reportIssueBtn.addEventListener('click', () => {
        alert('To report an issue, please contact our support team at support@ards-health.com\n\nWe take community safety seriously and will respond within 24 hours.');
      });
    }
  }

  // Animate counters
  function animateCounters() {
    const counters = document.querySelectorAll('[data-count]');
    
    counters.forEach(counter => {
      const target = parseFloat(counter.getAttribute('data-count'));
      const suffix = counter.getAttribute('data-suffix') || '';
      const duration = 2000;
      const startTime = performance.now();

      function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 4);
        const current = Math.round(target * eased);
        counter.textContent = current.toLocaleString() + suffix;
        
        if (progress < 1) {
          requestAnimationFrame(update);
        }
      }

      requestAnimationFrame(update);
    });
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCommunity);
  } else {
    initCommunity();
  }

  // Expose functions for onclick handlers
  window.handleConnect = handleConnect;
  window.showWhatsappConsent = showWhatsappConsent;
  window.handleBlock = handleBlock;

})();
