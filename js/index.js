// Update the imports to use the correct paths
import { auth, db } from './firebase-config.js';
import { 
    collection, 
    query, 
    where, 
    orderBy, 
    limit, 
    onSnapshot, 
    updateDoc,
    doc,
    getDocs,
    writeBatch,getDoc,getFirestore
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

const notificationsDropdown = document.getElementById('notificationsDropdown');
const userMenuDropdown = document.getElementById('userMenuDropdown');

// Handle notifications
function initializeNotifications() {
    const notificationsRef = collection(db, 'notifications');
    const notificationsQuery = query(
        notificationsRef,
        where('read', '==', false),
        orderBy('timestamp', 'desc'),
        limit(5)
    );

    onSnapshot(notificationsQuery, (snapshot) => {
        const notifications = [];
        snapshot.forEach((doc) => {
            notifications.push({ id: doc.id, ...doc.data() });
        });

        updateNotificationsUI(notifications);
    });
}

function updateNotificationsUI(notifications) {
    const unreadCount = notifications.length;
    
    notificationsDropdown.innerHTML = `
        <div class="dropdown">
            <button class="notification-btn" data-bs-toggle="dropdown">
                <i class="bi bi-bell"></i>
                ${unreadCount > 0 ? `<span class="badge">${unreadCount}</span>` : ''}
            </button>
            <div class="dropdown-menu dropdown-menu-end notifications-menu animate slideIn">
                <div class="notifications-header">
                    <h6 class="mb-0">Notifications</h6>
                    ${unreadCount > 0 ? `<button class="btn btn-link btn-sm" onclick="markAllAsRead()">Mark all as read</button>` : ''}
                </div>
                <div class="notifications-list">
                    ${notifications.length > 0 ? notifications.map(notification => `
                        <div class="notification-item" data-id="${notification.id}">
                            <div class="notification-icon ${notification.type}-icon">
                                <i class="bi bi-${getNotificationIcon(notification.type)}"></i>
                            </div>
                            <div class="notification-content">
                                <p class="notification-text">${notification.message}</p>
                                <span class="notification-time">${formatTimestamp(notification.timestamp)}</span>
                            </div>
                            <button class="mark-read-btn" onclick="markAsRead('${notification.id}')">
                                <i class="bi bi-check2"></i>
                            </button>
                        </div>
                    `).join('') : `
                        <div class="no-notifications">
                            <i class="bi bi-bell-slash"></i>
                            <p>No new notifications</p>
                        </div>
                    `}
                </div>
            </div>
        </div>
    `;
}

// Handle user menu
// Handle user menu
auth.onAuthStateChanged((user) => {
    if (user) {
        // Get additional user data from Firestore
        const userRef = doc(db, 'users', user.uid);
        getDoc(userRef).then((doc) => {
            const userData = doc.data() || {};
            const firstName = capitalizeFirstLetter(userData.firstName || user.email.split('@')[0]);
            const profileImage = userData.profileImageUrl || user.profileImageUrl || '/images/default.webp';
            const userRole = userData.role || 'User';

            // Update top navigation user menu
            userMenuDropdown.innerHTML = `
                <div class="dropdown">
                    <button class="user-dropdown" data-bs-toggle="dropdown">
                        <div class="user-avatar">
                            <img src="${profileImage}" alt="${firstName}">
                            <span class="status-indicator online"></span>
                        </div>
                        <div class="user-info">
                            <span class="user-name">${firstName}</span>
                        </div>
                        <i class="bi bi-chevron-down"></i>
                    </button>
                    <ul class="dropdown-menu dropdown-menu-end animate slideIn">
                        <li class="dropdown-header">Welcome, ${firstName}!</li>
                        <li><a class="dropdown-item" href="profile.html">
                            <i class="bi bi-person-circle me-2"></i>My Profile
                        </a></li>
                        <li><a class="dropdown-item" href="settings.html">
                            <i class="bi bi-gear me-2"></i>Settings
                        </a></li>
                        <li><hr class="dropdown-divider"></li>
                        <li><a class="dropdown-item" href="#" id="logoutBtn">
                            <i class="bi bi-box-arrow-right me-2"></i>Sign Out
                        </a></li>
                    </ul>
                </div>
            `;

            // Update sidebar footer
            const sidebarFooter = document.querySelector('.sidebar-footer');
            sidebarFooter.innerHTML = `
                <div class="user-profile">
                    <img src="${profileImage}" alt="${firstName}" class="profile-img">
                    <div class="profile-info">
                        <h6 class="profile-name">${firstName}</h6>
                        <span class="profile-role">${userRole}</span>
                    </div>
                </div>
                <a href="#" class="logout-btn" id="sidebarLogoutBtn">
                    <i class="bi bi-box-arrow-right"></i>
                </a>
            `;

            // Add event listeners for both logout buttons
            document.getElementById('logoutBtn').addEventListener('click', handleLogout);
            document.getElementById('sidebarLogoutBtn').addEventListener('click', handleLogout);
        });

        initializeNotifications();
        initializeCommentsCount(); // Add this line
    } else {
        userMenuDropdown.innerHTML = `
            <div class="dropdown">
                <button class="user-dropdown" data-bs-toggle="dropdown">
                    <i class="bi bi-person-circle me-2"></i>
                    <span>Account</span>
                    <i class="bi bi-chevron-down"></i>
                </button>
                <ul class="dropdown-menu dropdown-menu-end animate slideIn">
                    <li><a class="dropdown-item" href="login.html">
                        <i class="bi bi-box-arrow-in-right me-2"></i>Sign In
                    </a></li>
                    <li><a class="dropdown-item" href="signup.html">
                        <i class="bi bi-person-plus me-2"></i>Sign Up
                    </a></li>
                </ul>
            </div>
        `;

        notificationsDropdown.innerHTML = '';
    }
});

// Add this utility function
function capitalizeFirstLetter(string) {
    if (!string) return '';
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
}

// Utility functions
function getNotificationIcon(type) {
    const icons = {
        job: 'briefcase',
        news: 'newspaper',
        profile: 'person',
        comment: 'chat-dots',
        default: 'bell'
    };
    return icons[type] || icons.default;
}

function formatTimestamp(timestamp) {
    const date = timestamp.toDate();
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
}

async function markAsRead(notificationId) {
    try {
        const notificationRef = doc(db, 'notifications', notificationId);
        await updateDoc(notificationRef, { read: true });
    } catch (error) {
        console.error('Error marking notification as read:', error);
    }
}

async function markAllAsRead() {
    const notificationsRef = collection(db, 'notifications');
    const unreadQuery = query(notificationsRef, where('read', '==', false));
    
    try {
        const snapshot = await getDocs(unreadQuery);
        const batch = writeBatch(db);
        
        snapshot.forEach((doc) => {
            batch.update(doc.ref, { read: true });
        });
        
        await batch.commit();
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
    }
}

// Initialize stats cards
function initializeStatsCards() {
    const statsCards = {
        jobs: document.querySelector('.stats-card.bg-primary .card-info h3'),
        users: document.querySelector('.stats-card.bg-success .card-info h3'),
        news: document.querySelector('.stats-card.bg-warning .card-info h3'),
        views: document.querySelector('.stats-card.bg-danger .card-info h3')
    };

    const growthIndicators = {
        jobs: document.querySelector('.stats-card.bg-primary .card-growth'),
        users: document.querySelector('.stats-card.bg-success .card-growth'),
        news: document.querySelector('.stats-card.bg-warning .card-growth'),
        views: document.querySelector('.stats-card.bg-danger .card-growth')
    };

    // Show loading state
    Object.values(statsCards).forEach(card => {
        card.innerHTML = '<div class="spinner-border spinner-border-sm" role="status"></div>';
    });

    // Get current and last month dates
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    // Monitor jobs collection
    const jobsQuery = query(collection(db, 'jobs'));
    const jobsLastMonthQuery = query(collection(db, 'jobs'), where('createdAt', '<', thisMonth));

    // Monitor active users
    const usersQuery = query(collection(db, 'users'));
    const usersLastMonthQuery = query(collection(db, 'users'),
        where('updatedAt', '<', thisMonth)
    );

    // Monitor news articles
    const newsQuery = query(collection(db, 'news'));
    const newsLastMonthQuery = query(collection(db, 'news'), where('createdAt', '<', thisMonth));

    
    // Update stats in real-time
    onSnapshot(jobsQuery, async (snapshot) => {
        try {
            const currentCount = snapshot.size;
            const lastMonthSnapshot = await getDocs(jobsLastMonthQuery);
            const lastMonthCount = lastMonthSnapshot.size;
            updateStats('jobs', currentCount, lastMonthCount, statsCards.jobs, growthIndicators.jobs);
        } catch (error) {
            console.error('Error fetching jobs stats:', error);
            showError(statsCards.jobs, growthIndicators.jobs);
        }
    });

    onSnapshot(usersQuery, async (snapshot) => {
        try {
            const currentCount = snapshot.size;
            const lastMonthSnapshot = await getDocs(usersLastMonthQuery);
            const lastMonthCount = lastMonthSnapshot.size;
            updateStats('users', currentCount, lastMonthCount, statsCards.users, growthIndicators.users);
        } catch (error) {
            console.error('Error fetching users stats:', error);
            showError(statsCards.users, growthIndicators.users);
        }
    });

    onSnapshot(newsQuery, async (snapshot) => {
        try {
            const currentCount = snapshot.size;
            const lastMonthSnapshot = await getDocs(newsLastMonthQuery);
            const lastMonthCount = lastMonthSnapshot.size;
            updateStats('news', currentCount, lastMonthCount, statsCards.news, growthIndicators.news);
        } catch (error) {
            console.error('Error fetching news stats:', error);
            showError(statsCards.news, growthIndicators.news);
        }
    });

    // Replace the comments query with job views query
    const jobViewsQuery = query(collection(db, 'jobs'));
    const jobViewsLastMonthQuery = query(collection(db, 'jobs'), where('createdAt', '<', thisMonth));

    onSnapshot(jobViewsQuery, async (snapshot) => {
        try {
            const currentViews = snapshot.docs.reduce((sum, doc) => sum + (doc.data().views || 0), 0);
            const lastMonthSnapshot = await getDocs(jobViewsLastMonthQuery);
            const lastMonthViews = lastMonthSnapshot.docs.reduce((sum, doc) => sum + (doc.data().views || 0), 0);
            updateStats('views', currentViews, lastMonthViews, statsCards.views, growthIndicators.views);
        } catch (error) {
            console.error('Error fetching job views stats:', error);
            showError(statsCards.views, growthIndicators.views);
        }
    });
}

function updateStats(type, currentCount, lastMonthCount, cardElement, growthElement) {
    // Calculate growth percentage
    const growth = lastMonthCount === 0 ? 100 : ((currentCount - lastMonthCount) / lastMonthCount) * 100;
    const isPositive = growth >= 0;

    // Update count
    cardElement.textContent = currentCount.toLocaleString();

    // Update growth indicator
    growthElement.innerHTML = `
        <i class="bi bi-arrow-${isPositive ? 'up' : 'down'}"></i> 
        ${Math.abs(growth).toFixed(1)}%
    `;
    growthElement.className = `card-growth ${isPositive ? 'positive' : 'negative'}`;
}

function showError(cardElement, growthElement) {
    cardElement.textContent = 'Error';
    growthElement.innerHTML = '<i class="bi bi-exclamation-triangle"></i>';
    growthElement.className = 'card-growth negative';
}

// Add this function to handle jobs overview
async function initializeJobsOverview() {
    const jobsRef = collection(db, 'jobs');
    const statsElements = {
        private: document.querySelector('.jobs-stats .stat-item:nth-child(1) .stat-value'),
        govt: document.querySelector('.jobs-stats .stat-item:nth-child(2) .stat-value'),
        bank: document.querySelector('.jobs-stats .stat-item:nth-child(3) .stat-value')
    };

    // Get date ranges
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now); // Create a new date object
    weekStart.setDate(now.getDate() - now.getDay()); // Modify the copy instead
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const yearStart = new Date(now.getFullYear(), 0, 1);

    // Update stats based on selected time range
    async function updateJobStats(startDate) {
        try {
            // Convert dates to ISO string format
            const firestoreStartDate = startDate.toISOString();
            const firestoreEndDate = new Date().toISOString();
            
            
            const jobsQuery = query(jobsRef,
                where('createdAt', '>=', firestoreStartDate),
                where('createdAt', '<=', firestoreEndDate)
            );

            const snapshot = await getDocs(jobsQuery);
            
            const stats = {
                private: 0,
                govt: 0,
                bank: 0
            };

            snapshot.forEach(doc => {
                const jobData = doc.data();
                console.log('Job data:', { id: doc.id, jobType: jobData.jobType, createdAt: jobData.createdAt });
                
                switch(jobData.jobType) {
                    case 'private':
                        stats.private++;
                        break;
                    case 'govt':
                        stats.govt++;
                        break;
                    case 'bank':
                        stats.bank++;
                        break;
                }
            });

            console.log('Calculated stats:', stats);

            // Update UI
            Object.keys(stats).forEach(type => {
                if (statsElements[type]) {
                    statsElements[type].textContent = stats[type];
                }
            });

            // Update chart
            updateJobsChart(snapshot.docs.map(doc => doc.data()));
        } catch (error) {
            console.error('Error fetching job stats:', error);
            Object.keys(statsElements).forEach(type => {
                statsElements[type].textContent = 'Error';
            });
        }
    }

    // Update chart date handling
    function updateJobsChart(jobs) {
        const ctx = document.getElementById('jobsChart').getContext('2d');
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        const data = {
            private: new Array(6).fill(0),
            govt: new Array(6).fill(0),
            bank: new Array(6).fill(0)
        };

        // Get last 6 months
        const months = [];
        for (let i = 5; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            months.push(monthNames[date.getMonth()]);
        }

        // Group jobs by month and type
        jobs.forEach(job => {
            const jobDate = new Date(job.createdAt); // Parse string timestamp
            const monthIndex = months.indexOf(monthNames[jobDate.getMonth()]);
            if (monthIndex !== -1) {
                data[job.jobType][monthIndex]++;
            }
        });

        // Properly handle chart destruction
        const chartStatus = Chart.getChart(ctx.canvas);
        if (chartStatus !== undefined) {
            chartStatus.destroy();
        }

        // Create new chart
        const newChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: months,
                datasets: [
                    {
                        label: 'Private Jobs',
                        data: data.private,
                        backgroundColor: 'rgba(54, 162, 235, 0.7)',
                        borderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Govt Jobs',
                        data: data.govt,
                        backgroundColor: 'rgba(75, 192, 192, 0.7)',
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Bank Jobs',
                        data: data.bank,
                        backgroundColor: 'rgba(255, 159, 64, 0.7)',
                        borderColor: 'rgba(255, 159, 64, 1)',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    // Add event listeners for time range buttons
    document.querySelectorAll('.dropdown-menu .dropdown-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const range = e.target.textContent.trim(); // Add trim() to clean up whitespace
            let startDate;

            switch(range) {
                case 'Today':
                    startDate = today;
                    break;
                case 'This Week':
                    startDate = weekStart;
                    break;
                case 'This Month':
                    startDate = monthStart;
                    break;
                case 'This Year':
                    startDate = yearStart;
                    break;
            }

            // Update both the stats and the button text
            updateJobStats(startDate);
            // Use more specific selector to target the jobs overview dropdown
            document.querySelector('.jobs-overview-card .dropdown-toggle').textContent = range;
        });
    });

    // Initial load with 'This Month' selected
    updateJobStats(monthStart);
    // Set initial dropdown text
    document.querySelector('.jobs-overview-card .dropdown-toggle').textContent = 'This Month';
}


