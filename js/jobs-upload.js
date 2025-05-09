import { db, storage, auth, ref, uploadBytes, getDownloadURL } from './firebase-config.js';
import { collection, addDoc, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Move getIndianTimestamp to top level
function getIndianTimestamp() {
    const now = new Date();
    const indiaTime = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
    return indiaTime.toISOString();
}

// Handle form submission
document.getElementById('uploadJobForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    try {
        const user = auth.currentUser;
        if (!user) {
            throw new Error('User not authenticated');
        }

        // Show loading state
        const submitButton = document.getElementById('submitBtn');
        const loadingSpinner = submitButton.querySelector('.loading');
        submitButton.disabled = true;
        loadingSpinner.classList.add('active');

        // Handle company first
        let companyId;
        const companyName = document.getElementById('companyName').value;
        
        // Check if company exists
        const companiesRef = collection(db, 'companies');
        const companyQuery = query(companiesRef, where('name', '==', companyName));
        const companySnapshot = await getDocs(companyQuery);

        if (!companySnapshot.empty) {
            // Use existing company
            companyId = companySnapshot.docs[0].id;
        } else {
            // Create new company
            const logoFile = document.getElementById('companyLogo').files[0];
            let logoURL = '';
            
            if (logoFile) {
                const fileName = `companies/${companyName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${logoFile.name}`;
                const storageRef = ref(storage, fileName);
                await uploadBytes(storageRef, logoFile, {
                    contentType: logoFile.type
                });
                logoURL = await getDownloadURL(storageRef);
            }

            const companyData = {
                name: companyName,
                website: document.getElementById('companyWebsite').value,
                about: document.getElementById('aboutCompany').value,
                logoURL: logoURL,
                createdAt: getIndianTimestamp(),
                updatedAt: getIndianTimestamp()
            };

            const newCompanyRef = await addDoc(companiesRef, companyData);
            companyId = newCompanyRef.id;
        }

        // Prepare job data without company details
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
            companyId: companyId, // Reference to company document
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

        // Add job to Firestore
        const jobsCollection = collection(db, 'jobs');
        await addDoc(jobsCollection, jobData);
        
        // Show success message and reset form
        showAlert('Job posted successfully!', 'success');
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

// Company search functionality
document.getElementById('searchCompanyBtn').addEventListener('click', async () => {
    const companyName = document.getElementById('companyName').value.trim();
    if (!companyName) {
        showAlert('Please enter a company name to search', 'warning');
        return;
    }

    try {
        const companiesRef = collection(db, 'companies');
        const companyQuery = query(companiesRef, where('name', '==', companyName));
        const companySnapshot = await getDocs(companyQuery);

        if (companySnapshot.empty) {
            showAlert('No matching company found', 'warning');
            return;
        }

        const companyData = companySnapshot.docs[0].data();
        const companyId = companySnapshot.docs[0].id;

        // Populate form fields with company data
        document.getElementById('companyId').value = companyId;
        document.getElementById('companyName').value = companyData.name;
        document.getElementById('companyWebsite').value = companyData.website || '';
        document.getElementById('aboutCompany').value = companyData.about || '';

        // Show logo preview if exists
        const logoPreview = document.getElementById('logoPreview');
        if (companyData.logoURL) {
            logoPreview.src = companyData.logoURL;
            logoPreview.style.display = 'block';
        }

        // Check the "Use Existing Company" checkbox
        const useExistingCheckbox = document.getElementById('useExistingCompany');
        useExistingCheckbox.checked = true;
        
        // Disable company form fields
        document.getElementById('companyFormFields').style.display = 'none';

        showAlert('Company details loaded successfully', 'success');
    } catch (error) {
        console.error('Error searching company:', error);
        showAlert('Error searching company: ' + error.message, 'danger');
    }
});

// Toggle company form fields
document.getElementById('useExistingCompany').addEventListener('change', function() {
    const fields = document.getElementById('companyFormFields');
    fields.style.display = this.checked ? 'none' : 'block';
});

// When submitting the form
async function handleFormSubmit(event) {
    event.preventDefault();
    
    const useExisting = document.getElementById('useExistingCompany').checked;
    const companyId = document.getElementById('companyId').value;
    
    if (useExisting && companyId) {
        // Use existing company reference
        jobData.companyId = companyId;
    } else {
        // Create new company document
        const companyData = {
            name: document.getElementById('companyName').value,
            website: document.getElementById('companyWebsite').value,
            about: document.getElementById('aboutCompany').value
        };
        
        // Upload logo if provided
        const logoFile = document.getElementById('companyLogo').files[0];
        if (logoFile) {
            // Upload to storage and get URL
            // Add URL to companyData
        }
        
        // Check for existing company with same name to avoid duplicates
        // If exists, use that instead
        // If not, create new company document
        // Store the company reference in jobData
    }
    
    // Continue with job posting submission
}









