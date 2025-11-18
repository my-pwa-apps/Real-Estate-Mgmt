// Microsoft Graph API - SharePoint & OneDrive Helper Functions

// ============================================
// SHAREPOINT SITE & DRIVE FUNCTIONS
// ============================================

// Get SharePoint site information
async function getSharePointSite() {
    try {
        const siteUrl = sharePointConfig.siteUrl.replace('https://', '').replace('http://', '');
        const [domain, ...pathParts] = siteUrl.split('/');
        const sitePath = pathParts.join('/');
        
        const site = await callMicrosoftGraph(`/sites/${domain}:/${sitePath}`);
        return site;
    } catch (error) {
        console.error('Error getting SharePoint site:', error);
        throw error;
    }
}

// Get default document library drive
async function getSharePointDrive() {
    try {
        const site = await getSharePointSite();
        const drive = await callMicrosoftGraph(`/sites/${site.id}/drive`);
        sharePointConfig.driveId = drive.id;
        return drive;
    } catch (error) {
        console.error('Error getting SharePoint drive:', error);
        throw error;
    }
}

// ============================================
// FOLDER MANAGEMENT
// ============================================

// Create folder structure for a pand
async function createPandFolder(pandData) {
    try {
        const folderName = `${pandData.adres.replace(/\s+/g, '_')} - ${pandData.postcode}`;
        const basePath = 'Panden';
        
        // Create main pand folder
        const pandFolder = await createFolder(basePath, folderName);
        
        // Create subfolders
        const subfolders = ["Foto's", "Documenten", "Technisch", "Verbouwing"];
        for (const subfolder of subfolders) {
            await createFolder(`${basePath}/${folderName}`, subfolder);
        }
        
        return {
            folderId: pandFolder.id,
            folderUrl: pandFolder.webUrl,
            folderPath: `${basePath}/${folderName}`
        };
    } catch (error) {
        console.error('Error creating pand folder:', error);
        throw error;
    }
}

// Create folder structure for a huurder
async function createHuurderFolder(huurderData) {
    try {
        const folderName = `${huurderData.achternaam}_${huurderData.voornaam}`;
        const basePath = 'Huurders';
        
        // Create main huurder folder
        const huurderFolder = await createFolder(basePath, folderName);
        
        // Create subfolders
        const subfolders = ["Contracten", "Correspondentie", "Documenten"];
        for (const subfolder of subfolders) {
            await createFolder(`${basePath}/${folderName}`, subfolder);
        }
        
        return {
            folderId: huurderFolder.id,
            folderUrl: huurderFolder.webUrl,
            folderPath: `${basePath}/${folderName}`
        };
    } catch (error) {
        console.error('Error creating huurder folder:', error);
        throw error;
    }
}

// Generic create folder function
async function createFolder(parentPath, folderName) {
    try {
        const drive = await getSharePointDrive();
        const driveId = drive.id;
        
        // Check if folder already exists
        try {
            const existing = await callMicrosoftGraph(
                `/drives/${driveId}/root:/${parentPath}/${folderName}`
            );
            return existing; // Folder exists, return it
        } catch (error) {
            // Folder doesn't exist, create it
        }
        
        const folderData = {
            name: folderName,
            folder: {},
            "@microsoft.graph.conflictBehavior": "rename"
        };
        
        const newFolder = await callMicrosoftGraph(
            `/drives/${driveId}/root:/${parentPath}:/children`,
            'POST',
            folderData
        );
        
        return newFolder;
    } catch (error) {
        console.error(`Error creating folder ${folderName}:`, error);
        throw error;
    }
}

// ============================================
// FILE UPLOAD & DOWNLOAD
// ============================================

