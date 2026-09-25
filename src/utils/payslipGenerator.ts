import { jsPDF } from "jspdf";
import { Employee } from "../types";

export const generatePayslipPDF = (employee: Employee, monthYear: string = "August 2026") => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const basic = employee.salaryBasic || 85000;
  const hra = Math.round(basic * 0.4);
  const specialAllowance = Math.round(basic * 0.25);
  const transportAllowance = 3200;
  const grossEarnings = basic + hra + specialAllowance + transportAllowance;

  const pfDeduction = Math.round(basic * 0.12);
  const professionalTax = 200;
  const tds = Math.round(grossEarnings * 0.1);
  const totalDeductions = pfDeduction + professionalTax + tds;

  const netPay = grossEarnings - totalDeductions;

  // Header Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, 210, 38, "F");

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("WORQESTRA TECHNOLOGIES", 15, 18);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text("Enterprise Operational Intelligence & People Management", 15, 24);
  doc.text(`Official Monthly Salary Slip — ${monthYear}`, 15, 30);

  // Status Badge
  doc.setFillColor(16, 185, 129); // emerald-500
  doc.roundedRect(150, 14, 45, 10, 2, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("SALARY PAID", 160, 20.5);

  // Employee Information Box
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setFillColor(248, 250, 252); // slate-50
  doc.roundedRect(15, 45, 180, 42, 3, 3, "FD");

  doc.setTextColor(30, 41, 59); // slate-800
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("EMPLOYEE SUMMARY", 20, 53);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);

  // Column 1
  doc.text("Employee Name:", 20, 62);
  doc.setFont("helvetica", "bold");
  doc.text(employee.fullName, 55, 62);

  doc.setFont("helvetica", "normal");
  doc.text("Employee ID:", 20, 70);
  doc.setFont("helvetica", "bold");
  doc.text(employee.employeeNumber || "WQ-1001", 55, 70);

  doc.setFont("helvetica", "normal");
  doc.text("Designation:", 20, 78);
  doc.setFont("helvetica", "bold");
  doc.text(employee.designation, 55, 78);

  // Column 2
  doc.setFont("helvetica", "normal");
  doc.text("Department:", 110, 62);
  doc.setFont("helvetica", "bold");
  doc.text(employee.department, 145, 62);

  doc.setFont("helvetica", "normal");
  doc.text("Bank Account:", 110, 70);
  doc.setFont("helvetica", "bold");
  doc.text(employee.bankAccountMasked || "HDFC **** 8841", 145, 70);

  doc.setFont("helvetica", "normal");
  doc.text("Work Mode:", 110, 78);
  doc.setFont("helvetica", "bold");
  doc.text(`${employee.workMode || "On-site"} (${employee.location || "Bengaluru"})`, 145, 78);

  // Breakdown Table - Earnings & Deductions
  const startY = 95;

  // Earnings Header
  doc.setFillColor(37, 99, 235); // blue-600
  doc.rect(15, startY, 88, 8, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("EARNINGS", 20, startY + 5.5);
  doc.text("AMOUNT (INR)", 72, startY + 5.5);

  // Deductions Header
  doc.setFillColor(225, 29, 72); // rose-600
  doc.rect(107, startY, 88, 8, "F");
  doc.setTextColor(255, 255, 255);
  doc.text("DEDUCTIONS", 112, startY + 5.5);
  doc.text("AMOUNT (INR)", 164, startY + 5.5);

  // Table rows
  const rows = [
    { earn: "Basic Salary", earnAmt: `Rs. ${basic.toLocaleString()}`, ded: "Provident Fund (PF 12%)", dedAmt: `Rs. ${pfDeduction.toLocaleString()}` },
    { earn: "House Rent Allowance (HRA)", earnAmt: `Rs. ${hra.toLocaleString()}`, ded: "Professional Tax", dedAmt: `Rs. ${professionalTax.toLocaleString()}` },
    { earn: "Special Allowance", earnAmt: `Rs. ${specialAllowance.toLocaleString()}`, ded: "TDS / Income Tax", dedAmt: `Rs. ${tds.toLocaleString()}` },
    { earn: "Transport Allowance", earnAmt: `Rs. ${transportAllowance.toLocaleString()}`, ded: "Voluntary Deductions", dedAmt: "Rs. 0" },
  ];

  let currY = startY + 8;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(51, 65, 85);

  rows.forEach((r, idx) => {
    const bg = idx % 2 === 0 ? 255 : 248;
    doc.setFillColor(bg, bg, bg);
    doc.rect(15, currY, 88, 8, "F");
    doc.rect(107, currY, 88, 8, "F");

    doc.text(r.earn, 20, currY + 5.5);
    doc.text(r.earnAmt, 75, currY + 5.5);

    doc.text(r.ded, 112, currY + 5.5);
    doc.text(r.dedAmt, 168, currY + 5.5);

    currY += 8;
  });

  // Subtotals
  doc.setFillColor(241, 245, 249);
  doc.rect(15, currY, 88, 9, "F");
  doc.rect(107, currY, 88, 9, "F");

  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 41, 59);
  doc.text("Gross Earnings:", 20, currY + 6);
  doc.text(`Rs. ${grossEarnings.toLocaleString()}`, 75, currY + 6);

  doc.text("Total Deductions:", 112, currY + 6);
  doc.text(`Rs. ${totalDeductions.toLocaleString()}`, 168, currY + 6);

  // Net Pay Card
  currY += 15;
  doc.setDrawColor(37, 99, 235);
  doc.setFillColor(239, 246, 255); // blue-50
  doc.roundedRect(15, currY, 180, 24, 3, 3, "FD");

  doc.setTextColor(30, 41, 59);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("NET TAKE-HOME PAYABLE", 22, currY + 9);

  doc.setFontSize(16);
  doc.setTextColor(37, 99, 235);
  doc.text(`Rs. ${netPay.toLocaleString()}`, 22, currY + 18);

  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.setFont("helvetica", "italic");
  doc.text("Directly disbursed to verified corporate payroll account on 31-Aug-2026", 80, currY + 14);

  // Footer notes
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text("Note: This document is a digitally verified computer-generated payslip under Worqestra HRM Platform.", 15, 270);
  doc.text("For discrepancy inquiries, contact HR People Operations at hr.payroll@worqester.internal", 15, 274);

  doc.save(`Payslip_${employee.fullName.replace(/\s+/g, "_")}_${monthYear.replace(/\s+/g, "_")}.pdf`);
};
