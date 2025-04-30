import { auth, db } from './firebase-config.js';
import { 
    collection, 
    query, 
    where, 
    orderBy, 
    getDocs,
    getCountFromServer,
    doc,
    deleteDoc,
    updateDoc 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

async function loadAllData() {
    try {
        // Total Articles Count
        const articlesSnapshot = await getCountFromServer(collection(db, 'news'));
        document.getElementById('articlesCount').textContent = articlesSnapshot.data().count;

        // Total Users Count
        const usersSnapshot = await getCountFromServer(collection(db, 'users'));
        document.getElementById('usersCount').textContent = usersSnapshot.data().count;

        // Total Views (sum of views from all news articles)
        const newsRefcount = collection(db, 'news');
        const newsSnapshot = await getDocs(newsRefcount);
        const totalNewsViews = newsSnapshot.docs.reduce((sum, doc) => sum + (doc.data().views || 0), 0);
        document.getElementById('newsViewsCount').textContent = totalNewsViews;

        // Total Job Views (sum of views from jobs collection)
        const jobsviews = collection(db, 'jobs');
        const jobsSnapshot = await getDocs(jobsviews);
        const totalJobViews = jobsSnapshot.docs.reduce((sum, doc) => sum + (doc.data().views || 0), 0);
        document.getElementById('jobViewsCount').textContent = totalJobViews;

        // News Statistics
        const newsRef = collection(db, 'news');
        const activeNewsQuery = query(newsRef, where('approvalStatus', '==', 'approved'));
        const activeNewsCount = await getCountFromServer(activeNewsQuery);
        const totalNewsCount = await getCountFromServer(newsRef);
        
        document.getElementById('activeNewsCount').textContent = activeNewsCount.data().count;
        document.getElementById('totalNewsCount').textContent = totalNewsCount.data().count;

        // Jobs Statistics
        const jobsRef = collection(db, 'jobs');
        const today = new Date();
        const activeJobsQuery = query(jobsRef, where('isActive', '==', true));
        const expiredJobsQuery = query(jobsRef, where('lastDate', '<', today));
        
        const activeJobsCount = await getCountFromServer(activeJobsQuery);
        const expiredJobsCount = await getCountFromServer(expiredJobsQuery);
        
        document.getElementById('activeJobsCount').textContent = activeJobsCount.data().count;
        document.getElementById('expiredJobsCount').textContent = expiredJobsCount.data().count;

        // Stories Statistics
        const storiesRef = collection(db, 'stories');
        const publishedStoriesQuery = query(storiesRef, where('status', '==', 'published'));
        const draftStoriesQuery = query(storiesRef, where('status', '==', 'draft'));
        
        const publishedStoriesCount = await getCountFromServer(publishedStoriesQuery);
        const draftStoriesCount = await getCountFromServer(draftStoriesQuery);
        
        document.getElementById('publishedStoriesCount').textContent = publishedStoriesCount.data().count;
        document.getElementById('draftStoriesCount').textContent = draftStoriesCount.data().count;

        // Affiliate Posts Statistics
        const affiliateRef = collection(db, 'affiliate');
        const activeAffiliateQuery = query(affiliateRef, where('status', '==', 'active'));
        const activeAffiliateCount = await getCountFromServer(activeAffiliateQuery);
        
        // Calculate total clicks
        const affiliateSnapshot = await getDocs(affiliateRef);
        const totalClicks = affiliateSnapshot.docs.reduce((sum, doc) => sum + (doc.data().clicks || 0), 0);
        
        document.getElementById('activeAffiliateCount').textContent = activeAffiliateCount.data().count;
        document.getElementById('totalAffiliateClicks').textContent = totalClicks;

    } catch (error) {
        console.error('Error loading statistics:', error);
        alert('Failed to load some statistics. Please refresh the page.');
    }
}

// Initialize when auth state changes
onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = 'login.html';
    } else {
        document.getElementById('userName').textContent = user.email;
        loadAllData();
        loadTables(); // Make sure this function exists to load table data
    }
});

// Add error handling for the statistics
window.addEventListener('error', (event) => {
    console.error('Error in statistics:', event.error);
    const affectedElement = event.target.id;
    if (affectedElement) {
        document.getElementById(affectedElement).textContent = 'Error';
    }
});

