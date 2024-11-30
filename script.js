document.addEventListener('DOMContentLoaded', () => {
    const copySvgCodeBtn = document.getElementById('copySvgCodeBtn');
    const svgCodePreview = document.getElementById('svgCodePreview');
    const tooltipElement = copySvgCodeBtn.querySelector('.tooltip');
    const tickIcon = copySvgCodeBtn.querySelector('.tick-icon');
    copySvgCodeBtn.addEventListener('click', () => {
        // Show the tick icon
        tickIcon.style.display = 'inline-block';
        // Create a temporary textarea to copy text
        const tempTextArea = document.createElement('textarea');
        tempTextArea.value = svgCodePreview.textContent;
        document.body.appendChild(tempTextArea);
        
        // Select and copy the text
        tempTextArea.select();
        document.execCommand('copy');
        
        // Remove the temporary textarea
        document.body.removeChild(tempTextArea);

        // Animate the copy button
        copySvgCodeBtn.classList.add('copied');
        tooltipElement.textContent = 'Copied!';
        
        // Reset the animation after 2 seconds
        setTimeout(() => {
            copySvgCodeBtn.classList.remove('copied');
            tooltipElement.textContent = 'Copy SVG';
        }, 2000);
    });

    // Reset tooltip on mouseout
    copySvgCodeBtn.addEventListener('mouseout', () => {
        tooltipElement.textContent = 'Copy SVG';
    });
});

const searchInput = document.getElementById('iconSearch');
const searchBtn = document.getElementById('searchBtn');
const iconResults = document.getElementById('iconResults');
const loadingIndicator = document.getElementById('loading');
const prefixSelect = document.getElementById('prefixSelect');
const limitSelect = document.getElementById('limitSelect');
const prevButton = document.getElementById('prevButton');
const nextButton = document.getElementById('nextButton');
const pageInfo = document.getElementById('pageInfo');

let currentStart = 0;
let totalIcons = 0;
let currentLimit = 12;
// Icon Preview Modal Functionality
const iconPreviewModal = document.getElementById('iconPreviewModal');
const closePreviewModal = document.getElementById('closePreviewModal');
const modalIconName = document.getElementById('modalIconName');
const modalIconPreview = document.getElementById('modalIconPreview');
const svgCodePreview = document.getElementById('svgCodePreview');
const downloadIcon = document.getElementById('downloadIcon');

let currentSelectedIcon = null;

function openIconPreview(iconName) {
    const iconPreviewModal = document.getElementById('iconPreviewModal');
    const modalIconName = document.getElementById('modalIconName');
    const modalIconPreview = document.getElementById('modalIconIcon');
    const svgCodePreview = document.getElementById('svgCodePreview');
    currentSelectedIcon = iconName;
    // Set modal content
    modalIconName.textContent = iconName;
    
    // Use Iconify to render the icon
    modalIconPreview.setAttribute('icon', iconName);
    
    // Fetch SVG content
    const iconElement = document.querySelector(`[data-icon="${iconName}"]`);
    const svgContent = iconElement ? 
    `<svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24" viewBox="0 0 24 24">${iconElement.innerHTML}</svg>` :
    'SVG not available'; // Fallback if no SVG is found
    svgCodePreview.textContent = svgContent;

    // Show modal with animation
    iconPreviewModal.classList.add('visible');
}

// Event Listeners
document.getElementById('closePreviewModal').addEventListener('click', () => {
    const iconPreviewModal = document.getElementById('iconPreviewModal');
    iconPreviewModal.classList.remove('visible');
});

// Close modal when clicking outside
document.getElementById('iconPreviewModal').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) {
        e.currentTarget.classList.remove('visible');
    }
});
closePreviewModal.addEventListener('click', () => {
    iconPreviewModal.classList.remove('visible');
});


