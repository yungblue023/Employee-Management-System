import React, { useState, useEffect } from 'react';
import { EmployeeAttachment } from '../types/Employee';
import EmployeeAPI from '../services/api';
import './AttachmentManager.css';

interface AttachmentManagerProps {
  employeeId: string;
  employeeName: string;
  isInline?: boolean; // For inline display in employee list
}

const AttachmentManager: React.FC<AttachmentManagerProps> = ({ 
  employeeId, 
  employeeName, 
  isInline = false 
}) => {
  const [attachments, setAttachments] = useState<EmployeeAttachment[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [previewFileUrl, setPreviewFileUrl] = React.useState<string | null>(null);
  const [previewFileType, setPreviewFileType] = React.useState<string>('');
  const [previewLoading, setPreviewLoading] = React.useState(false);

  useEffect(() => {
    loadAttachments();
  }, [employeeId]);

  // Cleanup blob URL on component unmount
  useEffect(() => {
    return () => {
      if (previewFileUrl) {
        window.URL.revokeObjectURL(previewFileUrl);
      }
    };
  }, [previewFileUrl]);

  const loadAttachments = async () => {
    setLoading(true);
    try {
      const files = await EmployeeAPI.getEmployeeFiles(employeeId);
      setAttachments(files);
    } catch (err: any) {
      setError(`Failed to load attachments: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (!allowedTypes.includes(file.type)) {
      setError('File type not supported. Please upload PDF, images, or documents.');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      await EmployeeAPI.uploadFile(employeeId, file);
      await loadAttachments(); // Reload attachments after upload

      // Reset file input
      event.target.value = '';
    } catch (err: any) {
      setError(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (attachmentId: string) => {
    if (!window.confirm('Are you sure you want to delete this attachment?')) {
      return;
    }

    try {
      await EmployeeAPI.deleteFile(attachmentId);
      await loadAttachments(); // Reload attachments after delete
    } catch (err: any) {
      setError(`Failed to delete attachment: ${err.message}`);
    }
  };

  const handlePreview = async (attachment: EmployeeAttachment) => {
    setPreviewLoading(true);
    try {
      const { blob, mimeType } = await EmployeeAPI.getFilePreview(attachment.id);
      const previewUrl = window.URL.createObjectURL(blob);
      setPreviewFileUrl(previewUrl);
      setPreviewFileType(mimeType);
    } catch (err: any) {
      setError(`Failed to preview file: ${err.message}`);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleDownload = async (attachment: EmployeeAttachment) => {
    try {
      await EmployeeAPI.downloadFile(attachment.id);
    } catch (err: any) {
      setError(`Failed to download file: ${err.message}`);
    }
  };

  const closePreview = () => {
    if (previewFileUrl) {
      window.URL.revokeObjectURL(previewFileUrl);
    }
    setPreviewFileUrl(null);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Inline version for employee list
  if (isInline) {
    return (
      <div className="attachment-inline">
        <button 
          className="btn btn-sm btn-outline-primary"
          onClick={() => setShowUploadModal(true)}
          title="Manage attachments"
        >
          Files ({attachments.length})
        </button>

        {showUploadModal && (
          <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Attachments - {employeeName}</h3>
                <button 
                  className="btn-close"
                  onClick={() => setShowUploadModal(false)}
                >
                  ×
                </button>
              </div>
              <div className="modal-body attachment-preview-modal">
                <AttachmentManager 
                  employeeId={employeeId} 
                  employeeName={employeeName} 
                  isInline={false} 
                />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Full version for modal/edit form
  return (
    <div className="attachment-manager">
      <div className="attachment-header">
        <h4>Employee Attachments</h4>
        <div className="upload-section">
          <input
            type="file"
            id="file-upload"
            name="file"
            onChange={handleFileUpload}
            disabled={uploading}
            style={{ display: 'none' }}
          />
          <label 
            htmlFor="file-upload" 
            className={`btn btn-primary ${uploading ? 'disabled' : ''}`}
          >
            {uploading ? 'Uploading...' : 'Upload File'}
          </label>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger">
          {error}
          <button 
            className="btn-close-alert"
            onClick={() => setError(null)}
          >
            ×
          </button>
        </div>
      )}

      {loading ? (
        <div className="loading">Loading attachments...</div>
      ) : attachments.length === 0 ? (
        <div className="no-attachments">
          No attachments uploaded yet.
        </div>
      ) : (
        <div className="attachment-list">
          {attachments.map((attachment) => (
            <div key={attachment.id} className="attachment-item">
              <div className="attachment-info">
                <div className="attachment-name">{attachment.originalName}</div>
                <div className="attachment-meta">
                  {formatFileSize(attachment.size)} • {new Date(attachment.uploadedAt).toLocaleDateString()}
                </div>
              </div>
              <div className="attachment-actions">
                <button 
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => handlePreview(attachment)}
                  disabled={previewLoading}
                >
                  Preview
                </button>
                <button 
                  className="btn btn-sm btn-outline-primary"
                  onClick={() => handleDownload(attachment)}
                >
                  Download
                </button>
                <button 
                  className="btn btn-sm btn-outline-danger"
                  onClick={() => handleDelete(attachment.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="upload-info">
        <small>
          Supported formats: PDF, Images (JPG, PNG, GIF), Documents (DOC, DOCX), Text files<br/>
          Maximum file size: 10MB
        </small>
      </div>

      {previewFileUrl && (
        <div className="modal-overlay" onClick={closePreview}>
          <div className="modal-content preview-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>File Preview</h3>
              <button
                className="btn-close"
                onClick={closePreview}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              {previewFileType.startsWith('image/') ? (
                <img
                  src={previewFileUrl}
                  alt="Preview"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '80vh',
                    objectFit: 'contain',
                    display: 'block',
                    margin: '0 auto'
                  }}
                />
              ) : previewFileType === 'application/pdf' ? (
                <iframe
                  src={previewFileUrl}
                  style={{
                    width: '100%',
                    height: '80vh',
                    border: 'none',
                    borderRadius: '4px'
                  }}
                />
              ) : (
                <div>Preview not available for this file type</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttachmentManager;