// Add this function after loadAllData()
async function loadTables() {
    try {
        // Load News Table
        const newsRef = collection(db, 'news');
        const newsQuery = query(newsRef, orderBy('createdAt', 'desc'));
        const newsSnapshot = await getDocs(newsQuery);
        const newsTableBody = document.getElementById('newsTableBody');
        newsTableBody.innerHTML = '';
        newsSnapshot.forEach(doc => {
            const news = doc.data();
            newsTableBody.innerHTML += `
                <tr>
                    <td>${news.title}</td>
                    <td>${news.category}</td>
                    <td>${new Date(news.createdAt?.toDate()).toLocaleDateString()}</td>
                    <td>${news.views || 0}</td>
                    <td>
                        <button class="btn btn-sm btn-primary edit-btn" data-id="${doc.id}" data-type="news">Edit</button>
                        <button class="btn btn-sm btn-danger delete-btn" data-id="${doc.id}" data-type="news">Delete</button>
                    </td>
                </tr>`;
        });

        // Load Jobs Table
        const jobsRef = collection(db, 'jobs');
        const jobsQuery = query(jobsRef, orderBy('createdAt', 'desc'));
        const jobsSnapshot = await getDocs(jobsQuery);
        const jobsTableBody = document.getElementById('jobsTableBody');
        jobsTableBody.innerHTML = '';
        jobsSnapshot.forEach(doc => {
            const job = doc.data();
            jobsTableBody.innerHTML += `
                <tr>
                    <td>${job.jobTitle}</td>
                    <td>${job.companyName}</td>
                    <td>${job.createdAt ? (job.createdAt.seconds ? new Date(job.createdAt.seconds * 1000).toLocaleDateString() : new Date(job.createdAt).toLocaleDateString()) : 'N/A'}</td>
                    <td>${job.lastDate ? (job.lastDate.seconds ? new Date(job.lastDate.seconds * 1000).toLocaleDateString() : new Date(job.lastDate).toLocaleDateString()) : 'No deadline'}</td>
                    <td>${job.status}</td>
                    <td>
                        <button class="btn btn-sm btn-primary edit-btn" data-id="${doc.id}" data-type="jobs">Edit</button>
                        <button class="btn btn-sm btn-danger delete-btn" data-id="${doc.id}" data-type="jobs">Delete</button>
                    </td>
                </tr>`;
        });

        // Load Stories Table
        const storiesRef = collection(db, 'stories');
        const storiesQuery = query(storiesRef, orderBy('createdAt', 'desc'));
        const storiesSnapshot = await getDocs(storiesQuery);
        const storiesTableBody = document.getElementById('storiesTableBody');
        storiesTableBody.innerHTML = '';
        storiesSnapshot.forEach(doc => {
            const story = doc.data();
            storiesTableBody.innerHTML += `
                <tr>
                    <td>${story.title}</td>
                    <td>${story.category}</td>
                    <td>${story.chapters || 0}</td>
                    <td>${story.status}</td>
                    <td>${story.views || 0}</td>
                    <td>
                        <button class="btn btn-sm btn-primary edit-btn" data-id="${doc.id}" data-type="stories">Edit</button>
                        <button class="btn btn-sm btn-danger delete-btn" data-id="${doc.id}" data-type="stories">Delete</button>
                    </td>
                </tr>`;
        });

        // Load Affiliate Table
        const affiliateRef = collection(db, 'affiliate');
        const affiliateQuery = query(affiliateRef, orderBy('createdAt', 'desc'));
        const affiliateSnapshot = await getDocs(affiliateQuery);
        const affiliateTableBody = document.getElementById('affiliateTableBody');
        affiliateTableBody.innerHTML = '';
        affiliateSnapshot.forEach(doc => {
            const affiliate = doc.data();
            affiliateTableBody.innerHTML += `
                <tr>
                    <td>${affiliate.product}</td>
                    <td>${affiliate.category}</td>
                    <td>${affiliate.price}</td>
                    <td>${affiliate.clicks || 0}</td>
                    <td>${affiliate.status}</td>
                    <td>
                        <button class="btn btn-sm btn-primary edit-btn" data-id="${doc.id}" data-type="affiliate">Edit</button>
                        <button class="btn btn-sm btn-danger delete-btn" data-id="${doc.id}" data-type="affiliate">Delete</button>
                    </td>
                </tr>`;
        });

        // Add event listeners for edit and delete buttons
        document.querySelectorAll('.edit-btn').forEach(button => {
            button.removeEventListener('click', handleEdit); // Remove existing listeners
            button.addEventListener('click', handleEdit);
        });
        document.querySelectorAll('.delete-btn').forEach(button => {
            button.removeEventListener('click', handleDelete); // Remove existing listeners
            button.addEventListener('click', handleDelete);
        });

    } catch (error) {
        console.error('Error loading tables:', error);
        alert('Failed to load some data. Please refresh the page.');
    }
}

// Add these functions before loadTables
async function handleEdit(e) {
    e.preventDefault();
    const id = e.target.dataset.id;
    const type = e.target.dataset.type;
    // Map the type to the correct edit page and add edit parameter
    const editPages = {
        'news': 'upload-news.html',
        'jobs': 'jobs-upload.html',
        'stories': 'stories-upload.html',
        'affiliate': 'affiliate-upload.html'
    };
    const editPage = editPages[type] || `${type}-edit.html`;
    window.location.href = `${editPage}?id=${id}&edit=true`;
}

async function handleDelete(e) {
    e.preventDefault();
    const id = e.target.dataset.id;
    const type = e.target.dataset.type;
    
    if (confirm(`Are you sure you want to delete this ${type} item?`)) {
        try {
            await deleteDoc(doc(db, type, id));
            // Refresh the data
            await loadAllData();
            await loadTables();
        } catch (error) {
            console.error('Error deleting item:', error);
            alert('Failed to delete item. Please try again.');
        }
    }
}

// Add logout handler
const logoutBtn = document.getElementById('logoutBtn');
logoutBtn?.addEventListener('click', async () => {
    try {
        await auth.signOut();
        window.location.href = 'login.html';
    } catch (error) {
        console.error('Error during logout:', error);
        alert('Failed to logout. Please try again.');
    }
});