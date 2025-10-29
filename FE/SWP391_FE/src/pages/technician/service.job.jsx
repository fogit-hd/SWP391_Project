import api from "../../config/axios";

/**
 * Service Job API Service
 * 
 * Status Flow:
 * SCHEDULED (initial) -> DONE or CANCELLED (final, cannot go back to SCHEDULED)
 */

/**
 * Get all service jobs (Admin only)
 * @returns {Promise} - Promise containing list of all service jobs
 */
export const getAllServiceJobs = async () => {
  try {
    const response = await api.get("/service-jobs");
    return response.data;
  } catch (error) {
    console.error("Error fetching all service jobs:", error);
    throw error;
  }
};

/**
 * Get specific service job by ID
 * @param {string} id - Service job ID
 * @returns {Promise} - Promise containing service job details
 */
export const getServiceJobById = async (id) => {
  try {
    const response = await api.get(`/service-jobs/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching service job ${id}:`, error);
    throw error;
  }
};

/**
 * Get my service jobs (Technician only)
 * Returns service jobs assigned to the logged-in technician
 * @returns {Promise} - Promise containing list of technician's service jobs
 */
export const getMyServiceJobs = async () => {
  try {
    const response = await api.get("/service-jobs/my");
    return response.data;
  } catch (error) {
    console.error("Error fetching my service jobs:", error);
    throw error;
  }
};

/**
 * Update service job status
 * Status can only transition from SCHEDULED to DONE or CANCELLED
 * Once changed to DONE or CANCELLED, cannot go back to SCHEDULED
 * 
 * @param {string} id - Service job ID
 * @param {string} status - New status (DONE or CANCELLED)
 * @returns {Promise} - Promise containing updated service job
 */
export const updateServiceJobStatus = async (id, status) => {
  try {
    // Validate status
    const validStatuses = ["DONE", "CANCELLED"];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status. Must be one of: ${validStatuses.join(", ")}`);
    }

    const response = await api.put(`/service-jobs/${id}/update-status`, {
      status: status,
    });
    return response.data;
  } catch (error) {
    console.error(`Error updating service job status ${id}:`, error);
    throw error;
  }
};

/**
 * Upload service job report
 * Accepts any file type: images, videos, documents, PDFs, text files, etc.
 * Returns reportUrl in the response
 * 
 * @param {string} id - Service job ID
 * @param {File} file - Report file to upload (any type)
 * @returns {Promise} - Promise containing reportUrl and updated service job data
 */
export const uploadServiceJobReport = async (id, file) => {
  try {
    // Validate file
    if (!file) {
      throw new Error("File is required");
    }

    // Create FormData for file upload
    const formData = new FormData();
    formData.append("ReportFile", file);

    // Send multipart/form-data request
    const response = await api.put(`/service-jobs/${id}/report`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  } catch (error) {
    console.error(`Error uploading report for service job ${id}:`, error);
    throw error;
  }
};

/**
 * Complete service job (update status to DONE and optionally upload report)
 * Convenience function to mark a job as done
 * 
 * @param {string} id - Service job ID
 * @returns {Promise} - Promise containing updated service job
 */
export const completeServiceJob = async (id) => {
  return await updateServiceJobStatus(id, "DONE");
};

/**
 * Cancel service job (update status to CANCELLED)
 * Convenience function to mark a job as cancelled
 * 
 * @param {string} id - Service job ID
 * @returns {Promise} - Promise containing updated service job
 */
export const cancelServiceJob = async (id) => {
  return await updateServiceJobStatus(id, "CANCELLED");
};

// Export all functions as default object as well
export default {
  getAllServiceJobs,
  getServiceJobById,
  getMyServiceJobs,
  updateServiceJobStatus,
  uploadServiceJobReport,
  completeServiceJob,
  cancelServiceJob,
};