// Upload file to SharePoint
async function uploadFileToSharePoint(file, folderPath, metadata = {}) {
    try {
        const drive = await getSharePointDrive();
        const driveId = drive.id;
        
        // For files smaller than 4MB, use simple upload
        if (file.size < 4 * 1024 * 1024) {
            const fileName = file.name;
            const uploadUrl = `/drives/${driveId}/root:/${folderPath}/${fileName}:/content`;
            
            const token = await getGraphAccessToken();
            const response = await fetch(`https://graph.microsoft.com/v1.0${uploadUrl}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': file.type
                },
                body: file
            });
            
            if (!response.ok) {
                throw new Error('Upload failed');
            }
            
            const uploadedFile = await response.json();
            
            // Add metadata if provided
            if (Object.keys(metadata).length > 0) {
                await updateFileMetadata(uploadedFile.id, metadata);
            }
            
            return uploadedFile;
        } else {
            // For larger files, use upload session (resumable)
            return await uploadLargeFile(file, folderPath, metadata);
        }
    } catch (error) {
        console.error('Error uploading file:', error);
        throw error;
    }
}

// Upload large file (> 4MB) with resumable upload
async function uploadLargeFile(file, folderPath, metadata = {}) {
    try {
        const drive = await getSharePointDrive();
        const driveId = drive.id;
        
        // Create upload session
        const sessionUrl = `/drives/${driveId}/root:/${folderPath}/${file.name}:/createUploadSession`;
        const session = await callMicrosoftGraph(sessionUrl, 'POST', {
            item: {
                "@microsoft.graph.conflictBehavior": "rename"
            }
        });
        
        // Upload in chunks
        const chunkSize = 320 * 1024; // 320 KB chunks
        let offset = 0;
        
        while (offset < file.size) {
            const chunk = file.slice(offset, offset + chunkSize);
            const chunkEnd = Math.min(offset + chunkSize, file.size);
            
            const token = await getGraphAccessToken();
            const response = await fetch(session.uploadUrl, {
                method: 'PUT',
                headers: {
                    'Content-Length': chunk.size,
                    'Content-Range': `bytes ${offset}-${chunkEnd - 1}/${file.size}`
                },
                body: chunk
            });
            
            if (!response.ok && response.status !== 202) {
                throw new Error('Chunk upload failed');
            }
            
            offset = chunkEnd;
        }
        
        // Get final file info
        const finalResponse = await fetch(session.uploadUrl);
        const uploadedFile = await finalResponse.json();
        
        // Add metadata
        if (Object.keys(metadata).length > 0) {
            await updateFileMetadata(uploadedFile.id, metadata);
        }
        
        return uploadedFile;
    } catch (error) {
        console.error('Error uploading large file:', error);
        throw error;
    }
}

// Download file from SharePoint
async function downloadFileFromSharePoint(fileId) {
    try {
        const drive = await getSharePointDrive();
        const driveId = drive.id;
        
        const fileInfo = await callMicrosoftGraph(`/drives/${driveId}/items/${fileId}`);
        
        // Get download URL
        const token = await getGraphAccessToken();
        const response = await fetch(fileInfo['@microsoft.graph.downloadUrl']);
        const blob = await response.blob();
        
        return {
            blob: blob,
            fileName: fileInfo.name,
            fileInfo: fileInfo
        };
    } catch (error) {
        console.error('Error downloading file:', error);
        throw error;
    }
}

// Update file metadata (for Copilot optimization)
async function updateFileMetadata(fileId, metadata) {
    try {
        const drive = await getSharePointDrive();
        const driveId = drive.id;
        
        // Update file properties
        await callMicrosoftGraph(
            `/drives/${driveId}/items/${fileId}`,
            'PATCH',
            {
                description: metadata.description || '',
                // Add custom metadata to description for Copilot
                name: metadata.newName || undefined
            }
        );
        
        return true;
    } catch (error) {
        console.error('Error updating file metadata:', error);
        throw error;
    }
}

// ============================================
// FILE LISTING & SEARCH
// ============================================

// List files in a folder
async function listFilesInFolder(folderPath) {
    try {
        const drive = await getSharePointDrive();
        const driveId = drive.id;
        
        const files = await callMicrosoftGraph(
            `/drives/${driveId}/root:/${folderPath}:/children`
        );
        
        return files.value;
    } catch (error) {
        console.error('Error listing files:', error);
        return [];
    }
}

// Search files in SharePoint
async function searchSharePointFiles(query) {
    try {
        const drive = await getSharePointDrive();
        const driveId = drive.id;
        
        const results = await callMicrosoftGraph(
            `/drives/${driveId}/root/search(q='${encodeURIComponent(query)}')`
        );
        
        return results.value;
    } catch (error) {
        console.error('Error searching files:', error);
        return [];
    }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

// Get file sharing link
async function getFileSharingLink(fileId) {
    try {
        const drive = await getSharePointDrive();
        const driveId = drive.id;
        
        const permission = await callMicrosoftGraph(
            `/drives/${driveId}/items/${fileId}/createLink`,
            'POST',
            {
                type: "view",
                scope: "organization"
            }
        );
        
        return permission.link.webUrl;
    } catch (error) {
        console.error('Error creating sharing link:', error);
        throw error;
    }
}

// Delete file
async function deleteFileFromSharePoint(fileId) {
    try {
        const drive = await getSharePointDrive();
        const driveId = drive.id;
        
        await callMicrosoftGraph(
            `/drives/${driveId}/items/${fileId}`,
            'DELETE'
        );
        
        return true;
    } catch (error) {
        console.error('Error deleting file:', error);
        throw error;
    }
}

// Export functions
window.getSharePointSite = getSharePointSite;
window.getSharePointDrive = getSharePointDrive;
window.createPandFolder = createPandFolder;
window.createHuurderFolder = createHuurderFolder;
window.createFolder = createFolder;
window.uploadFileToSharePoint = uploadFileToSharePoint;
window.downloadFileFromSharePoint = downloadFileFromSharePoint;
window.updateFileMetadata = updateFileMetadata;
window.listFilesInFolder = listFilesInFolder;
window.searchSharePointFiles = searchSharePointFiles;
window.getFileSharingLink = getFileSharingLink;
window.deleteFileFromSharePoint = deleteFileFromSharePoint;
