// Export Utilities for CSV and PDF
// Handles data export functionality for jobs and candidates

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Papa from 'papaparse';
import { JobListing } from './supabase';

export interface Candidate {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  current_position?: string;
  years_of_experience?: number;
  education?: string;
  skills?: string;
  resume_text?: string;
  status?: string;
  created_at: string;
}

/**
 * Export jobs to CSV
 */
export function exportJobsToCSV(jobs: JobListing[]): void {
  const csvData = jobs.map(job => ({
    'Job Title': job.title,
    'Department': job.department || 'N/A',
    'Location': job.location || 'N/A',
    'Status': job.status,
    'Description': job.description || 'N/A',
    'Requirements': job.requirements || 'N/A',
    'Created At': new Date(job.created_at).toLocaleDateString(),
  }));

  const csv = Papa.unparse(csvData);
  downloadFile(csv, 'jobs-export.csv', 'text/csv');
}

/**
 * Export candidates to CSV
 */
export function exportCandidatesToCSV(candidates: Candidate[]): void {
  const csvData = candidates.map(candidate => ({
    'First Name': candidate.first_name,
    'Last Name': candidate.last_name,
    'Email': candidate.email,
    'Phone': candidate.phone || 'N/A',
    'Current Position': candidate.current_position || 'N/A',
    'Years of Experience': candidate.years_of_experience || 'N/A',
    'Education': candidate.education || 'N/A',
    'Skills': candidate.skills || 'N/A',
    'Status': candidate.status || 'N/A',
    'Created At': new Date(candidate.created_at).toLocaleDateString(),
  }));

  const csv = Papa.unparse(csvData);
  downloadFile(csv, 'candidates-export.csv', 'text/csv');
}

/**
 * Export jobs to PDF
 */
export function exportJobsToPDF(jobs: JobListing[]): void {
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(18);
  doc.text('Job Listings Report', 14, 20);
  
  // Add generated date
  doc.setFontSize(10);
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 28);
  
  // Prepare table data
  const tableData = jobs.map(job => [
    job.title,
    job.department || 'N/A',
    job.location || 'N/A',
    job.status,
    new Date(job.created_at).toLocaleDateString(),
  ]);

  // Add table
  autoTable(doc, {
    head: [['Title', 'Department', 'Location', 'Status', 'Created']],
    body: tableData,
    startY: 35,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [79, 70, 229] }, // Indigo color
  });

  // Save PDF
  doc.save('jobs-export.pdf');
}

/**
 * Export single job with full details to PDF
 */
export function exportJobDetailsToPDF(job: JobListing): void {
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(20);
  doc.text(job.title, 14, 20);
  
  // Add metadata
  doc.setFontSize(10);
  doc.setTextColor(100);
  let yPos = 30;
  
  doc.text(`Department: ${job.department || 'N/A'}`, 14, yPos);
  yPos += 6;
  doc.text(`Location: ${job.location || 'N/A'}`, 14, yPos);
  yPos += 6;
  doc.text(`Status: ${job.status}`, 14, yPos);
  yPos += 6;
  doc.text(`Posted: ${new Date(job.created_at).toLocaleDateString()}`, 14, yPos);
  yPos += 12;
  
  // Add description
  doc.setFontSize(14);
  doc.setTextColor(0);
  doc.text('Description', 14, yPos);
  yPos += 8;
  
  doc.setFontSize(10);
  doc.setTextColor(60);
  const descriptionLines = doc.splitTextToSize(job.description || 'No description provided', 180);
  doc.text(descriptionLines, 14, yPos);
  yPos += (descriptionLines.length * 6) + 10;
  
  // Add requirements
  doc.setFontSize(14);
  doc.setTextColor(0);
  doc.text('Requirements', 14, yPos);
  yPos += 8;
  
  doc.setFontSize(10);
  doc.setTextColor(60);
  if (job.requirements) {
    const requirements = job.requirements.split(',').map(r => `• ${r.trim()}`);
    requirements.forEach(req => {
      doc.text(req, 14, yPos);
      yPos += 6;
    });
  } else {
    doc.text('No requirements specified', 14, yPos);
  }
  
  // Save PDF
  doc.save(`job-${job.title.replace(/\s+/g, '-').toLowerCase()}.pdf`);
}

/**
 * Export candidates to PDF
 */
export function exportCandidatesToPDF(candidates: Candidate[]): void {
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(18);
  doc.text('Candidates Report', 14, 20);
  
  // Add generated date
  doc.setFontSize(10);
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 28);
  
  // Prepare table data
  const tableData = candidates.map(candidate => [
    `${candidate.first_name} ${candidate.last_name}`,
    candidate.email,
    candidate.phone || 'N/A',
    candidate.current_position || 'N/A',
    candidate.years_of_experience?.toString() || 'N/A',
    candidate.status || 'N/A',
  ]);

  // Add table
  autoTable(doc, {
    head: [['Name', 'Email', 'Phone', 'Position', 'Experience', 'Status']],
    body: tableData,
    startY: 35,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [79, 70, 229] },
  });

  // Save PDF
  doc.save('candidates-export.pdf');
}

/**
 * Export single candidate profile to PDF
 */
export function exportCandidateProfileToPDF(candidate: Candidate): void {
  const doc = new jsPDF();
  
  // Add name
  doc.setFontSize(20);
  doc.text(`${candidate.first_name} ${candidate.last_name}`, 14, 20);
  
  // Add contact info
  doc.setFontSize(10);
  doc.setTextColor(100);
  let yPos = 30;
  
  doc.text(`Email: ${candidate.email}`, 14, yPos);
  yPos += 6;
  if (candidate.phone) {
    doc.text(`Phone: ${candidate.phone}`, 14, yPos);
    yPos += 6;
  }
  if (candidate.current_position) {
    doc.text(`Current Position: ${candidate.current_position}`, 14, yPos);
    yPos += 6;
  }
  if (candidate.years_of_experience) {
    doc.text(`Experience: ${candidate.years_of_experience} years`, 14, yPos);
    yPos += 6;
  }
  yPos += 8;
  
  // Add education
  if (candidate.education) {
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text('Education', 14, yPos);
    yPos += 8;
    
    doc.setFontSize(10);
    doc.setTextColor(60);
    doc.text(candidate.education, 14, yPos);
    yPos += 12;
  }
  
  // Add skills
  if (candidate.skills) {
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text('Skills', 14, yPos);
    yPos += 8;
    
    doc.setFontSize(10);
    doc.setTextColor(60);
    const skills = candidate.skills.split(',').map(s => `• ${s.trim()}`);
    skills.forEach(skill => {
      doc.text(skill, 14, yPos);
      yPos += 6;
    });
  }
  
  // Save PDF
  const fileName = `candidate-${candidate.first_name}-${candidate.last_name}`.replace(/\s+/g, '-').toLowerCase();
  doc.save(`${fileName}.pdf`);
}

/**
 * Helper function to download a file
 */
function downloadFile(content: string, fileName: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export audit logs to CSV
 */
export function exportAuditLogsTOCSV(logs: any[]): void {
  const csvData = logs.map(log => ({
    'Timestamp': new Date(log.created_at).toLocaleString(),
    'User ID': log.user_id,
    'Action': log.action,
    'Resource Type': log.resource_type,
    'Resource ID': log.resource_id || 'N/A',
    'Details': JSON.stringify(log.details || {}),
    'IP Address': log.ip_address || 'N/A',
  }));

  const csv = Papa.unparse(csvData);
  downloadFile(csv, 'audit-logs-export.csv', 'text/csv');
}
