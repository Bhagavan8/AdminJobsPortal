import { db, storage, auth, ref, uploadBytes, getDownloadURL } from './firebase-config.js';
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Handle form submission
document.getElementById('uploadJobForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    try {
        // Check authentication
        const user = auth.currentUser;
        if (!user) {
            throw new Error('User not authenticated');
        }

        // Show loading state
        const submitButton = document.getElementById('submitBtn');
        const loadingSpinner = submitButton.querySelector('.loading');
        submitButton.disabled = true;
        loadingSpinner.classList.add('active');

        // Handle logo upload first
        const logoFile = document.getElementById('companyLogo').files[0];
        let logoURL = '';
        
        if (logoFile) {
            const fileName = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${logoFile.name}`;
            const storageRef = ref(storage, `company-logos/${fileName}`);
            
            // Upload the file
            await uploadBytes(storageRef, logoFile, {
                contentType: logoFile.type
            });
            logoURL = await getDownloadURL(storageRef);
        }
        
        // Prepare job data
        // Add this helper function at the top of your file
        function getIndianTimestamp() {
            const now = new Date();
            const indiaTime = new Date(now.getTime() + (5.5 * 60 * 60 * 1000)); // Add 5:30 hours for IST
            return indiaTime.toISOString();
        }
        
        // Update the jobData object timestamp fields
        const jobData = {
            jobTitle: document.getElementById('jobTitle').value,
            jobCategory: document.getElementById('jobCategory').value,
            jobType: document.getElementById('jobType').value,
            employmentType: document.getElementById('employmentType').value,
            experience: document.getElementById('experience').value,
            location: document.getElementById('location').value,
            educationLevel: document.getElementById('educationLevel').value,
            noticePeriod: document.getElementById('noticePeriod').value || null,
            skills: document.getElementById('skills').value.split(',').map(skill => skill.trim()),
            description: document.getElementById('description').value,
            qualifications: document.getElementById('qualifications').value.split('\n').filter(qual => qual.trim()),
            salary: document.getElementById('salary').value || null,
            lastDate: document.getElementById('lastDate').value || null,
            companyName: document.getElementById('companyName').value,
            companyWebsite: document.getElementById('companyWebsite').value,
            aboutCompany: document.getElementById('aboutCompany').value,
            companyLogo: logoURL || document.getElementById('companyLogo').value,
            socialLinks: {
                linkedin: document.getElementById('linkedinLink').value || null,
                facebook: document.getElementById('facebookLink').value || null,
                whatsapp: document.getElementById('whatsappLink').value || null
            },
            applicationMethod: document.getElementById('applicationMethod').value,
            applicationLink: document.getElementById('applicationLink').value,
            status: document.getElementById('status').value,
            isActive: document.getElementById('isActive').value === 'true',
            referralCode: document.getElementById('referralCode').value,
            postedBy: user.uid,
            createdAt: getIndianTimestamp(),
            updatedAt: getIndianTimestamp(),
            views: 0
        };

        // Add to Firestore using v9 syntax
        const jobsCollection = collection(db, 'jobs');
        await addDoc(jobsCollection, jobData);
        
        // Show success message
        showAlert('Job posted successfully!', 'success');
        
        // Reset form and UI
        document.getElementById('uploadJobForm').reset();
        document.getElementById('logoPreview').style.display = 'none';
        
    } catch (error) {
        console.error('Error posting job:', error);
        showAlert(error.message, 'danger');
    } finally {
        // Reset button state
        const submitButton = document.getElementById('submitBtn');
        const loadingSpinner = submitButton.querySelector('.loading');
        submitButton.disabled = false;
        loadingSpinner.classList.remove('active');
    }
});

// Preview logo image
document.getElementById('companyLogo').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        const preview = document.getElementById('logoPreview');
        
        reader.onload = (e) => {
            preview.src = e.target.result;
            preview.style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
});

// Helper function to show alerts
function showAlert(message, type = 'success') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.querySelector('.alert-container').appendChild(alertDiv);
    setTimeout(() => alertDiv.remove(), 5000);
}