downloadIcon.addEventListener('click', () => {
    const iconName = currentSelectedIcon;             
    const iconElement = document.querySelector(`[data-icon="${iconName}"]`);
    
    if (!iconElement) {
        console.error('Icon not found');
        return;
    }

    // Wrap the path with the proper <svg> structure
    const svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">${iconElement.innerHTML}</svg>`;

    // Convert SVG string to an SVG Blob and create a URL for it
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml' });
    const svgUrl = URL.createObjectURL(svgBlob);

    // Create an image element
    const img = new Image();
    img.src = svgUrl;

    img.onload = () => {
        console.log('Image loaded successfully');  // Debugging log
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;

        ctx.drawImage(img, 0, 0);

        canvas.toBlob(blob => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${iconName.replace(/:/g, '_')}.png`;
            a.click();
        }, 'image/png');
    };

    // Error handling for image loading
    img.onerror = (e) => {
        console.error(e);
        console.error('Error loading the image');
    };
});

async function searchIcons() {
    const query = searchInput.value.trim();
    const prefix = prefixSelect.value;
    const limit = parseInt(limitSelect.value);

    if (!query) {
        alert('Please enter a search query');
        return;
    }

    loadingIndicator.style.display = 'block';
    iconResults.innerHTML = '';
    
    try {
        // Construct the search URL with parameters
        const searchUrl = new URL('https://api.iconify.design/search');
        searchUrl.searchParams.set('query', query);
        searchUrl.searchParams.set('limit', limit);
        searchUrl.searchParams.set('start', currentStart);
        
        // Add prefix if selected
        if (prefix) {
            searchUrl.searchParams.set('prefixes', prefix);
        }

        const response = await fetch(searchUrl);
        
        if (!response.ok) {
            throw new Error('Search request failed');
        }

        const data = await response.json();
        
        // Update total icons and pagination
        totalIcons = data.total;
        updatePagination();

        // Render icons
        if (data.icons && data.icons.length > 0) {
            data.icons.forEach(async (icon) => {
                const card = await createIconCard(icon);
                iconResults.appendChild(card);
            });
        } else {
            iconResults.innerHTML = '<p style="width:100%; text-align:center;">No icons found</p>';
        }
    } catch (error) {
        console.error('Search error:', error);
        iconResults.innerHTML = `<p style="width:100%; text-align:center;">Error: ${error.message}</p>`;
    } finally {
        loadingIndicator.style.display = 'none';
    }
}

function updatePagination() {
    const lastIcon = Math.min(currentStart + currentLimit, totalIcons);
    
    pageInfo.textContent = `${currentStart + 1} - ${lastIcon} of ${totalIcons}`;
    
    prevButton.disabled = currentStart === 0;
    nextButton.disabled = currentStart + currentLimit >= totalIcons;
}

async function createIconCard(icon) {
    const card = document.createElement('div');
    card.className = 'icon-card';

    const preview = document.createElement('div');
    preview.className = 'icon-preview';
    
    const iconElement = document.createElement('span');
    iconElement.className = 'iconify';
    iconElement.setAttribute('data-icon', icon);
    iconElement.setAttribute('width', '64');
    iconElement.setAttribute('height', '64');
    
    preview.appendChild(iconElement);

    const nameDisplay = document.createElement('div');
    nameDisplay.className = 'icon-name';
    nameDisplay.textContent = icon;

    card.appendChild(preview);
    card.appendChild(nameDisplay);
    card.addEventListener('click', () => openIconPreview(icon));

    return card;
}

function createDownloadButton(iconName, type, iconClass) {
    const btn = document.createElement('button');
    btn.className = 'download-btn';
    btn.innerHTML = `<i class="${iconClass}"></i> ${type}`;
    btn.onclick = () => downloadIcon(iconName, type);
    return btn;
}

// Event Listeners
searchBtn.addEventListener('click', () => {
    currentStart = 0;
    searchIcons();
});

searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        currentStart = 0;
        searchIcons();
    }
});

// Pagination Buttons
prevButton.addEventListener('click', () => {
    currentStart = Math.max(0, currentStart - currentLimit);
    searchIcons();
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

nextButton.addEventListener('click', () => {
    currentStart += currentLimit;
    searchIcons();
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
});


// Update limit when changed
limitSelect.addEventListener('change', () => {
    currentLimit = parseInt(limitSelect.value);
    currentStart = 0;
    searchIcons();
});

// Initial load
window.addEventListener('load', () => {
    searchInput.value = 'home'; // Default search
    searchIcons();
});