auth.onAuthStateChanged((user) => {
    if (user) {
        initializeStatsCards();
        initializeJobsOverview();
    }
});

// Add this function to handle logout
function handleLogout(e) {
    e.preventDefault();
    auth.signOut().then(() => {
        window.location.href = 'login.html';
    });
}


// Initialize comments count
function initializeCommentsCount() {
    const commentsRef = collection(db, 'jobComments');
    const unreadCommentsQuery = query(
        commentsRef,
        orderBy('createdAt', 'desc')
    );

    onSnapshot(unreadCommentsQuery, (snapshot) => {
        const commentsCount = snapshot.size;
        const commentsBadge = document.querySelector('.nav-link[href="comments.html"] .badge');
        
        if (commentsBadge) {
            if (commentsCount > 0) {
                commentsBadge.textContent = commentsCount;
                commentsBadge.style.display = 'inline-block';
            } else {
                commentsBadge.style.display = 'none';
            }
        }
    });
}

// Update the auth.onAuthStateChanged to include comments count initialization
auth.onAuthStateChanged((user) => {
    if (user) {
        // Get additional user data from Firestore
        const userRef = doc(db, 'users', user.uid);
        getDoc(userRef).then((doc) => {
            const userData = doc.data() || {};
            const firstName = capitalizeFirstLetter(userData.firstName || user.email.split('@')[0]);
            const profileImage = userData.profileImageUrl || user.profileImageUrl || '/images/default.webp';
            const userRole = userData.role || 'User';

            // Update top navigation user menu
            userMenuDropdown.innerHTML = `
                <div class="dropdown">
                    <button class="user-dropdown" data-bs-toggle="dropdown">
                        <div class="user-avatar">
                            <img src="${profileImage}" alt="${firstName}">
                            <span class="status-indicator online"></span>
                        </div>
                        <div class="user-info">
                            <span class="user-name">${firstName}</span>
                        </div>
                        <i class="bi bi-chevron-down"></i>
                    </button>
                    <ul class="dropdown-menu dropdown-menu-end animate slideIn">
                        <li class="dropdown-header">Welcome, ${firstName}!</li>
                        <li><a class="dropdown-item" href="profile.html">
                            <i class="bi bi-person-circle me-2"></i>My Profile
                        </a></li>
                        <li><a class="dropdown-item" href="settings.html">
                            <i class="bi bi-gear me-2"></i>Settings
                        </a></li>
                        <li><hr class="dropdown-divider"></li>
                        <li><a class="dropdown-item" href="#" id="logoutBtn">
                            <i class="bi bi-box-arrow-right me-2"></i>Sign Out
                        </a></li>
                    </ul>
                </div>
            `;

            // Update sidebar footer
            const sidebarFooter = document.querySelector('.sidebar-footer');
            sidebarFooter.innerHTML = `
                <div class="user-profile">
                    <img src="${profileImage}" alt="${firstName}" class="profile-img">
                    <div class="profile-info">
                        <h6 class="profile-name">${firstName}</h6>
                        <span class="profile-role">${userRole}</span>
                    </div>
                </div>
                <a href="#" class="logout-btn" id="sidebarLogoutBtn">
                    <i class="bi bi-box-arrow-right"></i>
                </a>
            `;

            // Add event listeners for both logout buttons
            document.getElementById('logoutBtn').addEventListener('click', handleLogout);
            document.getElementById('sidebarLogoutBtn').addEventListener('click', handleLogout);
        });

        initializeNotifications();
        initializeCommentsCount(); // Add this line
    } else {
        userMenuDropdown.innerHTML = `
            <div class="dropdown">
                <button class="user-dropdown" data-bs-toggle="dropdown">
                    <i class="bi bi-person-circle me-2"></i>
                    <span>Account</span>
                    <i class="bi bi-chevron-down"></i>
                </button>
                <ul class="dropdown-menu dropdown-menu-end animate slideIn">
                    <li><a class="dropdown-item" href="login.html">
                        <i class="bi bi-box-arrow-in-right me-2"></i>Sign In
                    </a></li>
                    <li><a class="dropdown-item" href="signup.html">
                        <i class="bi bi-person-plus me-2"></i>Sign Up
                    </a></li>
                </ul>
            </div>
        `;

        notificationsDropdown.innerHTML = '';
    }
});
